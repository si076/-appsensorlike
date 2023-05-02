import { AppSensorEvent, Attack, Response, KeyValuePair, AppSensorServer, User } from "../../../core/core.js";
import { SearchCriteria } from "../../../core/criteria/criteria.js";
import { ReportingEngine } from "../../../core/reporting/reporting.js";
import { AttackStore, EventStore, ResponseStore } from "../../../core/storage/storage.js";
import { ReportingMethodRequest, ReportingMethodResponse } from "../appsensor-reporting-websocket.js";
import { JSONServerConfigurationReader } from "../../../configuration-modes/appsensor-configuration-json/server/JSONServerConfig.js";

import WebSocket, { WebSocketServer } from "ws";

class AppSensorReportingWebSocketServer implements ReportingEngine {

    private appSensorServer: AppSensorServer;

    private attackStore: AttackStore;
    private eventStore: EventStore;
    private responseStore: ResponseStore;

    private server: WebSocketServer;

    constructor(appSensorServer: AppSensorServer) {
        this.appSensorServer = appSensorServer;

        this.attackStore = this.appSensorServer.getAttackStore()!;
        this.eventStore = this.appSensorServer.getEventStore()!;
        this.responseStore = this.appSensorServer.getResponseStore()!;

        this.attackStore.registerListener(this);
        this.eventStore.registerListener(this);
        this.responseStore.registerListener(this);

        const onClientRequestThunk = this.onClientRequest(this);

        this.server = new WebSocketServer({ port: 3000 });

        this.server.on('connection', (ws) => {
            ws.on('error', console.error);

            ws.on('message', onClientRequestThunk);
            
        });
    }

