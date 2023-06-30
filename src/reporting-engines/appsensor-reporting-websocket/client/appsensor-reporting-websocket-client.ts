import { AppSensorEvent, Attack, Response, KeyValuePair } from "../../../core/core.js";
import { JSONConfigReadValidate, Utils } from "../../../utils/Utils.js";
import { ActionResponse } from "../../../websocket/appsensor-websocket.js";
import { ReportingEngineExt } from "../../reporting-engines.js";
import { AppSensorWebSocketClient, WebSocketClientConfig } from "../../../websocket/client/appsensor-websocket-client.js";

import { ClientRequestArgs } from "http";
import { EventEmitter } from "events";
import WebSocket from "ws";
import { Logger } from "../../../logging/logging.js";

class ReportingWebSocketClientConfigReader  extends JSONConfigReadValidate {

    constructor() {
        super('./reporting-engines/appsensor-reporting-websocket/client/appsensor-reporting-websocket-client-config.json',
              './websocket/client/appsensor-websocket-client-config_schema.json',
              WebSocketClientConfig.prototype);
    }
}

class AppSensorReportingWebSocketClient extends AppSensorWebSocketClient implements ReportingEngineExt {

    private static eventEmmiter: EventEmitter = new EventEmitter();

    private static ON_ADD_EVENT = 'ON_ADD';

    constructor(configLocation: string = 'appsensor-reporting-websocket-client-config.json') {
        super(new ReportingWebSocketClientConfigReader().read(configLocation));
    }

    protected override onServerResponse(response: ActionResponse) {

        if (response.actionName === 'onAdd') {

            try {
                switch (response.resultElementClass) {
                    case 'AppSensorEvent': {
                        Utils.setPrototypeInDepth(response.result as Object, Utils.appSensorEventPrototypeSample);
                        Utils.setTimestampFromJSONParsedObject(response.result as AppSensorEvent, response.result as Object);
                        break;
                    }
                    case 'Attack': {
                        Utils.setPrototypeInDepth(response.result as Object, Utils.attackPrototypeSample);
                        Utils.setTimestampFromJSONParsedObject(response.result as Attack, response.result as Object);
                        break;
                    }
                    case 'Response': {
                        Utils.setPrototypeInDepth(response.result as Object, Utils.responsePrototypeSample);
                        Utils.setTimestampFromJSONParsedObject(response.result as Response, response.result as Object);
                        break;
                    }
                }
    
                this.onAdd(response.result as (AppSensorEvent | Attack | Response));
    
                //also emit and event as well
                AppSensorReportingWebSocketClient.eventEmmiter.emit(AppSensorReportingWebSocketClient.ON_ADD_EVENT, 
                                                                    response.result as (AppSensorEvent | Attack | Response));

            } catch (error) {
                //could be thrown an error if the received object is not valid
                //just log to be checked where is the error
                //doesn't completely halt the running app
                Logger.getClientLogger().error('AppSensorReportingWebSocketClient.onServerResponse', error);
            }

        } else {

            AppSensorReportingWebSocketClient.eventEmmiter.emit(response.id, response);

        }
    }

    public addOnAddListener(listener: (event: AppSensorEvent | Attack | Response) => void) {
        AppSensorReportingWebSocketClient.eventEmmiter.addListener(AppSensorReportingWebSocketClient.ON_ADD_EVENT, listener);
    }

    public removeOnAddListener(listener: (event: AppSensorEvent | Attack | Response) => void) {
        AppSensorReportingWebSocketClient.eventEmmiter.removeListener(AppSensorReportingWebSocketClient.ON_ADD_EVENT, listener);
    }

    private genSendCallback(reject: (reason?: any) => void) {

        return function sendCallback(error?: Error) {
            if (error) {
                
                reject(error);
            }
        }
    }


