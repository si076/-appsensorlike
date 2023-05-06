import { AppSensorEvent, Attack, Response, KeyValuePair } from "../../../core/core.js";
import { ReportingEngine } from "../../../core/reporting/reporting.js";
import { ReportingEngineExt, ReportingMethodRequest, ReportingMethodResponse } from "../appsensor-reporting-websocket.js";

import { ClientRequestArgs } from "http";
import { EventEmitter } from "events";
import WebSocket from "ws";
import { v4 as uuidv4 } from 'uuid';
import { JSONConfigReadValidate } from "../../../utils/Utils.js";

interface IReportingWebSocketClientConfig {
    address: string | URL;
    options?: WebSocket.ClientOptions | ClientRequestArgs;
}

class ReportingWebSocketClientConfig implements IReportingWebSocketClientConfig {
    address: string | URL = '';
    options?: WebSocket.ClientOptions | ClientRequestArgs | undefined;

}

class ReportingWebSocketClientConfigReader  extends JSONConfigReadValidate {

    private configFile = './reporting-engines/appsensor-reporting-websocket/client/appsensor-reporting-websocket-client-config.json';
    private configSchemaFile = './reporting-engines/appsensor-reporting-websocket/client/appsensor-reporting-websocket-client-config_schema.json';

    public override read(configLocation: string = '', validatorLocation: string | null = '', reload: boolean = false): ReportingWebSocketClientConfig | null {
        let config : ReportingWebSocketClientConfig | null = null;

        if (configLocation === '') {
            configLocation = this.configFile;
        };

        if (validatorLocation === '') {
            validatorLocation = this.configSchemaFile;
        };

        config = super.read(configLocation, validatorLocation, reload);

        Object.setPrototypeOf(config, ReportingWebSocketClientConfig.prototype);

        return config;

    }
}


class AppSensorReportingWebSocketClient implements ReportingEngineExt {

    private static eventEmmiter: EventEmitter = new EventEmitter();

    private socket;

    constructor(address: string | URL = '', 
                options?: WebSocket.ClientOptions | ClientRequestArgs,
                configLocation: string = '') {
        
        const config = new ReportingWebSocketClientConfigReader().read(configLocation);

        let _address = address;
        if (!_address && config) {
            _address = config.address;
        }

        let _options = options;
        if (!_options && config) {
            _options = config.options;
        }

        this.socket = new WebSocket(_address, _options);

        const onServerResponseThunk = this.onServerResponse(this);

        this.socket.on('message', onServerResponseThunk);
    }

    onServerResponse(me: AppSensorReportingWebSocketClient) {

        return function onServerResponse(data: WebSocket.RawData, isBinary: boolean) {
            // console.log('received:');

            const response: ReportingMethodResponse = JSON.parse(data.toString());
            Object.setPrototypeOf(response, ReportingMethodResponse.prototype);

            if (response.reportingMethodName === 'onAdd') {

                switch (response.resultElementClass) {
                    case 'AppSensorEvent': {
                        Object.setPrototypeOf(response.result, AppSensorEvent.prototype);
                        break;
                    }
                    case 'Attack': {
                        Object.setPrototypeOf(response.result, Attack.prototype);
                        break;
                    }
                    case 'Response': {
                        Object.setPrototypeOf(response.result, Response.prototype);
                        break;
                    }
                }

                me.onAdd(response.result as (AppSensorEvent | Attack | Response));

            } else {

                AppSensorReportingWebSocketClient.eventEmmiter.emit(response.id, response);

            }
        }
    }

    private static createRequest(methodName: string, parameters?: { [propertyName: string]: string; }): ReportingMethodRequest {
        const uuid = uuidv4();

        return new ReportingMethodRequest(uuid, methodName, parameters);
    }

    findEvents(earliest: string): Promise<AppSensorEvent[]> {
        return new Promise((resolve, reject) => {

            const request = AppSensorReportingWebSocketClient.createRequest("findEvents", {earliest: earliest});

            AppSensorReportingWebSocketClient.eventEmmiter.addListener(request.id, (response: ReportingMethodResponse) => {

                AppSensorReportingWebSocketClient.eventEmmiter.removeAllListeners(request.id);

                if (response.error) {
                    reject(new Error(response.error));
                } else {
                    if (response.result && response.result instanceof Array && response.result.length > 0) {
                        for (let i = 0; i < response.result.length; i++) {
                            Object.setPrototypeOf(response.result[i], AppSensorEvent.prototype);
                        }
                    }

                    resolve(response.result as AppSensorEvent[]);
                }
            });

            this.socket.send(JSON.stringify(request));
        });
    }

