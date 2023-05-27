import { IncomingMessage } from "http";
import WebSocket, { PerMessageDeflateOptions, WebSocketServer } from "ws";
import { AppSensorEvent, Attack, Response } from "../../core/core.js";
import { Logger } from "../../logging/logging.js";
import { AccessDeniedError, ActionRequest, ActionResponse, UnAuthorizedActionError } from "../appsensor-websocket.js";

interface IWebSocketServerConfig {
    options: {
        host?: string | undefined;
        port?: number | undefined;
        backlog?: number | undefined;
        path?: string | undefined;
        noServer?: boolean | undefined;
        clientTracking?: boolean | undefined;
        perMessageDeflate?: boolean | PerMessageDeflateOptions | undefined;
        maxPayload?: number | undefined;
        skipUTF8Validation?: boolean | undefined;
    }
}

class WebSocketServerConfig implements IWebSocketServerConfig {
    options = {};
}

interface WebSocketAdditionalProperties {
    isAlive?: boolean;
    remoteAddress?: string;
}

type WebSocketExt = WebSocket.WebSocket & WebSocketAdditionalProperties;

class AppSensorWebSocketServer {

    protected static DEFAULT_PORT = 3000;

    protected static ACCESS_DENIED_CLOSE_CODE = 4000;

    protected server: WebSocketServer;

    constructor(config: WebSocketServerConfig | null = null,
                serverOptions? :WebSocket.ServerOptions) {

        let servOptions = serverOptions;
        if (!servOptions) {

            if (config) {
                servOptions = config.options;
            } else {
                servOptions = {port: AppSensorWebSocketServer.DEFAULT_PORT};
            }
        }

        this.server = new WebSocketServer(servOptions);

        const pingThunk = this.ping(this);

        const interval = setInterval(pingThunk, 30000);

        const onClientRequestThunk = this.onClientRequestWrapper(this);

        const isConnectionAllowedThunk = this.isConnectionAllowedWrapper(this);

        this.server.on('connection', function(ws:  WebSocketExt, req: IncomingMessage) {
            try {
                if (typeof req.headers['x-forwarded-for'] === 'string') {
                    ws.remoteAddress = req.headers['x-forwarded-for'].split(',')[0].trim();
                }
            } catch (error) {
                Logger.getServerLogger().trace('AppSensorWebSocketServer.server: ', error);
            }
            
            if (!ws.remoteAddress) {
                ws.remoteAddress = req.socket.remoteAddress;
            }

            Logger.getServerLogger().trace('AppSensorWebSocketServer.server: ', 'connection', 
                                           ' IP address: ', ws.remoteAddress);


            if (!isConnectionAllowedThunk(ws)) {
                
                Logger.getServerLogger().warn(`AppSensorWebSocketServer.server: Unknown client application with IP address: ${ws.remoteAddress} is trying to access the server`);
                Logger.getServerLogger().warn(`AppSensorWebSocketServer.server: Closing connection to client application with IP address: ${ws.remoteAddress}`);

                AppSensorWebSocketServer.reportAccessDenied(ws);

                ws.close(AppSensorWebSocketServer.ACCESS_DENIED_CLOSE_CODE, "Access denied");
            }

            ws.isAlive = true;
            ws.on('error', (error) => {
                Logger.getServerLogger().trace('AppSensorWebSocketServer.server: ', 'error ', error);
            });

            ws.on('message', onClientRequestThunk);
            
            ws.on('pong', function(this:  WebSocketExt) {
                Logger.getServerLogger().trace('AppSensorWebSocketServer.server: ', 'pong');

                this.isAlive = true;
            });
        });

        this.server.on('close', function close() {
            Logger.getServerLogger().trace('AppSensorWebSocketServer.server: ', 'close');

            clearInterval(interval);
        });
    }

    protected isConnectionAllowedWrapper(me: AppSensorWebSocketServer) {
        return function isConnectionAllowed(ws:  WebSocketExt): boolean {
            return me.isConnectionAllowed(ws);
        }
    }   

    protected isConnectionAllowed(ws:  WebSocketExt): boolean {
        //overwrite this method to controll the access
        return true;
    }