    findEvents(earliest: string): Promise<AppSensorEvent[]> {
        return new Promise((resolve, reject) => {

            const request = AppSensorWebSocketClient.createRequest("findEvents", {earliest: earliest});

            AppSensorReportingWebSocketClient.eventEmmiter.addListener(request.id, (response: ActionResponse) => {

                AppSensorReportingWebSocketClient.eventEmmiter.removeAllListeners(request.id);

                if (response.error) {
                    reject(new Error(response.error));
                } else {
                    if (response.result && response.result instanceof Array && response.result.length > 0) {
                        for (let i = 0; i < response.result.length; i++) {
                            Utils.setPrototypeInDepth(response.result[i], Utils.appSensorEventPrototypeSample);
                            Utils.setTimestampFromJSONParsedObject(response.result[i] as AppSensorEvent, response.result[i]);
                        }
                    }

                    resolve(response.result as AppSensorEvent[]);
                }
            });

            this.sendRequest(request, this.genSendCallback(reject));
        });
    }

    findAttacks(earliest: string): Promise<Attack[]> {
        return new Promise((resolve, reject) => {

            const request = AppSensorWebSocketClient.createRequest("findAttacks", {earliest: earliest});

            AppSensorReportingWebSocketClient.eventEmmiter.addListener(request.id, (response: ActionResponse) => {

                AppSensorReportingWebSocketClient.eventEmmiter.removeAllListeners(request.id);

                if (response.error) {
                    reject(new Error(response.error));
                } else {
                    if (response.result && response.result instanceof Array && response.result.length > 0) {
                        for (let i = 0; i < response.result.length; i++) {
                            Utils.setPrototypeInDepth(response.result[i], Utils.attackPrototypeSample);
                            Utils.setTimestampFromJSONParsedObject(response.result[i] as Attack, response.result[i]);
                        }
                    }

                    resolve(response.result as Attack[]);
                }
            });

            this.sendRequest(request, this.genSendCallback(reject));
        });
    }

