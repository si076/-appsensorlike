import { AppSensorEvent, Attack, Response } from "../../../../core/core";
import { EventManager } from "../../../../core/event/event";
import { RestClientConfig } from "../../../../rest/client/rest-client";
import { JSONConfigReadValidate } from "../../../../utils/Utils";

import fetch from 'cross-fetch';

class RestEventManagerConfigReader extends JSONConfigReadValidate {
    constructor() {
        super('./execution-modes/appsensor-rest/client/event/appsensor-rest-request-event-config.json',
              './rest/client/appsensor-rest-client-config_schema.json',
              RestClientConfig.prototype);
    }
}

class RestEventManager implements EventManager {

    private url: string;

    constructor(url: string = '', 
                configLocation: string = 'appsensor-rest-request-event-config.json',) {
        this.url = url;
        if (this.url.trim().length === 0) {
            this.url = (new RestEventManagerConfigReader().read(configLocation) as RestClientConfig).url;
        }
    }

    async addEvent(event: AppSensorEvent): Promise<void> {
        const endpoint = this.url + '/events';

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
                        error = `Server responded with status: ${res.status}`;
                    }
                })
                .catch((err) => {
                    error = err;
                });

        if (error) {
            console.error(error);

            return Promise.reject(error);
        } else {
            return Promise.resolve();
        }
    }

    async addAttack(attack: Attack): Promise<void> {
        const endpoint = this.url + '/attacks';

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
                        error = `Server responded with status: ${res.status}`;
                    }
                })
                .catch((err) => {
                    error = err;
                });

        if (error) {
            console.error(error);

            return Promise.reject(error);
        } else {
            return Promise.resolve();
        }
    }
    
    async getResponses(earliest: Date): Promise<Response[]> {
        const endpoint = this.url + '/responses';

        let responses: Response[] = [];
        let error = undefined;

        await fetch(endpoint)
                .then((res) => {
                    if (res.status !== 200) {
                        error = `Server responded with status: ${res.status}`;
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
            console.error(error);

            return Promise.reject(error);
        } else {
            return Promise.resolve(responses);
        }
    }

}

export {RestEventManager};