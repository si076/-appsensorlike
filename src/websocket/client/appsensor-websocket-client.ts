
import { MethodRequest } from "../appsensor-websocket.js";
import { Utils } from "../../utils/Utils.js";

import { ClientRequestArgs } from "http";

import WebSocket from "ws";
import { v4 as uuidv4 } from 'uuid';

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
            // console.log('WebSocket: ->open<- event!');
        });
        this.socket.on('error', console.error);

        const onServerResponseThunk = this.onServerResponseWrapper(this);

        this.socket.on('message', onServerResponseThunk);

        this.socket.on('close', function close() {
            // console.log('WebSocket: ->close<- event!');
        });
    }

    private onServerResponseWrapper(me: AppSensorWebSocketClient) {

        return function onServerResponse(data: WebSocket.RawData, isBinary: boolean) {
            // console.log('WebSocket: ->message<- event!');

            me.onServerResponse(data, isBinary);
        }
    }

    protected onServerResponse(data: WebSocket.RawData, isBinary: boolean) {
        //your code goes here
    }

    protected static createRequest(methodName: string, parameters?: { [propertyName: string]: string; }): MethodRequest {
        const uuid = uuidv4();

        return new MethodRequest(uuid, methodName, parameters);
    }

    protected async sendRequest(request: MethodRequest) {
        let waited = 0;
        const timeout = 500;
        while (this.socket.readyState === WebSocket.CONNECTING && waited < 5000) {
            await Utils.sleep(timeout);
            waited += timeout;
        }

        if (this.socket.readyState === WebSocket.CONNECTING) {

            throw new Error('WebSocket in CONNECTING state for too long!');

        } else if (this.socket.readyState === WebSocket.CLOSING) {

            throw new Error('WebSocket in CLOSING state!');
            
        } else if (this.socket.readyState === WebSocket.CLOSED) {

            throw new Error('WebSocket has already been closed!');
            
        } else if (this.socket.readyState === WebSocket.OPEN) {

            this.socket.send(JSON.stringify(request));

        }
    }

} 

export {AppSensorWebSocketClient, WebSocketClientConfig, IWebSocketClientConfig};