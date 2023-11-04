import { AppSensorEvent, Attack, Response, KeyValuePair } from "@appsensorlike/appsensorlike/core/core.js";
import { JSONConfigReadValidate, Utils } from "@appsensorlike/appsensorlike/utils/Utils.js";
import { Logger } from "@appsensorlike/appsensorlike/logging/logging.js";
import { ActionResponse } from "@appsensorlike/appsensorlike_websocket";
import { ReportingEngineExt } from "@appsensorlike/appsensorlike/reporting-engines/reporting-engines.js";

import { AppSensorWebSocketClient, WebSocketClientConfig } from "@appsensorlike/appsensorlike_websocket/client";

class ReportingWebSocketClientConfigReader  extends JSONConfigReadValidate {

    constructor() {
        super(import.meta.url,
              'appsensor-reporting-websocket-client-config.json',
              'appsensor-websocket-client-config_schema.json',
              WebSocketClientConfig.prototype);
    }
}

class AppSensorReportingWebSocketClient extends AppSensorWebSocketClient implements ReportingEngineExt {

    private static ON_ADD_EVENT = 'ON_ADD';

    constructor(configLocation: string = 'appsensor-reporting-websocket-client-config.json') {
        super(new ReportingWebSocketClientConfigReader().read(configLocation));
    }

    protected override onServerResponse(response: ActionResponse) {

        if (response.actionName === 'onAdd') {

            try {
                Utils.setPrototypeInDepthByClassName(response.result as Object, response.resultElementClass as string);
    
                this.onAdd(response.result as (AppSensorEvent | Attack | Response));
    
                //also emit and event as well
                this.eventEmmiter.emit(AppSensorReportingWebSocketClient.ON_ADD_EVENT, 
                                                                    response.result as (AppSensorEvent | Attack | Response));

            } catch (error) {
                //could be thrown an error if the received object is not valid
                //just log to be checked where is the error
                //doesn't completely halt the running app
                Logger.getClientLogger().error('AppSensorReportingWebSocketClient.onServerResponse', error);
            }

        } else {

            this.eventEmmiter.emit(response.id, response);

        }
    }

    public addOnAddListener(listener: (event: AppSensorEvent | Attack | Response) => void) {
        this.eventEmmiter.addListener(AppSensorReportingWebSocketClient.ON_ADD_EVENT, listener);
    }

    public removeOnAddListener(listener: (event: AppSensorEvent | Attack | Response) => void) {
        this.eventEmmiter.removeListener(AppSensorReportingWebSocketClient.ON_ADD_EVENT, listener);
    }

    async findEvents(earliest: string): Promise<AppSensorEvent[]> {
        return await this.addRequest(this.createRequest("findEvents", {earliest: earliest}))
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

    async findAttacks(earliest: string): Promise<Attack[]> {
        return await this.addRequest(this.createRequest("findAttacks", {earliest: earliest}))
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

    async findResponses(earliest: string): Promise<Response[]> {
        return await this.addRequest(this.createRequest("findResponses", {earliest: earliest}))
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

    async countEvents(earliest: string): Promise<number> {
        return await this.addRequest(this.createRequest("countEvents", {earliest: earliest}))
        .then((result) => {
            return Promise.resolve(result as number);
        })
        .catch((error) => {
            return Promise.reject(error);
        });
    }

    async countAttacks(earliest: string): Promise<number> {
        return await this.addRequest(this.createRequest("countAttacks", {earliest: earliest}))
        .then((result) => {
            return Promise.resolve(result as number);
        })
        .catch((error) => {
            return Promise.reject(error);
        });
    }

    async countResponses(earliest: string): Promise<number> {
        return await this.addRequest(this.createRequest("countResponses", {earliest: earliest}))
        .then((result) => {
            return Promise.resolve(result as number);
        })
        .catch((error) => {
            return Promise.reject(error);
        });
    }

    countEventsByLabel(earliest: string, label: string): Promise<number> {
        throw new Error("Method not implemented.");
    }

    countAttacksByLabel(earliest: string, label: string): Promise<number> {
        throw new Error("Method not implemented.");
    }

    countResponsesByLabel(earliest: string, label: string): Promise<number> {
        throw new Error("Method not implemented.");
    }

    async countEventsByCategoryLabel(earliest: string, category: string, label: string): Promise<number> {
        return await this.addRequest(this.createRequest("countEventsByCategoryLabel", 
                                                        {earliest: earliest,
                                                         category: category,
                                                         label: label}))
        .then((result) => {
            return Promise.resolve(result as number);
        })
        .catch((error) => {
            return Promise.reject(error);
        });
    }

    async countAttacksByCategoryLabel(earliest: string, category: string, label: string): Promise<number> {
        return await this.addRequest(this.createRequest("countAttacksByCategoryLabel", 
                                                        {earliest: earliest,
                                                         category: category,
                                                         label: label}))
        .then((result) => {
            return Promise.resolve(result as number);
        })
        .catch((error) => {
            return Promise.reject(error);
        });
    }

    async countResponsesByCategoryLabel(earliest: string, category: string, label: string): Promise<number> {
        return await this.addRequest(this.createRequest("countResponsesByCategoryLabel", 
                                                        {earliest: earliest,
                                                         category: category,
                                                         label: label}))
        .then((result) => {
            return Promise.resolve(result as number);
        })
        .catch((error) => {
            return Promise.reject(error);
        });
    }

    async countEventsByUser(earliest: string, user: string): Promise<number> {
        return await this.addRequest(this.createRequest("countEventsByUser", {earliest: earliest, user: user}))
        .then((result) => {
            return Promise.resolve(result as number);
        })
        .catch((error) => {
            return Promise.reject(error);
        });
    }

    async countAttacksByUser(earliest: string, user: string): Promise<number> {
        return await this.addRequest(this.createRequest("countAttacksByUser", {earliest: earliest, user: user}))
        .then((result) => {
            return Promise.resolve(result as number);
        })
        .catch((error) => {
            return Promise.reject(error);
        });
    }

    async countResponsesByUser(earliest: string, user: string): Promise<number> {
        return await this.addRequest(this.createRequest("countResponsesByUser", {earliest: earliest, user: user}))
        .then((result) => {
            return Promise.resolve(result as number);
        })
        .catch((error) => {
            return Promise.reject(error);
        });
    }

    async getServerConfigurationAsJson(): Promise<string> {
        return await this.addRequest(this.createRequest("getServerConfigurationAsJson"))
        .then((result) => {
            return Promise.resolve(result as string);
        })
        .catch((error) => {
            return Promise.reject(error);
        });
    }

    getBase64EncodedServerConfigurationFileContent(): KeyValuePair {
        throw new Error("Method not implemented.");
    }

    onAdd(event: AppSensorEvent | Attack | Response): Promise<void> {
        //your code in the subclass goes here or listner for the emited ON_ADD event as well

        return Promise.resolve();
    }

} 

export {AppSensorReportingWebSocketClient};