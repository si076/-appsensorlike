import { AppSensorEvent, Attack, Response, KeyValuePair } from "../../../core/core";
import { ReportingEngine } from "../../../core/reporting/reporting";
import { ReportingMethodRequest, ReportingMethodResponse } from "../appsensor-reporting-websocket";

import { EventEmitter } from "events";
import WebSocket from "ws";
import { v4 as uuidv4 } from 'uuid';

class AppSensorReportingWebSocketClient implements ReportingEngine {

    private static eventEmmiter: EventEmitter = new EventEmitter();

    private socket;

    constructor(url: string) {
        this.socket = new WebSocket(url);

        const onServerResponseThunk = this.onServerResponse(this);

        this.socket.on('message', onServerResponseThunk);
    }

    onServerResponse(me: AppSensorReportingWebSocketClient) {

        return function onServerResponse(ws: WebSocket, data: WebSocket.RawData, isBinary: boolean) {
            console.log('received: %s', data);

            const response: ReportingMethodResponse = JSON.parse(data.toString());
            Object.setPrototypeOf(response, ReportingMethodResponse.prototype);

            if (response.reportingMethodName === 'onAdd') {

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
        console.log(event);

        return Promise.resolve();
    }

} 

export {AppSensorReportingWebSocketClient};