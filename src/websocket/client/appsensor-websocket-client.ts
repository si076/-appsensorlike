
import { ActionRequest, ActionResponse, UUID_QUERY_PARAM } from "../appsensor-websocket.js";
import { Utils } from "../../utils/Utils.js";
import { Logger } from "../../logging/logging.js";

import { ClientRequestArgs } from "http";

import WebSocket from "ws";
import { v4 as uuidv4 } from 'uuid';
import { IValidateInitialize } from "../../core/core.js";

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

    protected reconnectAddress: string | URL;
    protected reconnectConfig: WebSocketClientConfig;
    protected reconnectTimer: NodeJS.Timer | null = null;

    constructor(config: WebSocketClientConfig) {
        
        this.myUUID = uuidv4();

        const _address = config.address + '?' + UUID_QUERY_PARAM + '=' + this.myUUID;

        this.reconnectAddress = _address;   
        this.reconnectConfig = config;

        this.connect(_address, config.options);
    }

    protected connect(address: string | URL,
                      options?: WebSocket.ClientOptions | ClientRequestArgs) {
        

        this.socket = new WebSocket(address, options);

        const _myUUID = this.myUUID;

        
        this.socket.on('open', this.onOpen.bind(this));

        this.socket.on('error', this.onError.bind(this));

        this.socket.on('message', this.onMessage.bind(this));

        this.socket.on('close', this.onClose.bind(this));
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
        Logger.getClientLogger().error(`AppSensorWebSocketClient.socket: ${this.myUUID}:`, 'error ', error);
    }

    protected onClose(code: number, reason: Buffer) {
        Logger.getClientLogger().trace(`AppSensorWebSocketClient.socket: ${this.myUUID}:`, 'close', 
                                        ' CODE: ', code, ' REASON: ', reason.toString());
        
        if (this.reconnectConfig && this.reconnectConfig.reconnectOnConnectionLost &&
            !this.reconnectTimer) {
            this.reconnectTimer = setInterval(this.reconnect.bind(this), this.reconnectConfig.reconnectRetryInterval);
        }
    }

    protected reconnect() {
        Logger.getClientLogger().info('AppSensorWebSocketClient.reconnect:', 'Retry reconnect...');
        return this.connect(this.reconnectAddress, this.reconnectConfig.options);
    }

    onMessage(data: WebSocket.RawData, isBinary: boolean) {
        Logger.getClientLogger().trace(`AppSensorWebSocketClient.socket: ${this.myUUID}:`, 'message');

        const response: ActionResponse = JSON.parse(data.toString());
        Object.setPrototypeOf(response, ActionResponse.prototype);

        if (response.accessDenied) {

            Logger.getClientLogger().warn('Access denied for this client application! Configure server!');

        } else if (response.unauthorizedAction) {

            Logger.getClientLogger().warn(`This client application is not authorized to perform '${response.actionName}' on server! Configure server!`);
            
        } else {
            this.onServerResponse(response);
        }
    }
    
    protected onServerResponse(response: ActionResponse) {
        //your code goes here
    }

    protected static createRequest(actionName: string, parameters?: { [propertyName: string]: string | Object; }): ActionRequest {
        const uuid = uuidv4();

        return new ActionRequest(uuid, actionName, parameters);
    }

    protected async sendRequest(request: ActionRequest, cb: (err?: Error) => void) {
        let waited = 0;
        const timeout = 500;

        if (!this.socket) {
            return;
        }

        while (this.socket.readyState === WebSocket.CONNECTING && waited < 5000) {
            await Utils.sleep(timeout);
            waited += timeout;
        }

        if (this.socket.readyState === WebSocket.CONNECTING) {

            cb(new Error('WebSocket in CONNECTING state for too long!'));

        } else if (this.socket.readyState === WebSocket.CLOSING) {

            cb(new Error('WebSocket in CLOSING state!'));
            
        } else if (this.socket.readyState === WebSocket.CLOSED) {

            cb(new Error('WebSocket has already been closed!'));
            
        } else if (this.socket.readyState === WebSocket.OPEN) {

            this.socket.send(JSON.stringify(request), cb);

        }
    }

    public async closeSocket() {
        if (this.socket) {
            this.socket.close();
        }
    }

} 

export {AppSensorWebSocketClient, WebSocketClientConfig};