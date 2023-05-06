import { AppSensorEvent, Attack, Response, KeyValuePair, AppSensorServer, User, DetectionPoint } from "../../../core/core.js";
import { SearchCriteria } from "../../../core/criteria/criteria.js";
import { ReportingEngine } from "../../../core/reporting/reporting.js";
import { AttackStore, EventStore, ResponseStore } from "../../../core/storage/storage.js";
import { ReportingEngineExt, ReportingMethodRequest, ReportingMethodResponse } from "../appsensor-reporting-websocket.js";
import { JSONServerConfigurationReader } from "../../../configuration-modes/appsensor-configuration-json/server/JSONServerConfig.js";

import WebSocket, { PerMessageDeflateOptions, WebSocketServer } from "ws";
import { JSONConfigReadValidate } from "../../../utils/Utils.js";

interface IReportingWebSocketServerConfig {
    options: {
        host?: string | undefined;
        port?: number | undefined;
        backlog?: number | undefined;
        path?: string | undefined;
        noServer?: boolean | undefined;
        clientTracking?: boolean | undefined;
        perMessageDeflate?: boolean | PerMessageDeflateOptions | undefined;
        maxPayload?: number | undefined;
        skipUTF8Validation?: boolean | undefined;
    }
}

class ReportingWebSocketServerConfig implements IReportingWebSocketServerConfig {
    options = {};
}

class ReportingWebSocketServerConfigReader  extends JSONConfigReadValidate {

    private configFile = './reporting-engines/appsensor-reporting-websocket/server/appsensor-reporting-websocket-server-config.json';
    private configSchemaFile = './reporting-engines/appsensor-reporting-websocket/server/appsensor-reporting-websocket-server-config_schema.json';

    public override read(configLocation: string = '', validatorLocation: string | null = '', reload: boolean = false): ReportingWebSocketServerConfig | null {
        let config : ReportingWebSocketServerConfig | null = null;

        if (configLocation === '') {
            configLocation = this.configFile;
        };

        if (validatorLocation === '') {
            validatorLocation = this.configSchemaFile;
        };

        config = super.read(configLocation, validatorLocation, reload);

        Object.setPrototypeOf(config, ReportingWebSocketServerConfig.prototype);

        return config;

    }
}

interface WebSocketAdditionalProperties {
    isAlive?: boolean;
}

declare const WebSockedExt: WebSocket.WebSocket & WebSocketAdditionalProperties;

class AppSensorReportingWebSocketServer implements ReportingEngineExt {

    private static DEFAULT_PORT = 3000;

    private appSensorServer: AppSensorServer;

    private attackStore: AttackStore;
    private eventStore: EventStore;
    private responseStore: ResponseStore;

    private server: WebSocketServer;

    constructor(appSensorServer: AppSensorServer,
                configLocation: string = '',
                serverOptions? :WebSocket.ServerOptions) {
        this.appSensorServer = appSensorServer;

        this.attackStore = this.appSensorServer.getAttackStore()!;
        this.eventStore = this.appSensorServer.getEventStore()!;
        this.responseStore = this.appSensorServer.getResponseStore()!;

        this.attackStore.registerListener(this, true);
        this.eventStore.registerListener(this, true);
        this.responseStore.registerListener(this, true);


        let servOptions = serverOptions;
        if (!servOptions) {
            const config = new ReportingWebSocketServerConfigReader().read(configLocation);

            if (config) {
                servOptions = config.options;
            } else {
                servOptions = {port: AppSensorReportingWebSocketServer.DEFAULT_PORT};
            }
        }

        this.server = new WebSocketServer(servOptions);

        const pingThunk = this.ping(this);

        const interval = setInterval(pingThunk, 30000);

        const onClientRequestThunk = this.onClientRequest(this);

        this.server.on('connection', function(ws: typeof WebSockedExt) {
            ws.isAlive = true;
            ws.on('error', console.error);

            ws.on('message', onClientRequestThunk);
            
            ws.on('pong', function(this: typeof WebSockedExt) {
                this.isAlive = true;
            });
        });

        this.server.on('close', function close() {
            clearInterval(interval);
        });
    }

    ping(me: AppSensorReportingWebSocketServer) {

        return function ping() {
            me.server.clients.forEach(function each(ws: typeof WebSockedExt) {
              if (ws.isAlive === false) return ws.terminate();
          
              ws.isAlive = false;
              ws.ping();
            });
        }
    }

