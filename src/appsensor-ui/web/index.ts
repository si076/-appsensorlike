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
import sessionF, * as sessionNS from 'express-session';
import MySQLStore from 'express-mysql-session';

import morgan from 'morgan';
import hbs from 'hbs';

import passport from 'passport';
import {Strategy as LocalStrategy, IVerifyOptions} from 'passport-local';

import csurf from 'csurf';


import http, { IncomingMessage } from 'http';
import https from 'https';
import path from 'path';

import WebSocket, { WebSocketServer } from "ws";
import { ConfigurationReport } from "../reports/ConfigurationReport.js";
import { ConfigurationController } from "./controller/ConfigurationController.js";
import { ConnectionManager } from "../security/mysql/connection_manager.js";
import { UserDetails, UserDetailsService } from "../security/UserDetailsService.js";
import { ParamsDictionary } from "express-serve-static-core";
import { ParsedQs } from "qs";
import { UserManager } from "../security/UserManager.js";


type TEMPLATE_VARIABLES = {
    CONTEXT_PATH: string,
    LOGGED_IN_USERNAME: string
} & {[key: string]: string};

interface WebSocketAdditionalProperties {
    isAlive?: boolean;
    remoteAddress?: string;
};

type WebSocketExt = WebSocket.WebSocket & WebSocketAdditionalProperties;

type SESSION_USER_ID = {
    username: string;
};

interface SESSION_WITH_MESSAGES {
    messages: string[]
};