    onClientRequest(me: AppSensorReportingWebSocketServer) {

        return function onClientRequest(ws: WebSocket, data: WebSocket.RawData, isBinary: boolean) {
            console.log('received: %s', data);

            const request: ReportingMethodRequest = JSON.parse(data.toString());
            Object.setPrototypeOf(request, ReportingMethodRequest.prototype);

            switch (request.reportingMethodName) {
                case "findEvents": {
                    const earliest: string | null = AppSensorReportingWebSocketServer.getParameter(request, "earliest");

                    if (!earliest) {

                        AppSensorReportingWebSocketServer.reportMissingParameter(ws, request, "earliest");

                    } else {

                        me.findEvents(earliest)
                        .then((result) => {
                            AppSensorReportingWebSocketServer.sendResult(ws, request, result);                                            
                        })
                        .catch((error) => {
                            AppSensorReportingWebSocketServer.reportError(ws, request, error);                                          
                        });
                    }

                    break;
                }
                case "findAttacks": {
                    const earliest: string | null = AppSensorReportingWebSocketServer.getParameter(request, "earliest");

                    if (!earliest) {

                        AppSensorReportingWebSocketServer.reportMissingParameter(ws, request, "earliest");

                    } else {

                        me.findAttacks(earliest)
                        .then((result) => {
                            AppSensorReportingWebSocketServer.sendResult(ws, request, result);                                            
                        })
                        .catch((error) => {
                            AppSensorReportingWebSocketServer.reportError(ws, request, error);                                          
                        });
                    }

                    break;
                }
                case "findResponses": {
                    const earliest: string | null = AppSensorReportingWebSocketServer.getParameter(request, "earliest");

                    if (!earliest) {

                        AppSensorReportingWebSocketServer.reportMissingParameter(ws, request, "earliest");

                    } else {

                        me.findResponses(earliest)
                        .then((result) => {
                            AppSensorReportingWebSocketServer.sendResult(ws, request, result);                                            
                        })
                        .catch((error) => {
                            AppSensorReportingWebSocketServer.reportError(ws, request, error);                                          
                        });
                    }

                    break;
                }
                case "countEvents": {
                    const earliest: string | null = AppSensorReportingWebSocketServer.getParameter(request, "earliest");

                    if (!earliest) {

                        AppSensorReportingWebSocketServer.reportMissingParameter(ws, request, "earliest");

                    } else {

                        me.countEvents(earliest)
                        .then((result) => {
                            AppSensorReportingWebSocketServer.sendResult(ws, request, result);                                            
                        })
                        .catch((error) => {
                            AppSensorReportingWebSocketServer.reportError(ws, request, error);                                          
                        });
                    }

                    break;
                }
                case "countAttacks": {
                    const earliest: string | null = AppSensorReportingWebSocketServer.getParameter(request, "earliest");

                    if (!earliest) {

                        AppSensorReportingWebSocketServer.reportMissingParameter(ws, request, "earliest");

                    } else {

                        me.countAttacks(earliest)
                        .then((result) => {
                            AppSensorReportingWebSocketServer.sendResult(ws, request, result);                                            
                        })
                        .catch((error) => {
                            AppSensorReportingWebSocketServer.reportError(ws, request, error);                                          
                        });
                    }

                    break;
                }
                case "countResponses": {
                    const earliest: string | null = AppSensorReportingWebSocketServer.getParameter(request, "earliest");

                    if (!earliest) {

                        AppSensorReportingWebSocketServer.reportMissingParameter(ws, request, "earliest");

                    } else {

                        me.countResponses(earliest)
                        .then((result) => {
                            AppSensorReportingWebSocketServer.sendResult(ws, request, result);                                            
                        })
                        .catch((error) => {
                            AppSensorReportingWebSocketServer.reportError(ws, request, error);                                          
                        });
                    }

                    break;
                }
                case "countEventsByLabel": {
                    break;
                }
                case "countAttacksByLabel": {
                    break;
                }
                case "countResponsesByLabel": {
                    break;
                }
                case "countEventsByUser": {
                    const earliest: string | null = AppSensorReportingWebSocketServer.getParameter(request, "earliest");
                    const user: string | null = AppSensorReportingWebSocketServer.getParameter(request, "user"); 

                    if (!earliest) {
                        AppSensorReportingWebSocketServer.reportMissingParameter(ws, request, "earliest");
                    } else if (!user) {
                        AppSensorReportingWebSocketServer.reportMissingParameter(ws, request, "user");
                    } else {

                        me.countEventsByUser(earliest, user)
                        .then((result) => {
                            AppSensorReportingWebSocketServer.sendResult(ws, request, result);                                            
                        })
                        .catch((error) => {
                            AppSensorReportingWebSocketServer.reportError(ws, request, error);                                          
                        });
                    }

                    break;
                }
                case "countAttacksByUser": {
                    const earliest: string | null = AppSensorReportingWebSocketServer.getParameter(request, "earliest");
                    const user: string | null = AppSensorReportingWebSocketServer.getParameter(request, "user"); 

                    if (!earliest) {
                        AppSensorReportingWebSocketServer.reportMissingParameter(ws, request, "earliest");
                    } else if (!user) {
                        AppSensorReportingWebSocketServer.reportMissingParameter(ws, request, "user");
                    } else {

                        me.countAttacksByUser(earliest, user)
                        .then((result) => {
                            AppSensorReportingWebSocketServer.sendResult(ws, request, result);                                            
                        })
                        .catch((error) => {
                            AppSensorReportingWebSocketServer.reportError(ws, request, error);                                          
                        });
                    }

                    break;
                }
                case "countResponsesByUser": {
                    const earliest: string | null = AppSensorReportingWebSocketServer.getParameter(request, "earliest");
                    const user: string | null = AppSensorReportingWebSocketServer.getParameter(request, "user"); 

                    if (!earliest) {
                        AppSensorReportingWebSocketServer.reportMissingParameter(ws, request, "earliest");
                    } else if (!user) {
                        AppSensorReportingWebSocketServer.reportMissingParameter(ws, request, "user");
                    } else {

                        me.countResponsesByUser(earliest, user)
                        .then((result) => {
                            AppSensorReportingWebSocketServer.sendResult(ws, request, result);                                            
                        })
                        .catch((error) => {
                            AppSensorReportingWebSocketServer.reportError(ws, request, error);                                          
                        });
                    }

                    break;
                }
                case "getServerConfigurationAsJson": {
                    
                    me.getServerConfigurationAsJson()
                    .then((result) => {
                        AppSensorReportingWebSocketServer.sendResult(ws, request, result);                                            
                    })
                    .catch((error) => {
                        AppSensorReportingWebSocketServer.reportError(ws, request, error);                                          
                    });

                    break;
                }
                case "": {
                    break;
                }
            }
        }
    }

    private static getParameter(request: ReportingMethodRequest, paramName: string): string | null {
        let param: string | null = null

        if (request.parameters) {
            const propDescr = Object.getOwnPropertyDescriptor(request.parameters, paramName);
            if (propDescr) {
                param = propDescr.value;
            }
        } 

        return param;
    }