    findResponses(earliest: string): Promise<Response[]> {
        return new Promise((resolve, reject) => {

            const request = AppSensorWebSocketClient.createRequest("findResponses", {earliest: earliest});

            AppSensorReportingWebSocketClient.eventEmmiter.addListener(request.id, (response: ActionResponse) => {

                AppSensorReportingWebSocketClient.eventEmmiter.removeAllListeners(request.id);

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

            this.sendRequest(request, this.genSendCallback(reject));
        });
    }

    countEvents(earliest: string): Promise<number> {
        return new Promise((resolve, reject) => {

            const request = AppSensorWebSocketClient.createRequest("countEvents", {earliest: earliest});

            AppSensorReportingWebSocketClient.eventEmmiter.addListener(request.id, (response: ActionResponse) => {

                AppSensorReportingWebSocketClient.eventEmmiter.removeAllListeners(request.id);

                if (response.error) {
                    reject(new Error(response.error));
                } else {
                    resolve(response.result as number);
                }
            });

            this.sendRequest(request, this.genSendCallback(reject));
        });
    }

    countAttacks(earliest: string): Promise<number> {
        return new Promise((resolve, reject) => {

            const request = AppSensorWebSocketClient.createRequest("countAttacks", {earliest: earliest});

            AppSensorReportingWebSocketClient.eventEmmiter.addListener(request.id, (response: ActionResponse) => {

                AppSensorReportingWebSocketClient.eventEmmiter.removeAllListeners(request.id);

                if (response.error) {
                    reject(new Error(response.error));
                } else {
                    resolve(response.result as number);
                }
            });

            this.sendRequest(request, this.genSendCallback(reject));
        });
    }

    countResponses(earliest: string): Promise<number> {
        return new Promise((resolve, reject) => {

            const request = AppSensorWebSocketClient.createRequest("countResponses", {earliest: earliest});

            AppSensorReportingWebSocketClient.eventEmmiter.addListener(request.id, (response: ActionResponse) => {

                AppSensorReportingWebSocketClient.eventEmmiter.removeAllListeners(request.id);

                if (response.error) {
                    reject(new Error(response.error));
                } else {
                    resolve(response.result as number);
                }
            });

            this.sendRequest(request, this.genSendCallback(reject));
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

    countEventsByCategoryLabel(earliest: string, category: string, label: string): Promise<number> {
        return new Promise((resolve, reject) => {

            const request = AppSensorWebSocketClient.createRequest("countEventsByCategoryLabel", 
                                                                            {earliest: earliest,
                                                                             category: category,
                                                                             label: label});

            AppSensorReportingWebSocketClient.eventEmmiter.addListener(request.id, (response: ActionResponse) => {

                AppSensorReportingWebSocketClient.eventEmmiter.removeAllListeners(request.id);

                if (response.error) {
                    reject(new Error(response.error));
                } else {
                    resolve(response.result as number);
                }
            });

            this.sendRequest(request, this.genSendCallback(reject));
        });
    }

    countAttacksByCategoryLabel(earliest: string, category: string, label: string): Promise<number> {
        return new Promise((resolve, reject) => {

            const request = AppSensorWebSocketClient.createRequest("countAttacksByCategoryLabel", 
                                                                            {earliest: earliest,
                                                                             category: category,
                                                                             label: label});

            AppSensorReportingWebSocketClient.eventEmmiter.addListener(request.id, (response: ActionResponse) => {

                AppSensorReportingWebSocketClient.eventEmmiter.removeAllListeners(request.id);

                if (response.error) {
                    reject(new Error(response.error));
                } else {
                    resolve(response.result as number);
                }
            });

            this.sendRequest(request, this.genSendCallback(reject));
        });
    }

    countResponsesByCategoryLabel(earliest: string, category: string, label: string): Promise<number> {
        return new Promise((resolve, reject) => {

            const request = AppSensorWebSocketClient.createRequest("countResponsesByCategoryLabel", 
                                                                            {earliest: earliest,
                                                                             category: category,
                                                                             label: label});

            AppSensorReportingWebSocketClient.eventEmmiter.addListener(request.id, (response: ActionResponse) => {

                AppSensorReportingWebSocketClient.eventEmmiter.removeAllListeners(request.id);

                if (response.error) {
                    reject(new Error(response.error));
                } else {
                    resolve(response.result as number);
                }
            });

            this.sendRequest(request, this.genSendCallback(reject));
        });
    }

    countEventsByUser(earliest: string, user: string): Promise<number> {
        return new Promise((resolve, reject) => {

            const request = AppSensorWebSocketClient.createRequest("countEventsByUser", {earliest: earliest, user: user});

            AppSensorReportingWebSocketClient.eventEmmiter.addListener(request.id, (response: ActionResponse) => {

                AppSensorReportingWebSocketClient.eventEmmiter.removeAllListeners(request.id);

                if (response.error) {
                    reject(new Error(response.error));
                } else {
                    resolve(response.result as number);
                }
            });

            this.sendRequest(request, this.genSendCallback(reject));
        });
    }

    countAttacksByUser(earliest: string, user: string): Promise<number> {
        return new Promise((resolve, reject) => {

            const request = AppSensorWebSocketClient.createRequest("countAttacksByUser", {earliest: earliest, user: user});

            AppSensorReportingWebSocketClient.eventEmmiter.addListener(request.id, (response: ActionResponse) => {

                AppSensorReportingWebSocketClient.eventEmmiter.removeAllListeners(request.id);

                if (response.error) {
                    reject(new Error(response.error));
                } else {
                    resolve(response.result as number);
                }
            });

            this.sendRequest(request, this.genSendCallback(reject));
        });
    }

    countResponsesByUser(earliest: string, user: string): Promise<number> {
        return new Promise((resolve, reject) => {

            const request = AppSensorWebSocketClient.createRequest("countResponsesByUser", {earliest: earliest, user: user});

            AppSensorReportingWebSocketClient.eventEmmiter.addListener(request.id, (response: ActionResponse) => {

                AppSensorReportingWebSocketClient.eventEmmiter.removeAllListeners(request.id);

                if (response.error) {
                    reject(new Error(response.error));
                } else {
                    resolve(response.result as number);
                }
            });

            this.sendRequest(request, this.genSendCallback(reject));
        });
    }

    getServerConfigurationAsJson(): Promise<string> {
        return new Promise((resolve, reject) => {

            const request = AppSensorWebSocketClient.createRequest("getServerConfigurationAsJson");

            AppSensorReportingWebSocketClient.eventEmmiter.addListener(request.id, (response: ActionResponse) => {

                AppSensorReportingWebSocketClient.eventEmmiter.removeAllListeners(request.id);

                if (response.error) {
                    reject(new Error(response.error));
                } else {
                    resolve(response.result as string);
                }
            });

            this.sendRequest(request, this.genSendCallback(reject));
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