import { AppSensorReportingWebSocketClient } from "../../reporting-engines/appsensor-reporting-websocket/client/appsensor-reporting-websocket-client.js";
import { RestServer, RestServerConfig } from "../../rest/server/rest-server.js";
import { JSONConfigReadValidate } from "../../utils/Utils.js";
import { UserController } from "./controller/UserController.js";
import { DashboardController } from "./controller/DashboardController.js";
import { Logger } from "../../logging/logging.js";
import { DetectionPointController } from "./controller/DetectionPointController.js";
import { DashboardReport } from "../reports/DashboardReport.js";
import { DetectionPointReport } from "../reports/DetectionPointReport.js";
import { UserReport } from "../reports/UserReport.js";
import { TrendsDashboardReport } from "../reports/TrendsDashboardReport.js";
import { TrendsDashboardController } from "./controller/TrendsDashboardController.js";
import { AppSensorEvent, Attack, Response } from "../../core/core.js";
import { WebSocketJsonObject } from "./websocket/WebSocketJSONObject.js";

import e from 'express';
import * as serveStatic from 'serve-static';
import morgan from 'morgan';
import hbs from 'hbs';
import path from 'path';

import http, { IncomingMessage } from 'http';
import https from 'https';

import WebSocket, { WebSocketServer } from "ws";


type TEMPLATE_VARIABLES = {
    CONTEXT_PATH: string,
    LOGGED_IN_USERNAME: string
} & {[key: string]: string};

interface WebSocketAdditionalProperties {
    isAlive?: boolean;
    remoteAddress?: string;
}

type WebSocketExt = WebSocket.WebSocket & WebSocketAdditionalProperties;

class AppsensorUIRestServerConfigReader extends JSONConfigReadValidate {
    constructor() {
        super('./appsensor-ui/web/appsensor-ui-rest-server-config.json',
              './rest/server/appsensor-rest-server-config_schema.json',
              RestServerConfig.prototype);
    }
}

class AppsensorUIRestServer extends RestServer {
    
    private static TEMPLATES_DIR          = 'templates';
    private static TEMPLATES_PARTIALS_DIR = 'common';
    private static STATIC_CONTENT_DIR     = 'static'; 

    private static ACTIVE_PATH_SECTION_PART            = "ACTIVE_PATH";
    private static USERNAME_DETAIL_VAR                 = "USERNAME_DETAIL";
    private static DETECTION_POINT_CATEGORY_DETAIL_VAR = 
                    "DETECTION_POINT_CATEGORY_DETAIL";
    private static DETECTION_POINT_LABEL_DETAIL_VAR    = 
                    "DETECTION_POINT_LABEL_DETAIL";

    private static ACTIVE_PATHS = ['dashboard', 'detection-point', 
                                   'user', 'trends-dashboard', 
                                   'configuration', 'about', 'geo-map'];

    private userController: UserController;
    private dashboardController: DashboardController;
    private detectionPointController: DetectionPointController;
    private trendsController: TrendsDashboardController;

    //reporting client
    private wsClient: AppSensorReportingWebSocketClient;
    //websocket server to send coming AppSensorEvent, Attack and Responses to the browser
    private websocketServer: WebSocketServer | null = null;

    private templateVariables: TEMPLATE_VARIABLES;

    constructor(restServerConfig: string = 'appsensor-ui-rest-server-config.json') {
        super(new AppsensorUIRestServerConfigReader().read(restServerConfig));

        this.wsClient = new AppSensorReportingWebSocketClient();

        const userReport = new UserReport(this.wsClient);
        const detectionPointReport = new DetectionPointReport(this.wsClient);
        const dashboardReport = new DashboardReport(this.wsClient, userReport, detectionPointReport);
        const trendsReport = new TrendsDashboardReport(this.wsClient);

        this.userController = new UserController(userReport);
        this.detectionPointController = new DetectionPointController(detectionPointReport);
        this.dashboardController = new DashboardController(dashboardReport);
        this.trendsController = new TrendsDashboardController(trendsReport);

        this.templateVariables = {
            CONTEXT_PATH: '',
            LOGGED_IN_USERNAME: 'Test'
        };

        const basePath = this.config.basePath ? this.config.basePath : '';
        const templatesPath = path.join(basePath, AppsensorUIRestServer.TEMPLATES_DIR);

        this.expressApp.set('views', templatesPath);
        // this.expressApp.set('view engine', 'hbs');
        this.expressApp.set('view engine', 'html');
        this.expressApp.engine('html', hbs.__express);

        hbs.registerPartials(path.join(templatesPath, AppsensorUIRestServer.TEMPLATES_PARTIALS_DIR));

        // console.log("Working dir: " + process.cwd());
    }

