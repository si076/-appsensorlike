import { ClientRequestArgs } from "http";
import { AppSensorEvent, Attack, Response } from "../../../core/core.js";
import { EventManager } from "../../../core/event/event.js";
import { JSONConfigReadValidate, Utils } from "../../../utils/Utils.js";
import { AppSensorWebSocketClient, WebSocketClientConfig } from "../../../websocket/client/appsensor-websocket-client.js";

import EventEmitter from "events";
import WebSocket from "ws";
import { MethodResponse } from "../../../websocket/appsensor-websocket.js";

class WebSocketEventManagerConfigReader  extends JSONConfigReadValidate {

    constructor() {
        super('./execution-modes/appsensor-websocket/event/appsensor-websocket-event-manager-config.json',
              './websocket/client/appsensor-websocket-client-config_schema.json',
              WebSocketClientConfig.prototype);
    }
}

class WebSocketEventManager extends AppSensorWebSocketClient implements EventManager {
	
	// @SuppressWarnings("unused")
	// private Logger logger;

	private static eventEmmiter: EventEmitter = new EventEmitter();
	
    constructor(address: string | URL = '', 
				configLocation: string = '',
				options?: WebSocket.ClientOptions | ClientRequestArgs) {
		super(address, new WebSocketEventManagerConfigReader().read(configLocation), options);
    }

    protected override onServerResponse(data: WebSocket.RawData, isBinary: boolean) {
        const response: MethodResponse = JSON.parse(data.toString());
        Object.setPrototypeOf(response, MethodResponse.prototype);

        WebSocketEventManager.eventEmmiter.emit(response.id, response);
    }
	/**
	 * {@inheritDoc}
	 */
	public async addEvent(event: AppSensorEvent): Promise<void> {
        return new Promise((resolve, reject) => {

            const request = AppSensorWebSocketClient.createRequest("addEvent", {event: event});

            WebSocketEventManager.eventEmmiter.addListener(request.id, (response: MethodResponse) => {

                WebSocketEventManager.eventEmmiter.removeAllListeners(request.id);

                if (response.error) {
                    reject(new Error(response.error));
                } else {
                    
                    resolve();
                }
            });

            try {
                this.sendRequest(request);
            } catch (error) {
                reject(error);
            }
        });
	}
	
	/**
	 * {@inheritDoc}
	 */
	public async addAttack(attack: Attack): Promise<void> {
        return new Promise((resolve, reject) => {

            const request = AppSensorWebSocketClient.createRequest("addAttack", {attack: attack});

            WebSocketEventManager.eventEmmiter.addListener(request.id, (response: MethodResponse) => {

                WebSocketEventManager.eventEmmiter.removeAllListeners(request.id);

                if (response.error) {
                    reject(new Error(response.error));
                } else {

                    resolve();
                }
            });

            try {
                this.sendRequest(request);
            } catch (error) {
                reject(error);
            }
        });
	}
	
	/**
	 * {@inheritDoc}
	 */
	public getResponses(earliest: Date): Promise<Response[]> {
        return new Promise((resolve, reject) => {

            const request = AppSensorWebSocketClient.createRequest("getResponses", {earliest: earliest});

            WebSocketEventManager.eventEmmiter.addListener(request.id, (response: MethodResponse) => {

                WebSocketEventManager.eventEmmiter.removeAllListeners(request.id);

                if (response.error) {
                    reject(new Error(response.error));
                } else {
                    if (response.result && response.result instanceof Array && response.result.length > 0) {
                        for (let i = 0; i < response.result.length; i++) {
                            
                            Utils.setPrototypeInDepth(response.result[i], Utils.responsePrototypeSample);

                            Utils.setTimestampFromJSONParsedObject(response.result[i] as Response, response.result[i]);
                        }
                    }

                    resolve(response.result as Response[]);
                }
            });

            try {
                this.sendRequest(request);
            } catch (error) {
                reject(error);
            }
        });
	}
	
}

export {WebSocketEventManager};