    onClientRequest(me: AppSensorReportingWebSocketServer) {

        return function onClientRequest(this: typeof WebSockedExt, data: WebSocket.RawData, isBinary: boolean) {
            // console.log('received:');
            // console.log(data);

            const request: ReportingMethodRequest = JSON.parse(data.toString());
            Object.setPrototypeOf(request, ReportingMethodRequest.prototype);

            switch (request.reportingMethodName) {
                case "findEvents": {
                    const earliest: string | null = AppSensorReportingWebSocketServer.getParameter(request, "earliest");

                    if (!earliest) {

                        AppSensorReportingWebSocketServer.reportMissingParameter(this, request, "earliest");

                    } else {

                        me.findEvents(earliest)
                        .then((result) => {
                            AppSensorReportingWebSocketServer.sendResult(this, request, result, 'AppSensorEvent');                                            
                        })
                        .catch((error) => {
                            AppSensorReportingWebSocketServer.reportError(this, request, error);                                          
                        });
                    }

                    break;
                }
                case "findAttacks": {
                    const earliest: string | null = AppSensorReportingWebSocketServer.getParameter(request, "earliest");

                    if (!earliest) {

                        AppSensorReportingWebSocketServer.reportMissingParameter(this, request, "earliest");

                    } else {

                        me.findAttacks(earliest)
                        .then((result) => {
                            AppSensorReportingWebSocketServer.sendResult(this, request, result, 'Attack');                                            
                        })
                        .catch((error) => {
                            AppSensorReportingWebSocketServer.reportError(this, request, error);                                          
                        });
                    }

                    break;
                }
                case "findResponses": {
                    const earliest: string | null = AppSensorReportingWebSocketServer.getParameter(request, "earliest");

                    if (!earliest) {

                        AppSensorReportingWebSocketServer.reportMissingParameter(this, request, "earliest");

                    } else {

                        me.findResponses(earliest)
                        .then((result) => {
                            AppSensorReportingWebSocketServer.sendResult(this, request, result, 'Response');                                            
                        })
                        .catch((error) => {
                            AppSensorReportingWebSocketServer.reportError(this, request, error);                                          
                        });
                    }

                    break;
                }
                case "countEvents": {
                    const earliest: string | null = AppSensorReportingWebSocketServer.getParameter(request, "earliest");

                    if (!earliest) {

                        AppSensorReportingWebSocketServer.reportMissingParameter(this, request, "earliest");

                    } else {

                        me.countEvents(earliest)
                        .then((result) => {
                            AppSensorReportingWebSocketServer.sendResult(this, request, result, null);                                            
                        })
                        .catch((error) => {
                            AppSensorReportingWebSocketServer.reportError(this, request, error);                                          
                        });
                    }

                    break;
                }
                case "countAttacks": {
                    const earliest: string | null = AppSensorReportingWebSocketServer.getParameter(request, "earliest");

                    if (!earliest) {

                        AppSensorReportingWebSocketServer.reportMissingParameter(this, request, "earliest");

                    } else {

                        me.countAttacks(earliest)
                        .then((result) => {
                            AppSensorReportingWebSocketServer.sendResult(this, request, result, null);                                            
                        })
                        .catch((error) => {
                            AppSensorReportingWebSocketServer.reportError(this, request, error);                                          
                        });
                    }

                    break;
                }
                case "countResponses": {
                    const earliest: string | null = AppSensorReportingWebSocketServer.getParameter(request, "earliest");

                    if (!earliest) {

                        AppSensorReportingWebSocketServer.reportMissingParameter(this, request, "earliest");

                    } else {

                        me.countResponses(earliest)
                        .then((result) => {
                            AppSensorReportingWebSocketServer.sendResult(this, request, result, null);                                            
                        })
                        .catch((error) => {
                            AppSensorReportingWebSocketServer.reportError(this, request, error);                                          
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
                    const earliest: string | null = AppSensorReportingWebSocketServer.getParameter(request, "earliest");
                    const category: string | null = AppSensorReportingWebSocketServer.getParameter(request, "category");
                    const label: string | null = AppSensorReportingWebSocketServer.getParameter(request, "label"); 

                    if (!earliest) {
                        AppSensorReportingWebSocketServer.reportMissingParameter(this, request, "earliest");
                    } else if (!category) {
                        AppSensorReportingWebSocketServer.reportMissingParameter(this, request, "category");
                    } else if (!label) {
                        AppSensorReportingWebSocketServer.reportMissingParameter(this, request, "label");
                    } else {

                        me.countEventsByCategoryLabel(earliest, category, label)
                        .then((result) => {
                            AppSensorReportingWebSocketServer.sendResult(this, request, result, null);                                            
                        })
                        .catch((error) => {
                            AppSensorReportingWebSocketServer.reportError(this, request, error);                                          
                        });
                    }
                    break;
                }
                case "countAttacksByCategoryLabel": {
                    const earliest: string | null = AppSensorReportingWebSocketServer.getParameter(request, "earliest");
                    const category: string | null = AppSensorReportingWebSocketServer.getParameter(request, "category");
                    const label: string | null = AppSensorReportingWebSocketServer.getParameter(request, "label"); 

                    if (!earliest) {
                        AppSensorReportingWebSocketServer.reportMissingParameter(this, request, "earliest");
                    } else if (!category) {
                        AppSensorReportingWebSocketServer.reportMissingParameter(this, request, "category");
                    } else if (!label) {
                        AppSensorReportingWebSocketServer.reportMissingParameter(this, request, "label");
                    } else {

                        me.countAttacksByCategoryLabel(earliest, category, label)
                        .then((result) => {
                            AppSensorReportingWebSocketServer.sendResult(this, request, result, null);                                            
                        })
                        .catch((error) => {
                            AppSensorReportingWebSocketServer.reportError(this, request, error);                                          
                        });
                    }
                    break;
                }
                case "countResponsesByCategoryLabel": {
                    const earliest: string | null = AppSensorReportingWebSocketServer.getParameter(request, "earliest");
                    const category: string | null = AppSensorReportingWebSocketServer.getParameter(request, "category");
                    const label: string | null = AppSensorReportingWebSocketServer.getParameter(request, "label"); 

                    if (!earliest) {
                        AppSensorReportingWebSocketServer.reportMissingParameter(this, request, "earliest");
                    } else if (!category) {
                        AppSensorReportingWebSocketServer.reportMissingParameter(this, request, "category");
                    } else if (!label) {
                        AppSensorReportingWebSocketServer.reportMissingParameter(this, request, "label");
                    } else {

                        me.countResponsesByCategoryLabel(earliest, category, label)
                        .then((result) => {
                            AppSensorReportingWebSocketServer.sendResult(this, request, result, null);                                            
                        })
                        .catch((error) => {
                            AppSensorReportingWebSocketServer.reportError(this, request, error);                                          
                        });
                    }
                    break;
                }
                case "countEventsByUser": {
                    const earliest: string | null = AppSensorReportingWebSocketServer.getParameter(request, "earliest");
                    const user: string | null = AppSensorReportingWebSocketServer.getParameter(request, "user"); 

                    if (!earliest) {
                        AppSensorReportingWebSocketServer.reportMissingParameter(this, request, "earliest");
                    } else if (!user) {
                        AppSensorReportingWebSocketServer.reportMissingParameter(this, request, "user");
                    } else {

                        me.countEventsByUser(earliest, user)
                        .then((result) => {
                            AppSensorReportingWebSocketServer.sendResult(this, request, result, null);                                            
                        })
                        .catch((error) => {
                            AppSensorReportingWebSocketServer.reportError(this, request, error);                                          
                        });
                    }

                    break;
                }
                case "countAttacksByUser": {
                    const earliest: string | null = AppSensorReportingWebSocketServer.getParameter(request, "earliest");
                    const user: string | null = AppSensorReportingWebSocketServer.getParameter(request, "user"); 

                    if (!earliest) {
                        AppSensorReportingWebSocketServer.reportMissingParameter(this, request, "earliest");
                    } else if (!user) {
                        AppSensorReportingWebSocketServer.reportMissingParameter(this, request, "user");
                    } else {

                        me.countAttacksByUser(earliest, user)
                        .then((result) => {
                            AppSensorReportingWebSocketServer.sendResult(this, request, result, null);                                            
                        })
                        .catch((error) => {
                            AppSensorReportingWebSocketServer.reportError(this, request, error);                                          
                        });
                    }

                    break;
                }
                case "countResponsesByUser": {
                    const earliest: string | null = AppSensorReportingWebSocketServer.getParameter(request, "earliest");
                    const user: string | null = AppSensorReportingWebSocketServer.getParameter(request, "user"); 

                    if (!earliest) {
                        AppSensorReportingWebSocketServer.reportMissingParameter(this, request, "earliest");
                    } else if (!user) {
                        AppSensorReportingWebSocketServer.reportMissingParameter(this, request, "user");
                    } else {

                        me.countResponsesByUser(earliest, user)
                        .then((result) => {
                            AppSensorReportingWebSocketServer.sendResult(this, request, result, null);                                            
                        })
                        .catch((error) => {
                            AppSensorReportingWebSocketServer.reportError(this, request, error);                                          
                        });
                    }

                    break;
                }
                case "getServerConfigurationAsJson": {
                    
                    me.getServerConfigurationAsJson()
                    .then((result) => {
                        AppSensorReportingWebSocketServer.sendResult(this, request, result, null);                                            
                    })
                    .catch((error) => {
                        AppSensorReportingWebSocketServer.reportError(this, request, error);                                          
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
                                                     null,
                                                     `Missing required parameter ${paramName}!`);

        ws.send(JSON.stringify(response));                                             
    }

    private static reportError(ws: WebSocket, request: ReportingMethodRequest, error: any) {
        const response = new ReportingMethodResponse(request.id, 
                                                     request.reportingMethodName,
                                                     null,
                                                     null,
                                                     error.toString());

        ws.send(JSON.stringify(response));                                             
    }

    private static sendResult(ws: WebSocket, request: ReportingMethodRequest,
                              result: number | AppSensorEvent[] | Attack[] | Response[] | null | string,
                              resultElementClass: string | null) {
        const response = new ReportingMethodResponse(request.id, 
                                                     request.reportingMethodName,
                                                     result,
                                                     resultElementClass);

        ws.send(JSON.stringify(response));                                             
    }


    onAdd(event: AppSensorEvent | Attack | Response): Promise<void> {

        const response = new ReportingMethodResponse('', "onAdd", event, event.constructor.name);

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

export {AppSensorReportingWebSocketServer, IReportingWebSocketServerConfig};