    protected override attachToServer(): void {
        if (this.server instanceof http.Server || 
            this.server instanceof https.Server) {
            
            const self = this;

            const interval = setInterval(this.ping.bind(this), 30000);

            this.websocketServer = new WebSocketServer({ server: this.server, 
                                                         path: '/appsensor-websocket',
                                                         perMessageDeflate: false
                                                        });
            this.websocketServer.on('connection', function(ws:  WebSocketExt, req: IncomingMessage) {
                try {
                    if (typeof req.headers['x-forwarded-for'] === 'string') {
                        ws.remoteAddress = req.headers['x-forwarded-for'].split(',')[0].trim();
                    }
                } catch (error) {
                    Logger.getServerLogger().trace('AppSensorUI.websocketServer:', error);
                }
                
                if (!ws.remoteAddress) {
                    ws.remoteAddress = req.socket.remoteAddress;
                }
    
                Logger.getServerLogger().info('AppSensorUI.websocketServer:', 'connection', 
                                               'remote address:', ws.remoteAddress);

                self.wsClient.addOnAddListener((obj: AppSensorEvent | Attack | Response) => {
                    let type = '';
                    if (obj instanceof AppSensorEvent) {
                        type = "event";
                    } else if (obj instanceof Attack) {
                        type = "attack";
                    } else if (obj instanceof Response) {
                        type = "response";
                    }
                    const wsJSONObject = new WebSocketJsonObject(type, obj);
                    const wsJSONObjectStr = JSON.stringify(wsJSONObject);

                    ws.send(wsJSONObjectStr);
                });    

                ws.isAlive = true;

                ws.on('error', (error) => {
                    Logger.getServerLogger().trace('AppSensorUI.websocketServer:', ': error', error);
                });

                ws.on('message', function(this:  WebSocketExt, data: WebSocket.RawData, isBinary: boolean) {
                    Logger.getServerLogger().trace('AppSensorUI.websocketServer:', 'message:', data.toString());
                });

                ws.on('pong', function(this:  WebSocketExt) {
                    // console.log('pong');
                    Logger.getServerLogger().trace('AppSensorUI.websocketServer:', ': pong');
    
                    this.isAlive = true;
                });

            });  

            this.websocketServer.on("error", function(this: WebSocketServer, error: Error) {
                Logger.getServerLogger().error('AppSensorUI.websocketServer:', 'error:', error);
            });

            this.websocketServer.on("headers", function(this: WebSocketServer, headers: string[], request: IncomingMessage) {
                // console.log('WebSocketServer.headers', headers);
            });

            this.websocketServer.on('close', function close(this: WebSocketServer) {
                Logger.getServerLogger().info('AppSensorUI.websocketServer:', 'close');

                clearInterval(interval);
            });

        }
    }

    private ping() {
        if (this.websocketServer) {
            this.websocketServer.clients.forEach(function each(ws:  WebSocketExt) {
                if (ws.isAlive === false) return ws.terminate();
            
                ws.isAlive = false;
                ws.ping();
            });
        }
    }

    prepareTemplateVariables(req: e.Request, res: e.Response, next: e.NextFunction) {
        let path = '';
        const pathToCompare = req.path.trim().toLowerCase();
        if (pathToCompare.includes("/")) {
            path = req.path.substring(req.path.lastIndexOf("/") + 1, req.path.length);
        } else {
            path = req.path;
        }
        
        //special handler for dashboard
        if (path.length === 0) {
            path = "dashboard";
        }
        
        //special handler for detection point
        if (pathToCompare.includes("/detection-points/")) {
            path = "detection-point";
        }
        
        //special handler for users
        if (pathToCompare.includes("/users/")) {
            path = "user";
        }
        

        if (AppsensorUIRestServer.ACTIVE_PATHS.indexOf(path) > -1) {

            const keys = Object.keys(this.templateVariables);
            keys.forEach(key => {
                if (key.startsWith(AppsensorUIRestServer.ACTIVE_PATH_SECTION_PART)) {
                    //delete not active path keys
                    delete this.templateVariables[key];
                }
            });
    
            const key = AppsensorUIRestServer.ACTIVE_PATH_SECTION_PART + "_" + path;
            this.templateVariables[key] = path;
        }

        // console.log(this.templateVariables);

        next();
    }

    protected override getStaticContentDir(): string {
        return AppsensorUIRestServer.STATIC_CONTENT_DIR;
    }

    // protected override getStaticOption<R extends http.ServerResponse>(): serveStatic.ServeStaticOptions<R> {
    //     return  {
    //         fallthrough: true,
    //         redirect: false
    //     };
    // }

    protected override setRequestLogging() {
        this.expressApp.use(
            morgan('dev', 
                    {
                        immediate: true,
                        stream: { 
                            write(str: string) {
                                Logger.getServerLogger().trace(str);
                            }
                        }
                    }));
                    
        super.setRequestLogging();
    }

