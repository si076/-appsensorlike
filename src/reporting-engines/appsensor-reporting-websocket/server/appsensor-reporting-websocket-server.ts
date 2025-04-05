import { AppSensorEvent, Attack, Response, KeyValuePair, AppSensorServer, User, DetectionPoint, IPAddress } from "@appsensorlike/appsensorlike/core/core.js";
import { SearchCriteria } from "@appsensorlike/appsensorlike/core/criteria/criteria.js";
import { AttackStore, EventStore, ResponseStore } from "@appsensorlike/appsensorlike/core/storage/storage.js";
import { ReportingEngineExt } from "@appsensorlike/appsensorlike/reporting-engines/reporting-engines.js";
import { JSONConfigReadValidate } from "@appsensorlike/appsensorlike/utils/Utils.js";
import { JSONServerConfigurationReader } from "@appsensorlike/appsensorlike/configuration-modes/appsensor-configuration-json/server/JSONServerConfig.js";
import { Action, Context } from "@appsensorlike/appsensorlike/core/accesscontrol/accesscontrol.js";

import { AppSensorWebSocketServer, WebSocketExt, WebSocketServerConfig } from "@appsensorlike/appsensorlike_websocket/server";
import { ActionRequest } from "@appsensorlike/appsensorlike_websocket";

import { IncomingMessage } from "http";

class ReportingWebSocketServerConfigReader  extends JSONConfigReadValidate {

    constructor() {
        super(import.meta.url,
              'appsensor-reporting-websocket-server-config.json',
              'appsensor-websocket-server-config_schema.json',
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
                handleProtocols?: (protocols: Set<string>, request: IncomingMessage) => string | false) {
        super(new ReportingWebSocketServerConfigReader().read(configLocation), handleProtocols);

        this.appSensorServer = appSensorServer;

        this.attackStore = this.appSensorServer.getAttackStore()!;
        this.eventStore = this.appSensorServer.getEventStore()!;
        this.responseStore = this.appSensorServer.getResponseStore()!;

        this.attackStore.registerListener(this, true);
        this.eventStore.registerListener(this, true);
        this.responseStore.registerListener(this, true);
    }

    protected isConnectionAllowed(ws: WebSocketExt): boolean {
        let allowed = false;

        const config = this.appSensorServer.getConfiguration();
        if (ws.remoteAddress && config) {
            const clientApp = config.findClientApplication(ws.clientApplication);
            if (clientApp) {
                //Please note that there are no restrictions when ip addresses 
                //are not specified in the configuration under the matched client application
                allowed = clientApp.isIPAddressAllowed(ws.remoteAddress);
            }
        }

        return allowed;
    }

    protected isActionAuthorized(ws: WebSocketExt, request: ActionRequest): boolean {
        let authorized = false;

        const config = this.appSensorServer.getConfiguration();
        if (ws.remoteAddress && config) {
            const clientApp = config.findClientApplication(ws.clientApplication);
            if (clientApp) {
                authorized = this.appSensorServer.getAccessController()!
                                    .isAuthorized(clientApp, 
                                                  Action.EXECUTE_REPORT, 
                                                  new Context());
            }
        }

        return authorized;
    }
    
    protected override onClientRequest(ws: WebSocketExt, request: ActionRequest) {

        switch (request.actionName) {
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
        const config = new JSONServerConfigurationReader().prepareToJSON(this.appSensorServer.getConfiguration()!);
        return Promise.resolve(JSON.stringify(config));
    }

    getBase64EncodedServerConfigurationFileContent(): KeyValuePair {
        throw new Error("Method not implemented.");
    }

    addOnAddListener(listener: (event: AppSensorEvent | Attack | Response) => void): void {
        throw new Error("Method not implemented.");
    }

    removeOnAddListener(listener: (event: AppSensorEvent | Attack | Response) => void): void {
        throw new Error("Method not implemented.");
    }

}

export {AppSensorReportingWebSocketServer};