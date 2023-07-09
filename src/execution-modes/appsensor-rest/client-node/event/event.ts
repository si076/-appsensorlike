import { AppSensorEvent, Attack, Response } from "@appsensorlike/appsensorlike/core/core.js";
import { EventManager } from "@appsensorlike/appsensorlike/core/event/event.js";
import { JSONConfigReadValidate } from "@appsensorlike/appsensorlike/utils/Utils.js";
import { Logger } from "@appsensorlike/appsensorlike/logging/logging.js";

import fetch from 'cross-fetch';

class RestClientConfig {
    url: string = '';
}

class RestEventManagerConfigReader extends JSONConfigReadValidate {
    constructor() {
        super(import.meta.url,
              'appsensor-rest-request-event-config.json',
              'appsensor-rest-client-config_schema.json',
              RestClientConfig.prototype);
    }
}

class RestEventManager implements EventManager {

    private url: string;

    constructor(url: string = '', 
                configLocation: string = 'appsensor-rest-request-event-config.json') {
        this.url = url;
        if (this.url.trim().length === 0) {
            this.url = (new RestEventManagerConfigReader().read(configLocation) as RestClientConfig).url;
        }
    }

    async addEvent(event: AppSensorEvent): Promise<void> {
        const endpoint = this.url + '/events';

        Logger.getClientLogger().trace(`RestEventManager.addEvent: Request: ${endpoint}`);

        let error = undefined;

        await fetch(endpoint, 
                    {
                        method: 'post',
                        body: JSON.stringify(event),
                        headers: {'Content-Type': 'application/json'}
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
            Logger.getClientLogger().error(`RestEventManager.addEvent: `, error);

            return Promise.reject(error);
        } else {
            return Promise.resolve();
        }
    }

    async addAttack(attack: Attack): Promise<void> {
        const endpoint = this.url + '/attacks';

        Logger.getClientLogger().trace(`RestEventManager.addAttack: Request: ${endpoint}`);

        let error = undefined;

        await fetch(endpoint, 
                    {
                        method: 'post',
                        body: JSON.stringify(attack),
                        headers: {'Content-Type': 'application/json'}
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
            Logger.getClientLogger().error(`RestEventManager.addAttack: `, error);

            return Promise.reject(error);
        } else {
            return Promise.resolve();
        }
    }
    
    async getResponses(earliest: Date): Promise<Response[]> {
        const endpoint = this.url + '/responses';

        Logger.getClientLogger().trace(`RestEventManager.getResponses: Request: ${endpoint}`);

        let responses: Response[] = [];
        let error = undefined;

        await fetch(endpoint)
                .then((res) => {
                    if (res.status !== 200) {
                        error = new Error(`Server responded with status: ${res.status}`);
                    } else {
                        return res.json();
                    }
                })
                .then((res) => {
                    responses = res;
                })
                .catch((err) => {
                    error = err;
                });

        if (error) {
            Logger.getClientLogger().error(`RestEventManager.getResponses: `, error);

            return Promise.reject(error);
        } else {
            return Promise.resolve(responses);
        }
    }

}

export {RestEventManager};