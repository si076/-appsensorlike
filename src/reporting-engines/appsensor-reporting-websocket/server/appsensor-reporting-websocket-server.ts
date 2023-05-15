import { AppSensorEvent, Attack, Response, KeyValuePair, AppSensorServer, User, DetectionPoint } from "../../../core/core.js";
import { SearchCriteria } from "../../../core/criteria/criteria.js";
import { AttackStore, EventStore, ResponseStore } from "../../../core/storage/storage.js";
import { ReportingEngineExt } from "../appsensor-reporting-websocket.js";
import { JSONServerConfigurationReader } from "../../../configuration-modes/appsensor-configuration-json/server/JSONServerConfig.js";

import WebSocket, {  } from "ws";
import { JSONConfigReadValidate } from "../../../utils/Utils.js";
import { AppSensorWebSocketServer, WebSockedExt, WebSocketServerConfig } from "../../../websocket/server/appsensor-websocket-server.js";
import { MethodRequest } from "../../../websocket/appsensor-websocket.js";

class ReportingWebSocketServerConfigReader  extends JSONConfigReadValidate {

    constructor() {
        super('./reporting-engines/appsensor-reporting-websocket/server/appsensor-reporting-websocket-server-config.json',
              './websocket/server/appsensor-websocket-server-config_schema.json',
              WebSocketServerConfig.prototype);
    }
}

class AppSensorReportingWebSocketServer extends AppSensorWebSocketServer implements ReportingEngineExt {

    private appSensorServer: AppSensorServer;

    private attackStore: AttackStore;
    private eventStore: EventStore;
    private responseStore: ResponseStore;

    constructor(appSensorServer: AppSensorServer,
                configLocation: string = 'appsensor-reporting-websocket-server-config.json',
                serverOptions? :WebSocket.ServerOptions) {
        super(new ReportingWebSocketServerConfigReader().read(configLocation), serverOptions);

        this.appSensorServer = appSensorServer;

        this.attackStore = this.appSensorServer.getAttackStore()!;
        this.eventStore = this.appSensorServer.getEventStore()!;
        this.responseStore = this.appSensorServer.getResponseStore()!;

        this.attackStore.registerListener(this, true);
        this.eventStore.registerListener(this, true);
        this.responseStore.registerListener(this, true);
    }

