import WebSocket, { PerMessageDeflateOptions, WebSocketServer } from "ws";
import { AppSensorEvent, Attack, Response } from "../../core/core.js";
import { Logger } from "../../logging/logging.js";
import { MethodRequest, MethodResponse } from "../appsensor-websocket.js";

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
}

type WebSockedExt = WebSocket.WebSocket & WebSocketAdditionalProperties;

class AppSensorWebSocketServer {

    protected static DEFAULT_PORT = 3000;

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

        this.server.on('connection', function(ws:  WebSockedExt) {
            Logger.getServerLogger().trace('AppSensorWebSocketServer.server: ', 'connection');

            ws.isAlive = true;
            ws.on('error', (error) => {
                Logger.getServerLogger().trace('AppSensorWebSocketServer.server: ', 'error ', error);
            });

            ws.on('message', onClientRequestThunk);
            
            ws.on('pong', function(this:  WebSockedExt) {
                Logger.getServerLogger().trace('AppSensorWebSocketServer.server: ', 'pong');

                this.isAlive = true;
            });
        });

        this.server.on('close', function close() {
            Logger.getServerLogger().trace('AppSensorWebSocketServer.server: ', 'close');

            clearInterval(interval);
        });
    }

    private ping(me: AppSensorWebSocketServer) {

        return function ping() {
            me.server.clients.forEach(function each(ws:  WebSockedExt) {
              if (ws.isAlive === false) return ws.terminate();
          
              ws.isAlive = false;
              ws.ping();
            });
        }
    }

    private onClientRequestWrapper(me: AppSensorWebSocketServer) {

        return function onClientRequest(this:  WebSockedExt, data: WebSocket.RawData, isBinary: boolean) {
            Logger.getServerLogger().trace('AppSensorWebSocketServer.server: ', 'message');

            me.onClientRequest(this, data, isBinary);
        }
    }

    protected onClientRequest(ws:  WebSockedExt, data: WebSocket.RawData, isBinary: boolean) {
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

    protected broadcast(methodName: string, 
                        result: number | Object | null | string,
                        resultElementClass: string | null) {
        const response = new MethodResponse('', methodName, result, resultElementClass);

        this.server.clients.forEach(function each(client) {
            if (client.readyState === WebSocket.OPEN) {

              client.send(JSON.stringify(response), { binary: false });
            }
        });

    }

    protected static getParameter(request: MethodRequest, paramName: string): string | Object | undefined {
        let param: string | Object | undefined = undefined;

        if (request.parameters) {
            const propDescr = Object.getOwnPropertyDescriptor(request.parameters, paramName);
            if (propDescr) {
                param = propDescr.value;
            }
        } 

        return param;
    }

    protected static reportMissingParameter(ws: WebSocket, request: MethodRequest, paramName: string) {
        const response = new MethodResponse(request.id, 
                                            request.methodName,
                                            null,
                                            null,
                                            `Missing required parameter ${paramName}!`);

        ws.send(JSON.stringify(response));                                             
    }

    protected static reportError(ws: WebSocket, request: MethodRequest, error: any) {
        const response = new MethodResponse(request.id, 
                                            request.methodName,
                                            null,
                                            null,
                                            error.toString());

        ws.send(JSON.stringify(response));                                             
    }

    protected static sendResult(ws: WebSocket, request: MethodRequest,
                                result: number | Object | null | string,
                                resultElementClass: string | null) {
        const response = new MethodResponse(request.id, 
                                            request.methodName,
                                            result,
                                            resultElementClass);

        ws.send(JSON.stringify(response));                                             
    }


}

export {AppSensorWebSocketServer, IWebSocketServerConfig, WebSocketServerConfig, WebSockedExt};