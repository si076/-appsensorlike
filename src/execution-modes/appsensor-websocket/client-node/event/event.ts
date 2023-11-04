import { AppSensorEvent, Attack, Response } from "@appsensorlike/appsensorlike/core/core.js";
import { EventManager } from "@appsensorlike/appsensorlike/core/event/event.js";
import { JSONConfigReadValidate, Utils } from "@appsensorlike/appsensorlike/utils/Utils.js";
import { Logger } from "@appsensorlike/appsensorlike/logging/logging.js";

import { AppSensorWebSocketClient, WebSocketClientConfig } from "@appsensorlike/appsensorlike_websocket/client";
import { ActionRequest, ActionResponse } from "@appsensorlike/appsensorlike_websocket";


class WebSocketEventManagerConfigReader  extends JSONConfigReadValidate {

    constructor() {
        super(import.meta.url,
              'appsensor-websocket-event-manager-config.json',
              'appsensor-websocket-client-config_schema.json',
              WebSocketClientConfig.prototype);
    }
}

class WebSocketEventManager extends AppSensorWebSocketClient implements EventManager {
	
	
    constructor(config: WebSocketClientConfig | null = null,
                configLocation: string = 'appsensor-websocket-event-manager-config.json') {
        let _config = config;
        if (!_config) {
            _config = new WebSocketEventManagerConfigReader().read(configLocation)
        }
		super(_config!);
    }

	/**
	 * {@inheritDoc}
	 */
	public async addEvent(event: AppSensorEvent): Promise<void> {
		Logger.getClientLogger().trace('WebSocketEventManager.addEvent:');
		Logger.getClientLogger().trace(event);

        await this.addRequest(this.createRequest("addEvent", {event: event}));
	}
	
	/**
	 * {@inheritDoc}
	 */
	public async addAttack(attack: Attack): Promise<void> {
		Logger.getClientLogger().trace('WebSocketEventManager.addAttack:');
		Logger.getClientLogger().trace(attack);

        await this.addRequest(this.createRequest("addAttack", {attack: attack}));
	}

	
    public async getEvents(earliest: Date): Promise<AppSensorEvent[]> {
		Logger.getClientLogger().trace('WebSocketEventManager.getEvents:');
		Logger.getClientLogger().trace(`earliest: ${earliest}`);

        return await this.addRequest(this.createRequest("getEvents", {earliest: earliest}))
        .then((result) => {
            if (result && result instanceof Array) {
                for (let i = 0; i < result.length; i++) {
                    
                    Utils.setPrototypeInDepth(result[i], Utils.appSensorEventPrototypeSample);

                    Utils.setTimestampFromJSONParsedObject(result[i] as AppSensorEvent, result[i]);
                }
            }

            return Promise.resolve(result as AppSensorEvent[]);
        })
        .catch((error) => {
            return Promise.reject(error);
        });

    }

    public async getAttacks(earliest: Date): Promise<Attack[]> {
		Logger.getClientLogger().trace('WebSocketEventManager.getAttacks:');
		Logger.getClientLogger().trace(`earliest: ${earliest}`);

        return await this.addRequest(this.createRequest("getAttacks", {earliest: earliest}))
        .then((result) => {
            if (result && result instanceof Array) {
                for (let i = 0; i < result.length; i++) {
                    
                    Utils.setPrototypeInDepth(result[i], Utils.attackPrototypeSample);

                    Utils.setTimestampFromJSONParsedObject(result[i] as Attack, result[i]);
                }
            }

            return Promise.resolve(result as Attack[]);
        })
        .catch((error) => {
            return Promise.reject(error);
        });

    }

	public async getResponses(earliest: Date): Promise<Response[]> {
		Logger.getClientLogger().trace('WebSocketEventManager.getResponses:');
		Logger.getClientLogger().trace(`earliest: ${earliest}`);

        return await this.addRequest(this.createRequest("getResponses", {earliest: earliest}))
        .then((result) => {
            if (result && result instanceof Array) {
                for (let i = 0; i < result.length; i++) {
                    
                    Utils.setPrototypeInDepth(result[i], Utils.responsePrototypeSample);

                    Utils.setTimestampFromJSONParsedObject(result[i] as Response, result[i]);
                }
            }

            return Promise.resolve(result as Response[]);
        })
        .catch((error) => {
            return Promise.reject(error);
        });

    }
	
}

export {WebSocketEventManager};