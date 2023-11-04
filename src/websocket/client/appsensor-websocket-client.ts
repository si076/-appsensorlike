
import { Utils } from "@appsensorlike/appsensorlike/utils/Utils.js";
import { Logger } from "@appsensorlike/appsensorlike/logging/logging.js";
import { IValidateInitialize } from "@appsensorlike/appsensorlike/core/core.js";
import { ActionRequest, ActionResponse, UUID_QUERY_PARAM, ACTION_CONFIG } from "../appsensor-websocket.js";

import { ClientRequestArgs } from "http";
import EventEmitter from "events";

import WebSocket from "ws";
import { v4 as uuidv4 } from 'uuid';

class WebSocketClientConfig implements IValidateInitialize {
    public static DEFAULT_RETRY_INTERVAL = 20000;

    address: string | URL = '';
    options?: WebSocket.ClientOptions | ClientRequestArgs | undefined;
    reconnectOnConnectionLost?: boolean = true;
    reconnectRetryInterval?: number = WebSocketClientConfig.DEFAULT_RETRY_INTERVAL;

    checkValidInitialize(): void {
        if (this.reconnectOnConnectionLost === true) {//mind undefined value
            if (!this.reconnectRetryInterval) {
                this.reconnectRetryInterval = WebSocketClientConfig.DEFAULT_RETRY_INTERVAL;
            }
        }
    }

}

class AppSensorWebSocketClient {

    protected socket: WebSocket | null = null;
    protected myUUID: string;

    protected reconnectTimer: NodeJS.Timer | null = null;

    protected address: string;
    protected config: WebSocketClientConfig;

    protected accessDenied: boolean = false;

    protected eventEmmiter: EventEmitter = new EventEmitter();


    constructor(config: WebSocketClientConfig) {
        this.config = config;

        this.myUUID = uuidv4();

        this.address = config.address + '?' + UUID_QUERY_PARAM + '=' + this.myUUID;
    }

    public async connect(configParameters?: { [propertyName: string]: string | Object; }): Promise<boolean> {
        let result = false;
        try {

            result = await new Promise<boolean>((resolve, reject) => {

                this.socket = new WebSocket(this.address, this.config.options);
                
                this.socket.on('error', this.onError.bind(this));
                this.socket.on('close', this.onClose.bind(this));
                this.socket.on('message', this.onMessage.bind(this));
                this.socket.on('open', this.onOpen.bind(this));
    
                this.socket.on('open', () => {
                    resolve(true);
                });
                this.socket.on('error', (err: Error) => {
                    reject(err);
                });

            });
    
            await this.sendConfigMsg(configParameters);

        } catch (error) {
            result = false;
            Logger.getClientLogger().error(error);
        }

        return result;
    }

    protected async sendConfigMsg(configParameters?: { [propertyName: string]: string | Object; }) {
        const request = this.createRequest(ACTION_CONFIG, configParameters);
        
        await this.sendRequest(request);
    }

    protected onOpen() {
        if (this.reconnectTimer) {
            clearInterval(this.reconnectTimer);
            this.reconnectTimer = null;

            Logger.getClientLogger().info('AppSensorWebSocketClient.onOpen:', 'Reconnected');
        }
        
        Logger.getClientLogger().trace(`AppSensorWebSocketClient.socket: ${this.myUUID}:`, 'open');
    }

    protected onError(error: Error) {
        Logger.getClientLogger().error(`AppSensorWebSocketClient.socket: ${this.myUUID}:`, 'error:', error);
    }

    protected onClose(code: number, reason: Buffer) {
        Logger.getClientLogger().trace(`AppSensorWebSocketClient.socket: ${this.myUUID}:`, 'close:', 
                                        ' CODE: ', code, ' REASON: ', reason.toString());
        
        if (code !== 1005 && 
            this.config.reconnectOnConnectionLost &&
            !this.reconnectTimer) {
            this.reconnectTimer = setInterval(this.reconnect.bind(this), this.config.reconnectRetryInterval);
        }
    }

    protected async reconnect() {
        Logger.getClientLogger().info('AppSensorWebSocketClient.reconnect:', 'Retry reconnect...');
        await this.connect();
    }

    onMessage(data: WebSocket.RawData, isBinary: boolean) {
        Logger.getClientLogger().trace(`AppSensorWebSocketClient.socket: ${this.myUUID}:`, 'message');

        const response: ActionResponse = JSON.parse(data.toString());
        Object.setPrototypeOf(response, ActionResponse.prototype);

        if (response.accessDenied) {
            this.accessDenied = true;

            Logger.getClientLogger().warn('Access denied for this client application! Configure server!');

        } else if (response.unauthorizedAction) {

            Logger.getClientLogger().warn(`This client application is not authorized to perform '${response.actionName}' on server! Configure server!`);
            
            this.onServerResponse(response);
            
        } else {
            this.onServerResponse(response);
        }
    }
    
    protected onServerResponse(response: ActionResponse) {

        const responseStatus = response.error ? 'Error' : 'OK';
        Logger.getClientLogger().trace('AppSensorWebSocketClient.onServerResponse: ', responseStatus);

        this.eventEmmiter.emit(response.id, response);
    }

    protected createRequest(actionName: string, parameters?: { [propertyName: string]: string | Object; }): ActionRequest {
        const uuid = uuidv4();

        return new ActionRequest(uuid, actionName, parameters);
    }

    protected async sendRequest(request: ActionRequest) {
        let waited = 0;
        const timeout = 500;

        if (!this.socket) {
            throw new Error("socket cannot be null!");
        }

        while (this.socket.readyState === WebSocket.CONNECTING && waited < 5000) {
            await Utils.sleep(timeout);
            waited += timeout;
        }

        await new Promise<void>((resolve, reject) => {
            if (!this.socket) {
                reject(new Error("socket cannot be null!"));
                return;
            }

            if (this.socket.readyState === WebSocket.CONNECTING) {

                reject(new Error('WebSocket in CONNECTING state for too long!'));
    
            } else if (this.socket.readyState === WebSocket.CLOSING) {
    
                reject(new Error('WebSocket in CLOSING state!'));
                
            } else if (this.socket.readyState === WebSocket.CLOSED) {
    
                reject(new Error('WebSocket has already been closed!'));
                
            } else if (this.socket.readyState === WebSocket.OPEN) {
    
                this.socket.send(JSON.stringify(request), (err?: Error | undefined) => {
                    if (err) {
                        reject(err);
                        return;
                    }

                    resolve();
                });
    
            }
        });
    }

    protected async addRequest(request: ActionRequest): Promise<string | number | Object | null> {

        const promise = new Promise<string | number | Object | null>((resolve, reject) => {


            this.eventEmmiter.addListener(request.id, (response: ActionResponse) => {

                this.eventEmmiter.removeAllListeners(request.id);

                if (response.error) {
                    const serverError = new Error(response.error);
                    Logger.getClientLogger().error('Server error:', serverError);

                    reject(serverError);
                } else {
                    
                    resolve(response.result);
                }
            });
           
            
        });

        return await this.sendRequest(request)
        .then((res) => {
            return promise;
        })
        .catch((error) => {
            Logger.getClientLogger().error('Communication error:', error);
            return Promise.reject(error);
        });
    }


    public async closeSocket() {
        if (this.socket) {
            Logger.getClientLogger().info('AppSensorWebSocketClient.closeSocket');

            this.socket.close();

            if (this.reconnectTimer) {
                clearInterval(this.reconnectTimer);
            }
        }
    }

} 

export {AppSensorWebSocketClient, WebSocketClientConfig};