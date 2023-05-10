import { AppSensorEvent, Attack, Response, KeyValuePair } from "../../../core/core.js";
import { JSONConfigReadValidate, Utils } from "../../../utils/Utils.js";
import { MethodResponse } from "../../../websocket/appsensor-websocket.js";
import { ReportingEngineExt } from "../appsensor-reporting-websocket.js";
import { AppSensorWebSocketClient, WebSocketClientConfig } from "../../../websocket/client/appsensor-websocket-client.js";

import { ClientRequestArgs } from "http";
import { EventEmitter } from "events";
import WebSocket from "ws";

class ReportingWebSocketClientConfigReader  extends JSONConfigReadValidate {

    constructor() {
        super('./reporting-engines/appsensor-reporting-websocket/client/appsensor-reporting-websocket-client-config.json',
              './websocket/client/appsensor-websocket-client-config_schema.json',
              WebSocketClientConfig.prototype);
    }
}

class AppSensorReportingWebSocketClient extends AppSensorWebSocketClient implements ReportingEngineExt {

    private static eventEmmiter: EventEmitter = new EventEmitter();

    constructor(address: string | URL = '', 
                configLocation: string = '',
                options?: WebSocket.ClientOptions | ClientRequestArgs) {
        super(address, new ReportingWebSocketClientConfigReader().read(configLocation), options);
    }

    protected override onServerResponse(data: WebSocket.RawData, isBinary: boolean) {
        const response: MethodResponse = JSON.parse(data.toString());
        Object.setPrototypeOf(response, MethodResponse.prototype);

        if (response.methodName === 'onAdd') {

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

        } else {

            AppSensorReportingWebSocketClient.eventEmmiter.emit(response.id, response);

        }
    }