class AppsensorUIRestServerConfigReader extends JSONConfigReadValidate {
    constructor() {
        super('./appsensor-ui/web/appsensor-ui-rest-server-config.json',
              './rest/server/appsensor-rest-server-config_schema.json',
              RestServerConfig.prototype);
    }
};

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
    private static CSRF_TOKEN_NAME_VAR                 = "csrfTokenName";
    private static CSRF_TOKEN_VALUE_VAR                = "csrfTokenValue";

    private static CSRF_TOKEN_NAME = "_csrf";

    private static ACTIVE_PATHS = ['dashboard', 'detection-point', 
                                   'user', 'trends-dashboard', 
                                   'configuration', 'about', 'geo-map'];

    private userController: UserController;
    private dashboardController: DashboardController;
    private detectionPointController: DetectionPointController;
    private trendsController: TrendsDashboardController;
    private configController: ConfigurationController;

    //reporting client
    private wsReportingClient: AppSensorReportingWebSocketClient;
    //websocket server to send coming AppSensorEvent, Attack and Responses to the browser
    private websocketServer: WebSocketServer | null = null;

    private templateVariables: TEMPLATE_VARIABLES;

    private userManager: UserManager;

    constructor(restServerConfig: string = 'appsensor-ui-rest-server-config.json') {
        super(new AppsensorUIRestServerConfigReader().read(restServerConfig));

        this.wsReportingClient = new AppSensorReportingWebSocketClient();

        const userReport = new UserReport(this.wsReportingClient);
        const detectionPointReport = new DetectionPointReport(this.wsReportingClient);
        const dashboardReport = new DashboardReport(this.wsReportingClient, userReport, detectionPointReport);
        const trendsReport = new TrendsDashboardReport(this.wsReportingClient);
        const configReport = new ConfigurationReport(this.wsReportingClient);

        this.userController = new UserController(userReport);
        this.detectionPointController = new DetectionPointController(detectionPointReport);
        this.dashboardController = new DashboardController(dashboardReport);
        this.trendsController = new TrendsDashboardController(trendsReport);
        this.configController = new ConfigurationController(configReport);

        this.userManager = new UserManager();

        this.templateVariables = {
            CONTEXT_PATH: '',
            LOGGED_IN_USERNAME: ''
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

    protected override async setSession(): Promise<void> {
        const connection = await ConnectionManager.getConnection();
        const storeFunction = MySQLStore(sessionNS);
        const sessionStore = new storeFunction({}, connection);

        this.expressApp.use(sessionF({
            secret: 'session_cookie_secret',
            store: sessionStore,
            resave: false,
            saveUninitialized: false
        }));
    }

    protected override async setAuthentication(): Promise<void> {
        passport.use(new LocalStrategy(this.verifyUserCredentials.bind(this)));

        this.expressApp.use(passport.authenticate('session'));

        const self = this;

        passport.serializeUser<SESSION_USER_ID>(function(user: Express.User, cb) {
            process.nextTick(function() {
              cb(null, { username: (user as UserDetails).getUsername() });
            });
        });
          
        passport.deserializeUser<SESSION_USER_ID>(function(id, cb) {
            self.userManager.loadUserByUsername(id.username)
            .then(userDetails => {
                cb(null, userDetails);
            })
            .catch(error => {
                cb(error);
            }); 
        });
    }

    private verifyUserCredentials (username: string,
                                   password: string,
                                   done: (error: any, user?: Express.User | false, options?: IVerifyOptions) => void,
                                  ): void {

        this.userManager.loadUserByUsername(username)
        .then(userDetails => {
            if (userDetails && userDetails.isEnabled() &&
                userDetails.getPassword() === password) {
                done(null, userDetails);
            } else {
                done(null, false, { message: 'Incorrect username or password.' });
            }
        })
        .catch(error => {
            done(error);
        }); 
    }

    protected override async setAuthorization(): Promise<void> {
        this.expressApp.use(this.isAuthorized);
    }

    private isAuthorized(req: e.Request, res: e.Response, next: e.NextFunction) {
        const pathToCompare = req.path.trim().toLowerCase();
        if (pathToCompare === '/login' ||
            pathToCompare === '/about' ||
            pathToCompare.startsWith('/webjars/') || //static resources
            pathToCompare.startsWith('/css/') ||     //static resources
            pathToCompare.startsWith('/js/')) {      //static resources
            //don't require any authentication and authorization
            next();

            return;
        }

        //As first, the user has to be authenticated
        if (!req.user) {
            res.redirect('/login');
            return;
        }


        //Check authorization

        const userDetails = req.user as UserDetails;

        let requiredAuthorityName = 'VIEW_DATA';
        switch (pathToCompare) {
            case '/configuration': {

                requiredAuthorityName = 'VIEW_CONFIGURATION';

                break;
            }
            default: {
                //all others require VIEW_DATA authority
                //set at the beginning of the switch
            }
        }

        let authorized = false;
        const userAuthorities = userDetails.getAuthorities();
        for (let i = 0; i < userAuthorities.length; i++) {
            if (userAuthorities[i].getName() === requiredAuthorityName) {
                authorized = true;
                break;
            }
        };

        if (!authorized) {
            res.status(403).send("You are not authorized to perform this action!");
        } else {
            next();
        }
    }

    protected override async setRequestLogging(): Promise<void> {
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

    protected override async setRenderPages(): Promise<void> {
        const self = this;

        this.expressApp.use(this.prepareTemplateVariables.bind(this));

        const csrfProtection = csurf();
        //render pages
        this.expressApp.get('/login', csrfProtection, this.renderLogInPage.bind(this));
        this.expressApp.post('/login', e.urlencoded(), csrfProtection, passport.authenticate('local', {
            successRedirect: '/',
            failureMessage: true,
            failureRedirect: '/login'
        }));
        this.expressApp.get('/logout', function(req, res, next) {
            self.userManager.logoutUser((req.user as UserDetails).getUsername());

            req.logout(function(err) {
                if (err) { return next(err); }
                
                res.redirect('/login');
            });
        });  

        this.expressApp.get('/', this.renderPage('dashboard.html'));
        this.expressApp.get('/trends-dashboard', this.renderPage('trends-dashboard.html'));
        this.expressApp.get('/configuration', this.renderPage('configuration.html'));
        this.expressApp.get('/about', this.renderPage('about.html'));
        this.expressApp.get('/geo-map', this.renderPage('geo-map.html'));
        this.expressApp.get('/users/:user', this.renderUserPage.bind(this));
        this.expressApp.get('/detection-points/:category/:label', this.renderDetectionPointPage.bind(this));
    }

    private isMessagesAvailable(obj: any): obj is SESSION_WITH_MESSAGES {
        return 'messages' in obj;
    }

    private prepareTemplateVariables(req: e.Request, res: e.Response, next: e.NextFunction) {
        delete this.templateVariables["error"];

        this.templateVariables.LOGGED_IN_USERNAME = '';

        if (req.user) {
            delete this.templateVariables["logout"];
            this.templateVariables.LOGGED_IN_USERNAME = (req.user as UserDetails).getUsername();
        } else if (this.isMessagesAvailable(req.session) && req.session.messages.length > 0){
            this.templateVariables["error"] = req.session.messages[0]; //the message doesn't matter, only activates the error block in the template
        }

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


        if (pathToCompare.includes("/logout")) {
            this.templateVariables["logout"] = "logout";
        }


        // console.log(this.templateVariables);

        next();
    }

    private renderPage(pageName: string) {
        const self = this;
        
        return function(req: e.Request, res: e.Response, next: e.NextFunction) {
            res.render(pageName, self.templateVariables)
        }
    }

    private renderLogInPage(req: e.Request, res: e.Response, next: e.NextFunction) {

        this.templateVariables[AppsensorUIRestServer.CSRF_TOKEN_NAME_VAR] = AppsensorUIRestServer.CSRF_TOKEN_NAME;
        this.templateVariables[AppsensorUIRestServer.CSRF_TOKEN_VALUE_VAR] = req.csrfToken();

        res.render('login.html', this.templateVariables);
    }

    private renderUserPage(req: e.Request, res: e.Response, next: e.NextFunction) {
        const user = req.params.user;

        this.templateVariables[AppsensorUIRestServer.USERNAME_DETAIL_VAR] = user;

        res.render('user.html', this.templateVariables);
    }

    private renderDetectionPointPage(req: e.Request, res: e.Response, next: e.NextFunction) {
        const category = req.params.category;
        const label    = req.params.label;

        this.templateVariables[AppsensorUIRestServer.DETECTION_POINT_CATEGORY_DETAIL_VAR] = category;
        this.templateVariables[AppsensorUIRestServer.DETECTION_POINT_LABEL_DETAIL_VAR] = label;

        res.render('detection-point.html', this.templateVariables);
    }

    protected async setEndpoints(): Promise<void> {
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

        //configuration endpoints
        this.expressApp.get('/api/configuration/server-config', this.configController.getServerConfiguration.bind(this.configController));
    }

    protected override getStaticContentDir(): string {
        return AppsensorUIRestServer.STATIC_CONTENT_DIR;
    }

    protected override errorHandler(err: any,  
                                    req: e.Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>, 
                                    res: e.Response<any, Record<string, any>>, 
                                    next: e.NextFunction): void {
        if (err.code !== 'EBADCSRFTOKEN') {
            super.errorHandler(err, req, res, next);
        } else {
            // handle CSRF token errors
            res.status(403).send();
        }
    }

    protected override async attachToServer(): Promise<void> {
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

                self.wsReportingClient.addOnAddListener((obj: AppSensorEvent | Attack | Response) => {
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

        //add the express app's request listener
        super.attachToServer();
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
    
}

(async () => {
    const inst = new AppsensorUIRestServer();
    await inst.initStartServer();
})()