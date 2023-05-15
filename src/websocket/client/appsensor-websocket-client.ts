
import { MethodRequest } from "../appsensor-websocket.js";
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

        this.socket = new WebSocket(_address, _options);

        this.socket.on('open', function () {
            Logger.getClientLogger().trace('AppSensorWebSocketClient.socket: ', 'open');
        });
        this.socket.on('error', (error) => {
            Logger.getClientLogger().trace('AppSensorWebSocketClient.socket: ', 'error ', error);
        });

        const onServerResponseThunk = this.onServerResponseWrapper(this);

        this.socket.on('message', onServerResponseThunk);

        this.socket.on('close', function close() {
            Logger.getClientLogger().trace('AppSensorWebSocketClient.socket: ', 'close');
        });
    }

    private onServerResponseWrapper(me: AppSensorWebSocketClient) {

        return function onServerResponse(data: WebSocket.RawData, isBinary: boolean) {
            Logger.getClientLogger().trace('AppSensorWebSocketClient.socket: ', 'message');

            me.onServerResponse(data, isBinary);
        }
    }

    protected onServerResponse(data: WebSocket.RawData, isBinary: boolean) {
        //your code goes here
    }

    protected static createRequest(methodName: string, parameters?: { [propertyName: string]: string | Object; }): MethodRequest {
        const uuid = uuidv4();

        return new MethodRequest(uuid, methodName, parameters);
    }

    protected async sendRequest(request: MethodRequest, cb: (err?: Error) => void) {
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