    protected isActionAuthorized(ws:  WebSocketExt, request: ActionRequest): boolean {
        //overwrite this method to check the authorization
        return true;
    }

    private ping(me: AppSensorWebSocketServer) {

        return function ping() {
            me.server.clients.forEach(function each(ws:  WebSocketExt) {
              if (ws.isAlive === false) return ws.terminate();
          
              ws.isAlive = false;
              ws.ping();
            });
        }
    }

    protected onClientRequestWrapper(me: AppSensorWebSocketServer) {

        return function onClientRequest(this:  WebSocketExt, data: WebSocket.RawData, isBinary: boolean) {
            Logger.getServerLogger().trace('AppSensorWebSocketServer.server: ', 'message');

            const request: ActionRequest = JSON.parse(data.toString());
            Object.setPrototypeOf(request, ActionRequest.prototype);

            if (!me.isActionAuthorized(this, request)) {
                Logger.getServerLogger().warn(`AppSensorWebSocketServer.onClientRequestWrapper:`+ 
                                              ` client application with IP address: ${this.remoteAddress}` + 
                                              ` is trying to perform unauthorized action: ${request.actionName}`);

                AppSensorWebSocketServer.reportUnAuthorizedAction(this, request);

            } else {
                me.onClientRequest(this, request);
            }
        }
    }

    protected onClientRequest(ws: WebSocketExt, request: ActionRequest) {
        //your code goes here
    }

    protected closeServer() {
        this.server.close((err?: Error | undefined) => {
            Logger.getServerLogger().trace('AppSensorWebSocketServer.closeServer');
            if (err) {
                Logger.getServerLogger().error('AppSensorWebSocketServer.closeServer: error', err);
            }
        });
    }

    protected broadcast(actionName: string, 
                        result: number | Object | null | string,
                        resultElementClass: string | null) {
        const response = new ActionResponse('', actionName, result, resultElementClass);

        this.server.clients.forEach(function each(client) {
            if (client.readyState === WebSocket.OPEN) {

              client.send(JSON.stringify(response), { binary: false });
            }
        });

    }

    protected static getParameter(request: ActionRequest, paramName: string): string | Object | undefined {
        let param: string | Object | undefined = undefined;

        if (request.parameters) {
            const propDescr = Object.getOwnPropertyDescriptor(request.parameters, paramName);
            if (propDescr) {
                param = propDescr.value;
            }
        } 

        return param;
    }

    protected static reportMissingParameter(ws: WebSocket, request: ActionRequest, paramName: string) {
        const response = new ActionResponse(request.id, 
                                            request.actionName,
                                            null,
                                            null,
                                            `Missing required parameter ${paramName}!`);

        ws.send(JSON.stringify(response));                                             
    }

    protected static reportError(ws: WebSocket, request: ActionRequest, error: any) {
        const response = new ActionResponse(request.id, 
                                            request.actionName,
                                            null,
                                            null,
                                            error.toString());

        ws.send(JSON.stringify(response));                                             
    }

    protected static reportAccessDenied(ws: WebSocket) {
        const response = new ActionResponse('', 
                                            '',
                                            null,
                                            null,
                                            new AccessDeniedError().toString(),
                                            true);

        ws.send(JSON.stringify(response));                                             
    }

    protected static reportUnAuthorizedAction(ws: WebSocket, request: ActionRequest) {
        const response = new ActionResponse(request.id, 
                                            request.actionName,
                                            null,
                                            null,
                                            new UnAuthorizedActionError(request.actionName).toString(),
                                            false,
                                            true);

        ws.send(JSON.stringify(response));                                             
    }

    protected static sendResult(ws: WebSocket, request: ActionRequest,
                                result: number | Object | null | string,
                                resultElementClass: string | null) {
        const response = new ActionResponse(request.id, 
                                            request.actionName,
                                            result,
                                            resultElementClass);

        ws.send(JSON.stringify(response));                                             
    }


}

export {AppSensorWebSocketServer, IWebSocketServerConfig, WebSocketServerConfig, WebSocketExt};