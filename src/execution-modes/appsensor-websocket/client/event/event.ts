import { AppSensorEvent, Attack, Response } from "../../../../core/core.js";
import { EventManager } from "../../../../core/event/event.js";
import { JSONConfigReadValidate, Utils } from "../../../../utils/Utils.js";
import { AppSensorWebSocketClient, WebSocketClientConfig } from "../../../../websocket/client/appsensor-websocket-client.js";
import { ActionResponse } from "../../../../websocket/appsensor-websocket.js";
import { Logger } from "../../../../logging/logging.js";

import EventEmitter from "events";

class WebSocketEventManagerConfigReader  extends JSONConfigReadValidate {

    constructor() {
        super('./execution-modes/appsensor-websocket/client/event/appsensor-websocket-event-manager-config.json',
              './websocket/client/appsensor-websocket-client-config_schema.json',
              WebSocketClientConfig.prototype);
    }
}

class WebSocketEventManager extends AppSensorWebSocketClient implements EventManager {
	
	private static eventEmmiter: EventEmitter = new EventEmitter();
	
    constructor(configLocation: string = 'appsensor-websocket-event-manager-config.json') {
		super(new WebSocketEventManagerConfigReader().read(configLocation));
    }

    protected override onServerResponse(response: ActionResponse) {

        const responseStatus = response.error ? 'Error' : 'OK';
        Logger.getClientLogger().trace('WebSocketEventManager.onServerResponse: ', responseStatus);

        WebSocketEventManager.eventEmmiter.emit(response.id, response);
    }

    private genSendCallback(reject: (reason?: any) => void) {

        return function sendCallback(error?: Error) {
            if (error) {
                Logger.getClientLogger().error('Communication error:', error);
                
                reject(error);
            }
        }
    }

	/**
	 * {@inheritDoc}
	 */
	public async addEvent(event: AppSensorEvent): Promise<void> {
		Logger.getClientLogger().trace('WebSocketEventManager.addEvent:');
		Logger.getClientLogger().trace(event);

        return new Promise((resolve, reject) => {

            const request = AppSensorWebSocketClient.createRequest("addEvent", {event: event});

            WebSocketEventManager.eventEmmiter.addListener(request.id, (response: ActionResponse) => {

                WebSocketEventManager.eventEmmiter.removeAllListeners(request.id);

                if (response.error) {
                    const serverError = new Error(response.error);
                    Logger.getClientLogger().error('Server error:', serverError);

                    reject(serverError);
                } else {
                    
                    resolve();
                }
            });

            this.sendRequest(request, this.genSendCallback(reject));
        });
	}
	
	/**
	 * {@inheritDoc}
	 */
	public async addAttack(attack: Attack): Promise<void> {
		Logger.getClientLogger().trace('WebSocketEventManager.addAttack:');
		Logger.getClientLogger().trace(attack);

        return new Promise((resolve, reject) => {

            const request = AppSensorWebSocketClient.createRequest("addAttack", {attack: attack});

            WebSocketEventManager.eventEmmiter.addListener(request.id, (response: ActionResponse) => {

                WebSocketEventManager.eventEmmiter.removeAllListeners(request.id);

                if (response.error) {
                    const serverError = new Error(response.error);
                    Logger.getClientLogger().error('Server error:', serverError);
                    
                    reject(serverError);
                } else {

                    resolve();
                }
            });

            this.sendRequest(request, this.genSendCallback(reject));
        });
	}
	
	/**
	 * {@inheritDoc}
	 */
	public getResponses(earliest: Date): Promise<Response[]> {
		Logger.getClientLogger().trace('WebSocketEventManager.getResponses:');
		Logger.getClientLogger().trace(`earliest: ${earliest}`);

        return new Promise((resolve, reject) => {

            const request = AppSensorWebSocketClient.createRequest("getResponses", {earliest: earliest});

            WebSocketEventManager.eventEmmiter.addListener(request.id, (response: ActionResponse) => {

                WebSocketEventManager.eventEmmiter.removeAllListeners(request.id);

                if (response.error) {
                    const serverError = new Error(response.error);
                    Logger.getClientLogger().error('Server error:', serverError);
                    
                    reject(serverError);
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

            this.sendRequest(request, this.genSendCallback(reject));
        });
	}
	
}

export {WebSocketEventManager};