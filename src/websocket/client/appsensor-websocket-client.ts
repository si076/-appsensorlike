
import { ActionRequest, ActionResponse, UUID_QUERY_PARAM } from "../appsensor-websocket.js";
import { Utils } from "../../utils/Utils.js";

import { ClientRequestArgs } from "http";

import WebSocket from "ws";
import { v4 as uuidv4 } from 'uuid';
import { Logger } from "../../logging/logging.js";

interface IWebSocketClientConfig {
    address: string | URL;
    options?: WebSocket.ClientOptions | ClientRequestArgs;
}

class WebSocketClientConfig implements IWebSocketClientConfig {
    address: string | URL = '';
    options?: WebSocket.ClientOptions | ClientRequestArgs | undefined;

}

class AppSensorWebSocketClient {

    protected socket;
    protected myUUID;

    constructor(address: string | URL = '', 
                config: WebSocketClientConfig | null = null,
                options?: WebSocket.ClientOptions | ClientRequestArgs) {
        
        let _address = address;
        if (!_address && config) {
            _address = config.address;
        }

        let _options = options;
        if (!_options && config) {
            _options = config.options;
        }

        this.myUUID = uuidv4();

        _address += '?' + UUID_QUERY_PARAM + '=' + this.myUUID;

        this.socket = new WebSocket(_address, _options);

        const _myUUID = this.myUUID;

        this.socket.on('open', function () {
            Logger.getClientLogger().trace(`AppSensorWebSocketClient.socket: ${_myUUID}:`, 'open');
        });

        this.socket.on('error', (error) => {
            Logger.getClientLogger().trace(`AppSensorWebSocketClient.socket: ${_myUUID}:`, 'error ', error);
        });

        this.socket.on('message', this.onMessage.bind(this));

        this.socket.on('close', function close(this: WebSocket, code: number, reason: Buffer) {
            Logger.getClientLogger().trace(`AppSensorWebSocketClient.socket: ${_myUUID}:`, 'close', 
                                           ' CODE: ', code, ' REASON: ', reason.toString());
        });
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

    protected closeSocket() {
        this.socket.close();
    }

} 

export {AppSensorWebSocketClient, WebSocketClientConfig, IWebSocketClientConfig};