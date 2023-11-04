import { AppSensorEvent, Attack, Response } from "@appsensorlike/appsensorlike/core/core.js";
import { EventManager } from "@appsensorlike/appsensorlike/core/event/event.js";
import { Utils } from "@appsensorlike/appsensorlike/utils/Utils.js";
import { Logger } from "@appsensorlike/appsensorlike/logging/logging.js";
import { JSONClientConfigurationReader } from "@appsensorlike/appsensorlike/configuration-modes/appsensor-configuration-json/client/JSONClientConfig.js"

import fetch from 'cross-fetch';
import { ServerConnection } from "@appsensorlike/appsensorlike/core/configuration/client/client_configuration.js";

class RestEventManagerConfigReader extends JSONClientConfigurationReader {
    constructor() {
        super(import.meta.url,
              'appsensor-rest-request-event-config.json');
    }
}

class RestEventManager implements EventManager {

	/** The url to connect to  */
	private url: string;
	
	/** The client application identifier header name, optionally overridden */
	private clientApplicationIdentificationHeaderName: string = ServerConnection.DEFAULT_HEADER_NAME;
	
	/** The client application identifier header value */
	private clientApplicationIdentificationHeaderValue: string;

    constructor(url: string = '', 
                clientApplicationIdentificationHeaderName: string = ServerConnection.DEFAULT_HEADER_NAME,
                clientApplicationIdentificationHeaderValue: string = '',
                configLocation: string = 'appsensor-rest-request-event-config.json') {
        this.url = url;
        this.clientApplicationIdentificationHeaderName = clientApplicationIdentificationHeaderName;
        this.clientApplicationIdentificationHeaderValue = clientApplicationIdentificationHeaderValue;

        if (this.url.trim().length === 0) {
            const config = new RestEventManagerConfigReader().read(configLocation);
            if (config) {
                const serverConnection = config.getServerConnection();
                if (serverConnection) {
                    this.url = serverConnection.getUrl();
                    this.clientApplicationIdentificationHeaderName = serverConnection.getClientApplicationIdentificationHeaderNameOrDefault();
                    this.clientApplicationIdentificationHeaderValue = serverConnection.getClientApplicationIdentificationHeaderValue();
                }
            }
        }

        if (this.clientApplicationIdentificationHeaderName.trim().length === 0) {
            this.clientApplicationIdentificationHeaderName = ServerConnection.DEFAULT_HEADER_NAME;
        }

        if (!this.url || this.url.trim().length === 0) {
            throw new Error("url must be specified in the constructor or configuration file!");
        }

        if (!this.clientApplicationIdentificationHeaderValue || 
            this.clientApplicationIdentificationHeaderValue.trim().length === 0) {
            throw new Error("clientApplicationIdentificationHeaderValue must be specified in the constructor or configuration file!");
        }
    }

    async addEvent(event: AppSensorEvent): Promise<void> {
        const endpoint = this.url + '/events';

        Logger.getClientLogger().trace(`RestEventManager.addEvent: Request: ${endpoint}`);

        try {
            await this.add(endpoint, event);
            
            return Promise.resolve();
        } catch (error) {
            Logger.getClientLogger().error(`RestEventManager.addEvent: `, error);

            return Promise.reject(error);
        }
    }

    async addAttack(attack: Attack): Promise<void> {
        const endpoint = this.url + '/attacks';

        Logger.getClientLogger().trace(`RestEventManager.addAttack: Request: ${endpoint}`);

        try {
            await this.add(endpoint, attack);

            return Promise.resolve();
        } catch (error) {
            Logger.getClientLogger().error(`RestEventManager.addAttack: `, error);

            return Promise.reject(error);
        }
    }

    private async add(endpoint: string, obj: AppSensorEvent | Attack) {
        let error = undefined;

        const appIdentificationHeader      = this.clientApplicationIdentificationHeaderName;
        const appIdentificationHeaderValue = this.clientApplicationIdentificationHeaderValue;

        await fetch(endpoint, 
                    {
                        method: 'post',
                        body: JSON.stringify(obj),
                        headers: [['Content-Type', 'application/json'],
                                  [appIdentificationHeader, appIdentificationHeaderValue]]
                    }
                )
                .then((res) => {
                    if (res.status !== 201) {
                        error = new Error(`Server responded with status: ${res.status}`);
                    }
                })
                .catch((err) => {
                    error = err;
                });

        if (error) {
            throw error;
        }
    }

    async getEvents(earliest: Date): Promise<AppSensorEvent[]> {
        const endpoint = this.url + '/events?earliest=' + earliest.toISOString();

        Logger.getClientLogger().trace(`RestEventManager.getEvents: Request: ${endpoint}`);

        try {
            const events = await this.get(endpoint, AppSensorEvent.prototype.constructor.name);
            
            return Promise.resolve(events as AppSensorEvent[]);
        } catch (error) {
            Logger.getClientLogger().error(`RestEventManager.getEvents: `, error);

            return Promise.reject(error);
        }
    }

    async getAttacks(earliest: Date): Promise<Attack[]> {
        const endpoint = this.url + '/attacks?earliest=' + earliest.toISOString();

        Logger.getClientLogger().trace(`RestEventManager.getAttacks: Request: ${endpoint}`);

        try {
            const attacks = await this.get(endpoint, Attack.prototype.constructor.name);
            
            return Promise.resolve(attacks as Attack[]);
        } catch (error) {
            Logger.getClientLogger().error(`RestEventManager.getAttacks: `, error);

            return Promise.reject(error);
        }
    }
    
    async getResponses(earliest: Date): Promise<Response[]> {
        const endpoint = this.url + '/responses?earliest=' + earliest.toISOString();

        Logger.getClientLogger().trace(`RestEventManager.getResponses: Request: ${endpoint}`);

        try {
            const responses = await this.get(endpoint, Response.prototype.constructor.name);
            
            return Promise.resolve(responses as Response[]);
        } catch (error) {
            Logger.getClientLogger().error(`RestEventManager.getResponses: `, error);

            return Promise.reject(error);
        }
    }

    private async get(endpoint: string, className: string): Promise<AppSensorEvent[] | Attack[] | Response[]> {
        Logger.getClientLogger().trace(`RestEventManager.get: endpoint: '${endpoint}' className: '${className}'`);

        let error: Error | undefined = undefined;
        let response: AppSensorEvent[] | Attack[] | Response[] = [];

        const appIdentificationHeader      = this.clientApplicationIdentificationHeaderName;
        const appIdentificationHeaderValue = this.clientApplicationIdentificationHeaderValue;

        await fetch(endpoint, 
                    {
                        method: 'get',
                        headers: [['Content-Type', 'application/json'],
                                  [appIdentificationHeader, appIdentificationHeaderValue]]
                    })
                .then((res) => {
                    if (res.status !== 200) {
                        error = new Error(`Server responded with status: ${res.status}(${res.statusText})`);
                        return res.text();
                    } else {
                        return res.json();
                    }
                })
                .then((res) => {
                    if (error) {
                        error = new Error(`${error.message} : ${res}`);  
                    } else {
                        response = res;
                        for (let i = 0; i < response.length; i++) {
                            Utils.setPrototypeInDepthByClassName(response[i], className);
                            Logger.getClientLogger().trace(response[i]);
                        }
                    }
                })
                .catch((err) => {
                    error = err;
                });

        if (error) {
            throw error;
        }

        return response;
    }

}

export {RestEventManager};