    protected override onClientRequest(ws: WebSockedExt, data: WebSocket.RawData, isBinary: boolean) {
        const request: MethodRequest = JSON.parse(data.toString());
        Object.setPrototypeOf(request, MethodRequest.prototype);

        switch (request.methodName) {
            case "findEvents": {
                const earliest = AppSensorWebSocketServer.getParameter(request, "earliest");

                if (!earliest) {

                    AppSensorWebSocketServer.reportMissingParameter(ws, request, "earliest");

                } else {

                    this.findEvents(earliest as string)
                    .then((result) => {
                        AppSensorWebSocketServer.sendResult(ws, request, result, 'AppSensorEvent');                                            
                    })
                    .catch((error) => {
                        AppSensorWebSocketServer.reportError(ws, request, error);                                          
                    });
                }

                break;
            }
            case "findAttacks": {
                const earliest = AppSensorWebSocketServer.getParameter(request, "earliest");

                if (!earliest) {

                    AppSensorWebSocketServer.reportMissingParameter(ws, request, "earliest");

                } else {

                    this.findAttacks(earliest as string)
                    .then((result) => {
                        AppSensorWebSocketServer.sendResult(ws, request, result, 'Attack');                                            
                    })
                    .catch((error) => {
                        AppSensorWebSocketServer.reportError(ws, request, error);                                          
                    });
                }

                break;
            }
            case "findResponses": {
                const earliest = AppSensorWebSocketServer.getParameter(request, "earliest");

                if (!earliest) {

                    AppSensorWebSocketServer.reportMissingParameter(ws, request, "earliest");

                } else {

                    this.findResponses(earliest as string)
                    .then((result) => {
                        AppSensorWebSocketServer.sendResult(ws, request, result, 'Response');                                            
                    })
                    .catch((error) => {
                        AppSensorWebSocketServer.reportError(ws, request, error);                                          
                    });
                }

                break;
            }
            case "countEvents": {
                const earliest = AppSensorWebSocketServer.getParameter(request, "earliest");

                if (!earliest) {

                    AppSensorWebSocketServer.reportMissingParameter(ws, request, "earliest");

                } else {

                    this.countEvents(earliest as string)
                    .then((result) => {
                        AppSensorWebSocketServer.sendResult(ws, request, result, null);                                            
                    })
                    .catch((error) => {
                        AppSensorWebSocketServer.reportError(ws, request, error);                                          
                    });
                }

                break;
            }
            case "countAttacks": {
                const earliest = AppSensorWebSocketServer.getParameter(request, "earliest");

                if (!earliest) {

                    AppSensorWebSocketServer.reportMissingParameter(ws, request, "earliest");

                } else {

                    this.countAttacks(earliest as string)
                    .then((result) => {
                        AppSensorWebSocketServer.sendResult(ws, request, result, null);                                            
                    })
                    .catch((error) => {
                        AppSensorWebSocketServer.reportError(ws, request, error);                                          
                    });
                }

                break;
            }
            case "countResponses": {
                const earliest = AppSensorWebSocketServer.getParameter(request, "earliest");

                if (!earliest) {

                    AppSensorWebSocketServer.reportMissingParameter(ws, request, "earliest");

                } else {

                    this.countResponses(earliest as string)
                    .then((result) => {
                        AppSensorWebSocketServer.sendResult(ws, request, result, null);                                            
                    })
                    .catch((error) => {
                        AppSensorWebSocketServer.reportError(ws, request, error);                                          
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
            case "countEventsByCategoryLabel": {
                const earliest = AppSensorWebSocketServer.getParameter(request, "earliest");
                const category = AppSensorWebSocketServer.getParameter(request, "category");
                const label = AppSensorWebSocketServer.getParameter(request, "label"); 

                if (!earliest) {
                    AppSensorWebSocketServer.reportMissingParameter(ws, request, "earliest");
                } else if (!category) {
                    AppSensorWebSocketServer.reportMissingParameter(ws, request, "category");
                } else if (!label) {
                    AppSensorWebSocketServer.reportMissingParameter(ws, request, "label");
                } else {

                    this.countEventsByCategoryLabel(earliest as string, category as string, label as string)
                    .then((result) => {
                        AppSensorWebSocketServer.sendResult(ws, request, result, null);                                            
                    })
                    .catch((error) => {
                        AppSensorWebSocketServer.reportError(ws, request, error);                                          
                    });
                }
                break;
            }
            case "countAttacksByCategoryLabel": {
                const earliest = AppSensorWebSocketServer.getParameter(request, "earliest");
                const category = AppSensorWebSocketServer.getParameter(request, "category");
                const label = AppSensorWebSocketServer.getParameter(request, "label"); 

                if (!earliest) {
                    AppSensorWebSocketServer.reportMissingParameter(ws, request, "earliest");
                } else if (!category) {
                    AppSensorWebSocketServer.reportMissingParameter(ws, request, "category");
                } else if (!label) {
                    AppSensorWebSocketServer.reportMissingParameter(ws, request, "label");
                } else {

                    this.countAttacksByCategoryLabel(earliest as string, category as string, label as string)
                    .then((result) => {
                        AppSensorWebSocketServer.sendResult(ws, request, result, null);                                            
                    })
                    .catch((error) => {
                        AppSensorWebSocketServer.reportError(ws, request, error);                                          
                    });
                }
                break;
            }
            case "countResponsesByCategoryLabel": {
                const earliest = AppSensorWebSocketServer.getParameter(request, "earliest");
                const category = AppSensorWebSocketServer.getParameter(request, "category");
                const label = AppSensorWebSocketServer.getParameter(request, "label"); 

                if (!earliest) {
                    AppSensorWebSocketServer.reportMissingParameter(ws, request, "earliest");
                } else if (!category) {
                    AppSensorWebSocketServer.reportMissingParameter(ws, request, "category");
                } else if (!label) {
                    AppSensorWebSocketServer.reportMissingParameter(ws, request, "label");
                } else {

                    this.countResponsesByCategoryLabel(earliest as string, category as string, label as string)
                    .then((result) => {
                        AppSensorWebSocketServer.sendResult(ws, request, result, null);                                            
                    })
                    .catch((error) => {
                        AppSensorWebSocketServer.reportError(ws, request, error);                                          
                    });
                }
                break;
            }
            case "countEventsByUser": {
                const earliest = AppSensorWebSocketServer.getParameter(request, "earliest");
                const user = AppSensorWebSocketServer.getParameter(request, "user"); 

                if (!earliest) {
                    AppSensorWebSocketServer.reportMissingParameter(ws, request, "earliest");
                } else if (!user) {
                    AppSensorWebSocketServer.reportMissingParameter(ws, request, "user");
                } else {

                    this.countEventsByUser(earliest as string, user as string)
                    .then((result) => {
                        AppSensorWebSocketServer.sendResult(ws, request, result, null);                                            
                    })
                    .catch((error) => {
                        AppSensorWebSocketServer.reportError(ws, request, error);                                          
                    });
                }

                break;
            }
            case "countAttacksByUser": {
                const earliest = AppSensorWebSocketServer.getParameter(request, "earliest");
                const user = AppSensorWebSocketServer.getParameter(request, "user"); 

                if (!earliest) {
                    AppSensorWebSocketServer.reportMissingParameter(ws, request, "earliest");
                } else if (!user) {
                    AppSensorWebSocketServer.reportMissingParameter(ws, request, "user");
                } else {

                    this.countAttacksByUser(earliest as string, user as string)
                    .then((result) => {
                        AppSensorWebSocketServer.sendResult(ws, request, result, null);                                            
                    })
                    .catch((error) => {
                        AppSensorWebSocketServer.reportError(ws, request, error);                                          
                    });
                }

                break;
            }
            case "countResponsesByUser": {
                const earliest = AppSensorWebSocketServer.getParameter(request, "earliest");
                const user = AppSensorWebSocketServer.getParameter(request, "user"); 

                if (!earliest) {
                    AppSensorWebSocketServer.reportMissingParameter(ws, request, "earliest");
                } else if (!user) {
                    AppSensorWebSocketServer.reportMissingParameter(ws, request, "user");
                } else {

                    this.countResponsesByUser(earliest as string, user as string)
                    .then((result) => {
                        AppSensorWebSocketServer.sendResult(ws, request, result, null);                                            
                    })
                    .catch((error) => {
                        AppSensorWebSocketServer.reportError(ws, request, error);                                          
                    });
                }

                break;
            }
            case "getServerConfigurationAsJson": {
                
                this.getServerConfigurationAsJson()
                .then((result) => {
                    AppSensorWebSocketServer.sendResult(ws, request, result, null);                                            
                })
                .catch((error) => {
                    AppSensorWebSocketServer.reportError(ws, request, error);                                          
                });

                break;
            }
            case "": {
                break;
            }
        }

    }

    onAdd(event: AppSensorEvent | Attack | Response): Promise<void> {

        this.broadcast("onAdd", event, event.constructor.name);
        
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

        return this.eventStore.countEvents(criteria);
    }

    async countAttacks(earliest: string): Promise<number> {
        const criteria = new SearchCriteria();
        criteria.setEarliest(new Date(earliest));

        return this.attackStore.countAttacks(criteria);
    }

    async countResponses(earliest: string): Promise<number> {
        const criteria = new SearchCriteria();
        criteria.setEarliest(new Date(earliest));

        return this.responseStore.countResponses(criteria);
    }

    async countEventsByLabel(earliest: string, label: string): Promise<number> {
        throw new Error("Method not implemented.");
    }

    async countAttacksByLabel(earliest: string, label: string): Promise<number> {
        throw new Error("Method not implemented.");
    }

    async countResponsesByLabel(earliest: string, label: string): Promise<number> {
        throw new Error("Method not implemented.");
    }

    async countEventsByCategoryLabel(earliest: string, category: string, label: string): Promise<number> {
        const criteria = new SearchCriteria();
        criteria.setEarliest(new Date(earliest));
        criteria.setDetectionPoint(new DetectionPoint(category, label));

        return this.eventStore.countEvents(criteria);
    }

    async countAttacksByCategoryLabel(earliest: string, category: string, label: string): Promise<number> {
        const criteria = new SearchCriteria();
        criteria.setEarliest(new Date(earliest));
        criteria.setDetectionPoint(new DetectionPoint(category, label));

        return this.attackStore.countAttacks(criteria);
    }

    async countResponsesByCategoryLabel(earliest: string, category: string, label: string): Promise<number> {
        const criteria = new SearchCriteria();
        criteria.setEarliest(new Date(earliest));
        criteria.setDetectionPoint(new DetectionPoint(category, label));

        return this.responseStore.countResponses(criteria);
    }

    async countEventsByUser(earliest: string, user: string): Promise<number> {
        const criteria = new SearchCriteria();
        criteria.setEarliest(new Date(earliest));
        criteria.setUser(new User(user));

        return this.eventStore.countEvents(criteria);
    }

    async countAttacksByUser(earliest: string, user: string): Promise<number> {
        const criteria = new SearchCriteria();
        criteria.setEarliest(new Date(earliest));
        criteria.setUser(new User(user));

        return this.attackStore.countAttacks(criteria);
    }

    async countResponsesByUser(earliest: string, user: string): Promise<number> {
        const criteria = new SearchCriteria();
        criteria.setEarliest(new Date(earliest));
        criteria.setUser(new User(user));

        return this.responseStore.countResponses(criteria);
    }

    getServerConfigurationAsJson(): Promise<string> {
        return Promise.resolve(JSON.stringify(new JSONServerConfigurationReader().read()));
    }

    getBase64EncodedServerConfigurationFileContent(): KeyValuePair {
        throw new Error("Method not implemented.");
    }

}

export {AppSensorReportingWebSocketServer};