    renderPage(pageName: string) {
        const self = this;
        
        return function(req: e.Request, res: e.Response, next: e.NextFunction) {
            res.render(pageName, self.templateVariables)
        }
    }

    renderUserPage(req: e.Request, res: e.Response, next: e.NextFunction) {
        const user = req.params.user;

        this.templateVariables[AppsensorUIRestServer.USERNAME_DETAIL_VAR] = user;

        res.render('user.html', this.templateVariables);
    }

    renderDetectionPointPage(req: e.Request, res: e.Response, next: e.NextFunction) {
        const category = req.params.category;
        const label    = req.params.label;

        this.templateVariables[AppsensorUIRestServer.DETECTION_POINT_CATEGORY_DETAIL_VAR] = category;
        this.templateVariables[AppsensorUIRestServer.DETECTION_POINT_LABEL_DETAIL_VAR] = label;

        res.render('detection-point.html', this.templateVariables);
    }

    protected setEndpoints(): void {
        this.expressApp.use(this.prepareTemplateVariables.bind(this));

        //render pages
        this.expressApp.get('/', this.renderPage('dashboard.html'));
        this.expressApp.get('/trends-dashboard', this.renderPage('trends-dashboard.html'));
        this.expressApp.get('/configuration', this.renderPage('configuration.html'));
        this.expressApp.get('/about', this.renderPage('about.html'));
        this.expressApp.get('/geo-map', this.renderPage('geo-map.html'));
        //'/logout'
        this.expressApp.get('/users/:user', this.renderUserPage.bind(this));
        this.expressApp.get('/detection-points/:category/:label', this.renderDetectionPointPage.bind(this));

        //dashboard endpoints
        this.expressApp.get('/api/dashboard/all', this.dashboardController.allContent.bind(this.dashboardController));
        this.expressApp.get('/api/responses/active', this.dashboardController.activeResponses.bind(this.dashboardController));
        this.expressApp.get('/api/dashboard/by-time-frame', this.dashboardController.byTimeFrame.bind(this.dashboardController));
        this.expressApp.get('/api/dashboard/by-category', this.dashboardController.byCategory.bind(this.dashboardController));
        this.expressApp.get('/api/events/grouped', this.dashboardController.groupedEvents.bind(this.dashboardController));

        //detection points endpoints
        this.expressApp.get('/api/detection-points/:category/:label/all', this.detectionPointController.allContent.bind(this.detectionPointController));
        this.expressApp.get('/api/detection-points/:category/:label/by-time-frame', this.detectionPointController.byTimeFrame.bind(this.detectionPointController));
        this.expressApp.get('/api/detection-points/:label/configuration', this.detectionPointController.configuration.bind(this.detectionPointController));
        this.expressApp.get('/api/detection-points/:label/latest-events', this.detectionPointController.recentEvents.bind(this.detectionPointController));
        this.expressApp.get('/api/detection-points/:label/latest-attacks', this.detectionPointController.recentAttacks.bind(this.detectionPointController));
        this.expressApp.get('/api/detection-points/:label/by-client-application', this.detectionPointController.byClientApplication.bind(this.detectionPointController));
        this.expressApp.get('/api/detection-points/:label/top-users', this.detectionPointController.topUsers.bind(this.detectionPointController));
        this.expressApp.get('/api/detection-points/:label/grouped', this.detectionPointController.groupedDetectionPoints.bind(this.detectionPointController));
        this.expressApp.get('/api/detection-points/top', this.detectionPointController.topDetectionPoints.bind(this.detectionPointController));

        //user endpoints
        this.expressApp.get('/api/users/:username/all', this.userController.allContent.bind(this.userController));
        this.expressApp.get('/api/users/:username/active-responses',  this.userController.activeResponses.bind(this.userController));
        this.expressApp.get('/api/users/:username/by-time-frame', this.userController.byTimeFrame.bind(this.userController));
        this.expressApp.get('/api/users/:username/latest-events',  this.userController.recentEvents.bind(this.userController));
        this.expressApp.get('/api/users/:username/latest-attacks',  this.userController.recentAttacks.bind(this.userController));
        this.expressApp.get('/api/users/:username/latest-responses', this.userController.recentResponses.bind(this.userController));
        this.expressApp.get('/api/users/:username/by-client-application',  this.userController.byClientApplication.bind(this.userController));
        this.expressApp.get('/api/users/:username/grouped',  this.userController.groupedUsers.bind(this.userController));
        this.expressApp.get('/api/users/top',  this.userController.topUsers.bind(this.userController));

        //trends endpoints
        this.expressApp.get('/api/trends/by-time-frame', this.trendsController.byTimeFrame.bind(this.trendsController));


    }
}

(() => {
    const inst = new AppsensorUIRestServer();
    inst.init();
    inst.startServer();
})()