    private static reportMissingParameter(ws: WebSocket, request: ReportingMethodRequest, paramName: string) {
        const response = new ReportingMethodResponse(request.id, 
                                                     request.reportingMethodName,
                                                     null,
                                                     `Missing required parameter ${paramName}!`);

        ws.send(JSON.stringify(response));                                             
    }

    private static reportError(ws: WebSocket, request: ReportingMethodRequest, error: any) {
        const response = new ReportingMethodResponse(request.id, 
                                                     request.reportingMethodName,
                                                     null,
                                                     error.toString());

        ws.send(JSON.stringify(response));                                             
    }

    private static sendResult(ws: WebSocket, request: ReportingMethodRequest,
                              result: number | AppSensorEvent[] | Attack[] | Response[] | null | string) {
        const response = new ReportingMethodResponse(request.id, 
                                                     request.reportingMethodName,
                                                     result);

        ws.send(JSON.stringify(response));                                             
    }


    onAdd(event: AppSensorEvent | Attack | Response): Promise<void> {

        const response = new ReportingMethodResponse('', "onAdd", event);

        this.server.clients.forEach(function each(client) {
            if (client.readyState === WebSocket.OPEN) {

              client.send(JSON.stringify(response), { binary: false });
            }
        });
        
        return Promise.resolve();
    }

    findEvents(earliest: string): Promise<AppSensorEvent[]> {
        const criteria = new SearchCriteria();
        criteria.setEarliest(new Date(earliest));

        return this.eventStore.findEvents(criteria);
    }

    findAttacks(earliest: string): Promise<Attack[]> {
        const criteria = new SearchCriteria();
        criteria.setEarliest(new Date(earliest));

        return this.attackStore.findAttacks(criteria);
    }

    findResponses(earliest: string): Promise<Response[]> {
        const criteria = new SearchCriteria();
        criteria.setEarliest(new Date(earliest));

        return this.responseStore.findResponses(criteria);
    }

    async countEvents(earliest: string): Promise<number> {
        const criteria = new SearchCriteria();
        criteria.setEarliest(new Date(earliest));

        const events = await this.eventStore.findEvents(criteria);

        return events.length;
    }

    async countAttacks(earliest: string): Promise<number> {
        const criteria = new SearchCriteria();
        criteria.setEarliest(new Date(earliest));

        const attacks = await this.attackStore.findAttacks(criteria);

        return attacks.length;
    }

    async countResponses(earliest: string): Promise<number> {
        const criteria = new SearchCriteria();
        criteria.setEarliest(new Date(earliest));

        const responses = await this.responseStore.findResponses(criteria);

        return responses.length;
    }

    async countEventsByLabel(earliest: string, label: string): Promise<number> {
        const criteria = new SearchCriteria();
        criteria.setEarliest(new Date(earliest));

        throw new Error("Method not implemented.");
    }

    async countAttacksByLabel(earliest: string, label: string): Promise<number> {
        const criteria = new SearchCriteria();
        criteria.setEarliest(new Date(earliest));

        throw new Error("Method not implemented.");
    }

    async countResponsesByLabel(earliest: string, label: string): Promise<number> {
        const criteria = new SearchCriteria();
        criteria.setEarliest(new Date(earliest));

        throw new Error("Method not implemented.");
    }

    async countEventsByUser(earliest: string, user: string): Promise<number> {
        const criteria = new SearchCriteria();
        criteria.setEarliest(new Date(earliest));
        criteria.setUser(new User(user));

        const events = await this.eventStore.findEvents(criteria);

        return events.length;
    }

    async countAttacksByUser(earliest: string, user: string): Promise<number> {
        const criteria = new SearchCriteria();
        criteria.setEarliest(new Date(earliest));
        criteria.setUser(new User(user));

        const attacks = await this.attackStore.findAttacks(criteria);

        return attacks.length;
    }

    async countResponsesByUser(earliest: string, user: string): Promise<number> {
        const criteria = new SearchCriteria();
        criteria.setEarliest(new Date(earliest));
        criteria.setUser(new User(user));

        const responses = await this.responseStore.findResponses(criteria);

        return responses.length;
    }

    getServerConfigurationAsJson(): Promise<string> {
        return Promise.resolve(JSON.stringify(new JSONServerConfigurationReader().read()));
    }

    getBase64EncodedServerConfigurationFileContent(): KeyValuePair {
        throw new Error("Method not implemented.");
    }

}

export {AppSensorReportingWebSocketServer};