    findAttacks(earliest: string): Promise<Attack[]> {
        return new Promise((resolve, reject) => {

            const request = AppSensorReportingWebSocketClient.createRequest("findAttacks", {earliest: earliest});

            AppSensorReportingWebSocketClient.eventEmmiter.addListener(request.id, (response: ReportingMethodResponse) => {

                AppSensorReportingWebSocketClient.eventEmmiter.removeAllListeners(request.id);

                if (response.error) {
                    reject(new Error(response.error));
                } else {
                    if (response.result && response.result instanceof Array && response.result.length > 0) {
                        for (let i = 0; i < response.result.length; i++) {
                            Object.setPrototypeOf(response.result[i], Attack.prototype);
                        }
                    }

                    resolve(response.result as Attack[]);
                }
            });

            this.socket.send(JSON.stringify(request));
        });
    }

    findResponses(earliest: string): Promise<Response[]> {
        return new Promise((resolve, reject) => {

            const request = AppSensorReportingWebSocketClient.createRequest("findResponses", {earliest: earliest});

            AppSensorReportingWebSocketClient.eventEmmiter.addListener(request.id, (response: ReportingMethodResponse) => {

                AppSensorReportingWebSocketClient.eventEmmiter.removeAllListeners(request.id);

                if (response.error) {
                    reject(new Error(response.error));
                } else {
                    if (response.result && response.result instanceof Array && response.result.length > 0) {
                        for (let i = 0; i < response.result.length; i++) {
                            Object.setPrototypeOf(response.result[i], Response.prototype);
                        }
                    }

                    resolve(response.result as Response[]);
                }
            });

            this.socket.send(JSON.stringify(request));
        });
    }

    countEvents(earliest: string): Promise<number> {
        return new Promise((resolve, reject) => {

            const request = AppSensorReportingWebSocketClient.createRequest("countEvents", {earliest: earliest});

            AppSensorReportingWebSocketClient.eventEmmiter.addListener(request.id, (response: ReportingMethodResponse) => {

                AppSensorReportingWebSocketClient.eventEmmiter.removeAllListeners(request.id);

                if (response.error) {
                    reject(new Error(response.error));
                } else {
                    resolve(response.result as number);
                }
            });

            this.socket.send(JSON.stringify(request));
        });
    }

    countAttacks(earliest: string): Promise<number> {
        return new Promise((resolve, reject) => {

            const request = AppSensorReportingWebSocketClient.createRequest("countAttacks", {earliest: earliest});

            AppSensorReportingWebSocketClient.eventEmmiter.addListener(request.id, (response: ReportingMethodResponse) => {

                AppSensorReportingWebSocketClient.eventEmmiter.removeAllListeners(request.id);

                if (response.error) {
                    reject(new Error(response.error));
                } else {
                    resolve(response.result as number);
                }
            });

            this.socket.send(JSON.stringify(request));
        });
    }

    countResponses(earliest: string): Promise<number> {
        return new Promise((resolve, reject) => {

            const request = AppSensorReportingWebSocketClient.createRequest("countResponses", {earliest: earliest});

            AppSensorReportingWebSocketClient.eventEmmiter.addListener(request.id, (response: ReportingMethodResponse) => {

                AppSensorReportingWebSocketClient.eventEmmiter.removeAllListeners(request.id);

                if (response.error) {
                    reject(new Error(response.error));
                } else {
                    resolve(response.result as number);
                }
            });

            this.socket.send(JSON.stringify(request));
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

            const request = AppSensorReportingWebSocketClient.createRequest("countEventsByCategoryLabel", 
                                                                            {earliest: earliest,
                                                                             category: category,
                                                                             label: label});

            AppSensorReportingWebSocketClient.eventEmmiter.addListener(request.id, (response: ReportingMethodResponse) => {

                AppSensorReportingWebSocketClient.eventEmmiter.removeAllListeners(request.id);

                if (response.error) {
                    reject(new Error(response.error));
                } else {
                    resolve(response.result as number);
                }
            });

            this.socket.send(JSON.stringify(request));
        });
    }