    findEvents(earliest: string): Promise<AppSensorEvent[]> {
        return new Promise((resolve, reject) => {

            const request = AppSensorWebSocketClient.createRequest("findEvents", {earliest: earliest});

            AppSensorReportingWebSocketClient.eventEmmiter.addListener(request.id, (response: MethodResponse) => {

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

            try {
                this.sendRequest(request);
            } catch (error) {
                reject(error);
            }
        });
    }

    findAttacks(earliest: string): Promise<Attack[]> {
        return new Promise((resolve, reject) => {

            const request = AppSensorWebSocketClient.createRequest("findAttacks", {earliest: earliest});

            AppSensorReportingWebSocketClient.eventEmmiter.addListener(request.id, (response: MethodResponse) => {

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

            try {
                this.sendRequest(request);
            } catch (error) {
                reject(error);
            }
        });
    }

    findResponses(earliest: string): Promise<Response[]> {
        return new Promise((resolve, reject) => {

            const request = AppSensorWebSocketClient.createRequest("findResponses", {earliest: earliest});

            AppSensorReportingWebSocketClient.eventEmmiter.addListener(request.id, (response: MethodResponse) => {

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

            try {
                this.sendRequest(request);
            } catch (error) {
                reject(error);
            }
        });
    }

    countEvents(earliest: string): Promise<number> {
        return new Promise((resolve, reject) => {

            const request = AppSensorWebSocketClient.createRequest("countEvents", {earliest: earliest});

            AppSensorReportingWebSocketClient.eventEmmiter.addListener(request.id, (response: MethodResponse) => {

                AppSensorReportingWebSocketClient.eventEmmiter.removeAllListeners(request.id);

                if (response.error) {
                    reject(new Error(response.error));
                } else {
                    resolve(response.result as number);
                }
            });

            try {
                this.sendRequest(request);
            } catch (error) {
                reject(error);
            }
        });
    }

    countAttacks(earliest: string): Promise<number> {
        return new Promise((resolve, reject) => {

            const request = AppSensorWebSocketClient.createRequest("countAttacks", {earliest: earliest});

            AppSensorReportingWebSocketClient.eventEmmiter.addListener(request.id, (response: MethodResponse) => {

                AppSensorReportingWebSocketClient.eventEmmiter.removeAllListeners(request.id);

                if (response.error) {
                    reject(new Error(response.error));
                } else {
                    resolve(response.result as number);
                }
            });

            try {
                this.sendRequest(request);
            } catch (error) {
                reject(error);
            }
        });
    }

    countResponses(earliest: string): Promise<number> {
        return new Promise((resolve, reject) => {

            const request = AppSensorWebSocketClient.createRequest("countResponses", {earliest: earliest});

            AppSensorReportingWebSocketClient.eventEmmiter.addListener(request.id, (response: MethodResponse) => {

                AppSensorReportingWebSocketClient.eventEmmiter.removeAllListeners(request.id);

                if (response.error) {
                    reject(new Error(response.error));
                } else {
                    resolve(response.result as number);
                }
            });

            try {
                this.sendRequest(request);
            } catch (error) {
                reject(error);
            }
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

            AppSensorReportingWebSocketClient.eventEmmiter.addListener(request.id, (response: MethodResponse) => {

                AppSensorReportingWebSocketClient.eventEmmiter.removeAllListeners(request.id);

                if (response.error) {
                    reject(new Error(response.error));
                } else {
                    resolve(response.result as number);
                }
            });

            try {
                this.sendRequest(request);
            } catch (error) {
                reject(error);
            }
        });
    }

    countAttacksByCategoryLabel(earliest: string, category: string, label: string): Promise<number> {
        return new Promise((resolve, reject) => {

            const request = AppSensorWebSocketClient.createRequest("countAttacksByCategoryLabel", 
                                                                            {earliest: earliest,
                                                                             category: category,
                                                                             label: label});

            AppSensorReportingWebSocketClient.eventEmmiter.addListener(request.id, (response: MethodResponse) => {

                AppSensorReportingWebSocketClient.eventEmmiter.removeAllListeners(request.id);

                if (response.error) {
                    reject(new Error(response.error));
                } else {
                    resolve(response.result as number);
                }
            });

            try {
                this.sendRequest(request);
            } catch (error) {
                reject(error);
            }
        });
    }

    countResponsesByCategoryLabel(earliest: string, category: string, label: string): Promise<number> {
        return new Promise((resolve, reject) => {

            const request = AppSensorWebSocketClient.createRequest("countResponsesByCategoryLabel", 
                                                                            {earliest: earliest,
                                                                             category: category,
                                                                             label: label});

            AppSensorReportingWebSocketClient.eventEmmiter.addListener(request.id, (response: MethodResponse) => {

                AppSensorReportingWebSocketClient.eventEmmiter.removeAllListeners(request.id);

                if (response.error) {
                    reject(new Error(response.error));
                } else {
                    resolve(response.result as number);
                }
            });

            try {
                this.sendRequest(request);
            } catch (error) {
                reject(error);
            }
        });
    }

    countEventsByUser(earliest: string, user: string): Promise<number> {
        return new Promise((resolve, reject) => {

            const request = AppSensorWebSocketClient.createRequest("countEventsByUser", {earliest: earliest, user: user});

            AppSensorReportingWebSocketClient.eventEmmiter.addListener(request.id, (response: MethodResponse) => {

                AppSensorReportingWebSocketClient.eventEmmiter.removeAllListeners(request.id);

                if (response.error) {
                    reject(new Error(response.error));
                } else {
                    resolve(response.result as number);
                }
            });

            try {
                this.sendRequest(request);
            } catch (error) {
                reject(error);
            }
        });
    }

    countAttacksByUser(earliest: string, user: string): Promise<number> {
        return new Promise((resolve, reject) => {

            const request = AppSensorWebSocketClient.createRequest("countAttacksByUser", {earliest: earliest, user: user});

            AppSensorReportingWebSocketClient.eventEmmiter.addListener(request.id, (response: MethodResponse) => {

                AppSensorReportingWebSocketClient.eventEmmiter.removeAllListeners(request.id);

                if (response.error) {
                    reject(new Error(response.error));
                } else {
                    resolve(response.result as number);
                }
            });

            try {
                this.sendRequest(request);
            } catch (error) {
                reject(error);
            }
        });
    }

    countResponsesByUser(earliest: string, user: string): Promise<number> {
        return new Promise((resolve, reject) => {

            const request = AppSensorWebSocketClient.createRequest("countResponsesByUser", {earliest: earliest, user: user});

            AppSensorReportingWebSocketClient.eventEmmiter.addListener(request.id, (response: MethodResponse) => {

                AppSensorReportingWebSocketClient.eventEmmiter.removeAllListeners(request.id);

                if (response.error) {
                    reject(new Error(response.error));
                } else {
                    resolve(response.result as number);
                }
            });

            try {
                this.sendRequest(request);
            } catch (error) {
                reject(error);
            }
        });
    }

    getServerConfigurationAsJson(): Promise<string> {
        return new Promise((resolve, reject) => {

            const request = AppSensorWebSocketClient.createRequest("getServerConfigurationAsJson");

            AppSensorReportingWebSocketClient.eventEmmiter.addListener(request.id, (response: MethodResponse) => {

                AppSensorReportingWebSocketClient.eventEmmiter.removeAllListeners(request.id);

                if (response.error) {
                    reject(new Error(response.error));
                } else {
                    resolve(response.result as string);
                }
            });

            try {
                this.sendRequest(request);
            } catch (error) {
                reject(error);
            }
        });
    }

    getBase64EncodedServerConfigurationFileContent(): KeyValuePair {
        throw new Error("Method not implemented.");
    }

    onAdd(event: AppSensorEvent | Attack | Response): Promise<void> {
        //your code in the subclass goes here

        return Promise.resolve();
    }

} 

export {AppSensorReportingWebSocketClient};