    countAttacksByCategoryLabel(earliest: string, category: string, label: string): Promise<number> {
        return new Promise((resolve, reject) => {

            const request = AppSensorReportingWebSocketClient.createRequest("countAttacksByCategoryLabel", 
                                                                            {earliest: earliest,
                                                                             category: category,
                                                                             label: label});

            AppSensorReportingWebSocketClient.eventEmmiter.addListener(request.id, (response: ReportingMethodResponse) => {

                AppSensorReportingWebSocketClient.eventEmmiter.removeAllListeners(request.id);

                if (response.error) {
                    reject(new Error(response.error));
                } else {
                    resolve(response.result as number);
                }
            });

            this.socket.send(JSON.stringify(request));
        });
    }

    countResponsesByCategoryLabel(earliest: string, category: string, label: string): Promise<number> {
        return new Promise((resolve, reject) => {

            const request = AppSensorReportingWebSocketClient.createRequest("countResponsesByCategoryLabel", 
                                                                            {earliest: earliest,
                                                                             category: category,
                                                                             label: label});

            AppSensorReportingWebSocketClient.eventEmmiter.addListener(request.id, (response: ReportingMethodResponse) => {

                AppSensorReportingWebSocketClient.eventEmmiter.removeAllListeners(request.id);

                if (response.error) {
                    reject(new Error(response.error));
                } else {
                    resolve(response.result as number);
                }
            });

            this.socket.send(JSON.stringify(request));
        });
    }

    countEventsByUser(earliest: string, user: string): Promise<number> {
        return new Promise((resolve, reject) => {

            const request = AppSensorReportingWebSocketClient.createRequest("countEventsByUser", {earliest: earliest, user: user});

            AppSensorReportingWebSocketClient.eventEmmiter.addListener(request.id, (response: ReportingMethodResponse) => {

                AppSensorReportingWebSocketClient.eventEmmiter.removeAllListeners(request.id);

                if (response.error) {
                    reject(new Error(response.error));
                } else {
                    resolve(response.result as number);
                }
            });

            this.socket.send(JSON.stringify(request));
        });
    }

    countAttacksByUser(earliest: string, user: string): Promise<number> {
        return new Promise((resolve, reject) => {

            const request = AppSensorReportingWebSocketClient.createRequest("countAttacksByUser", {earliest: earliest, user: user});

            AppSensorReportingWebSocketClient.eventEmmiter.addListener(request.id, (response: ReportingMethodResponse) => {

                AppSensorReportingWebSocketClient.eventEmmiter.removeAllListeners(request.id);

                if (response.error) {
                    reject(new Error(response.error));
                } else {
                    resolve(response.result as number);
                }
            });

            this.socket.send(JSON.stringify(request));
        });
    }

    countResponsesByUser(earliest: string, user: string): Promise<number> {
        return new Promise((resolve, reject) => {

            const request = AppSensorReportingWebSocketClient.createRequest("countResponsesByUser", {earliest: earliest, user: user});

            AppSensorReportingWebSocketClient.eventEmmiter.addListener(request.id, (response: ReportingMethodResponse) => {

                AppSensorReportingWebSocketClient.eventEmmiter.removeAllListeners(request.id);

                if (response.error) {
                    reject(new Error(response.error));
                } else {
                    resolve(response.result as number);
                }
            });

            this.socket.send(JSON.stringify(request));
        });
    }

    getServerConfigurationAsJson(): Promise<string> {
        return new Promise((resolve, reject) => {

            const request = AppSensorReportingWebSocketClient.createRequest("getServerConfigurationAsJson");

            AppSensorReportingWebSocketClient.eventEmmiter.addListener(request.id, (response: ReportingMethodResponse) => {

                AppSensorReportingWebSocketClient.eventEmmiter.removeAllListeners(request.id);

                if (response.error) {
                    reject(new Error(response.error));
                } else {
                    resolve(response.result as string);
                }
            });

            this.socket.send(JSON.stringify(request));
        });
    }

    getBase64EncodedServerConfigurationFileContent(): KeyValuePair {
        throw new Error("Method not implemented.");
    }

    onAdd(event: AppSensorEvent | Attack | Response): Promise<void> {
        // console.log(event);

        return Promise.resolve();
    }

} 

export {AppSensorReportingWebSocketClient};