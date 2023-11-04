import { AppSensorEvent, AppSensorServer, Attack, RequestHandler, Response } from "@appsensorlike/appsensorlike/core/core.js";
import { SearchCriteria } from "@appsensorlike/appsensorlike/core/criteria/criteria.js";
import { Logger } from "@appsensorlike/appsensorlike/logging/logging.js";
import { JSONConfigReadValidate, Utils } from "@appsensorlike/appsensorlike/utils/Utils.js";
import { Action } from "@appsensorlike/appsensorlike/core/accesscontrol/accesscontrol.js";
import { RestServer, RestServerConfig } from "@appsensorlike/appsensorlike_rest_server";

import e from 'express';

class RestRequestHandlerConfigReader extends JSONConfigReadValidate {
    constructor() {
        super(import.meta.url,
              'appsensor-rest-request-handler-config.json',
              'appsensor-rest-server-config_schema.json',
              RestServerConfig.prototype);
    }
}

class RestRequestHandler extends RestServer implements RequestHandler {

    private appSensorServer: AppSensorServer;

    private static detectionSystemId: string | null = null;
    
    constructor(appSensorServer: AppSensorServer,
                configLocation: string = 'appsensor-rest-request-handler-config.json') {
        super(new RestRequestHandlerConfigReader().read(configLocation));

        this.appSensorServer = appSensorServer;
    }

    protected override async setEndpoints(): Promise<void> {
        this.expressApp.param('earliest', function (req: e.Request, res: e.Response, next: e.NextFunction, paramValue:any) {
            if (paramValue) {
                const number = Date.parse(paramValue);
                if (Number.isNaN(number)) {
                    throw new Error(`Wrong format of 'earliest' query param! Expected format like: ${new Date().toISOString()}`); 
                }
            } else {
                throw new Error("'earliest' query param is missing");
            }
        });


        this.expressApp.post("/events", this.addEventRequest.bind(this));
        this.expressApp.get("/events", this.getEventsRequest.bind(this));

        this.expressApp.post("/attacks", this.addAttackRequest.bind(this));
        this.expressApp.get("/attacks", this.getAttacksRequest.bind(this));

        this.expressApp.get("/responses", this.getResponsesRequest.bind(this));
    }

    private checkConsumerRights(req: e.Request, res: e.Response, action: Action): boolean {

        const appSensorServerConfig = this.appSensorServer.getConfiguration();
        const appSensorAccessController = this.appSensorServer.getAccessController();

        const headerName = appSensorServerConfig!.getClientApplicationIdentificationHeaderNameOrDefault().toLowerCase();

        let headerValue: string = '';
        const propDescriptor = Object.getOwnPropertyDescriptor(req.headers, headerName);
        if (propDescriptor) {
            headerValue = propDescriptor.value
        }

        if (!this.isConnectionAllowed(headerValue, req.ip, appSensorServerConfig)) {
            res.status(401).send("Access denied for this client application!");

            return false;
        }

        if (!this.isActionAuthorized(headerValue, req.ip, appSensorServerConfig, appSensorAccessController, action)) {
            res.status(403).send(`Unauthorized action ${action}`);

            return false;
        }

        return true;
    }

    private checkParameters(req: e.Request, res: e.Response): boolean {
        if (!req.query.earliest) {
            res.status(400).send("Missing parameter: earliest");

            return false;
        } else {
            const date = Date.parse(req.query.earliest as string);
            if (isNaN(date)) {
                res.status(400).send("Parameter 'earliest' is not a date in ISO 8601 format(YYYY-MM-DDTHH:mm:ss.sssZ)");

                return false;
            }
        }

        return true;
    }


    addEventRequest(req: e.Request, res: e.Response, next: e.NextFunction) {

        if (this.checkConsumerRights(req, res, Action.ADD_EVENT)) {
            const event: AppSensorEvent = req.body;

            Utils.setPrototypeInDepth(event, Utils.appSensorEventPrototypeSample);
    
            Utils.setTimestampFromJSONParsedObject(event, event);
    
            this.addEvent(event)
            .then((result) => {
                res.status(201).send();                                
            })
            .catch((error) => {
                res.status(500).send(error.toString());                              
            });
        }
    }
    
    getEventsRequest(req: e.Request, res: e.Response, next: e.NextFunction) {
        if (this.checkConsumerRights(req, res, Action.GET_EVENTS) &&
            this.checkParameters(req, res)) {
            this.getEvents(new Date(req.query.earliest as string))
            .then((result) => {
                res.send(result);
            })
            .catch((error) => {
                res.status(500).send(error.toString());
            });
        }
    }
    
    addAttackRequest(req: e.Request, res: e.Response, next: e.NextFunction) {

        if (this.checkConsumerRights(req, res, Action.ADD_ATTACK)) {
            const attack: Attack = req.body;

            Utils.setPrototypeInDepth(attack, Utils.attackPrototypeSample);
    
            Utils.setTimestampFromJSONParsedObject(attack, attack);
    
            this.addAttack(attack)
            .then((result) => {
                res.status(201).send();                                
            })
            .catch((error) => {
                res.status(500).send(error.toString());                              
            });
        }
    }
    
    getAttacksRequest(req: e.Request, res: e.Response, next: e.NextFunction) {
        if (this.checkConsumerRights(req, res, Action.GET_ATTACKS) &&
            this.checkParameters(req, res)) {
            this.getAttacks(new Date(req.query.earliest as string))
            .then((result) => {
                res.send(result);
            })
            .catch((error) => {
                res.status(500).send(error.toString());
            });
        }
    }
    
    getResponsesRequest(req: e.Request, res: e.Response, next: e.NextFunction) {
        if (this.checkConsumerRights(req, res, Action.GET_RESPONSES) &&
            this.checkParameters(req, res)) {
            this.getResponses(new Date(req.query.earliest as string))
            .then((result) => {
                res.send(result);
            })
            .catch((error) => {
                res.status(500).send(error.toString());
            });
        }
    }
    
    async addEvent(event: AppSensorEvent): Promise<void> {
		Logger.getServerLogger().trace('RestRequestHandler.addEvent:');
        Logger.getServerLogger().trace(event);

        //error to the service consumer 
        //it doesn't need to be detailed since this is an internal server error
        //it is detailed in the server log
        const internalError = "Internal Server Error";

        try {

            const detSystem = event.getDetectionSystem();
            if (RestRequestHandler.detectionSystemId === null && detSystem !== null) {
                RestRequestHandler.detectionSystemId = detSystem.getDetectionSystemId();
            }
            
            const eventStore = this.appSensorServer.getEventStore();
            if (eventStore) {
                await eventStore.addEvent(event);
            } else {
                Logger.getServerLogger().error("RestRequestHandler.findEvents: Internal Error: EventStore cannot be undefined!");
                return Promise.reject(internalError);
            }

        } catch (error) {
			Logger.getServerLogger().error(error);

			return Promise.reject(internalError);
        }
    }

    async getEvents(earliest: Date): Promise<AppSensorEvent[]> {
		Logger.getServerLogger().trace('RestRequestHandler.findEvents:');
        Logger.getServerLogger().trace(`earliest: ${earliest}`);

        const criteria = new SearchCriteria();
        criteria.setEarliest(new Date(earliest));

        //error to the service consumer 
        //it doesn't need to be detailed since this is an internal server error
        //it is detailed in the server log
        const internalError = "Internal Server Error"; 

        try {
            const eventStore = this.appSensorServer.getEventStore();
            if (eventStore) {
                return eventStore.findEvents(criteria);
            } else {
                Logger.getServerLogger().error("RestRequestHandler.findEvents: Internal Error: EventStore cannot be undefined!");
                return Promise.reject(internalError);
            }
        } catch (error) {
			Logger.getServerLogger().error(error);

			return Promise.reject(internalError);
        }
        
    }

    async addAttack(attack: Attack): Promise<void> {
		Logger.getServerLogger().trace('RestRequestHandler.addAttack:');
        Logger.getServerLogger().trace(attack);

        try {

            const detSystem = attack.getDetectionSystem();
            if (RestRequestHandler.detectionSystemId == null && detSystem !== null) {
                RestRequestHandler.detectionSystemId = detSystem.getDetectionSystemId();
            }
            
            const attackStore = this.appSensorServer.getAttackStore();
            if (attackStore) {
                await attackStore.addAttack(attack);
            }

        } catch (error) {
            Logger.getServerLogger().error(error);

            return Promise.reject(error);
        }
    }

    async getAttacks(earliest: Date): Promise<Attack[]> {
		Logger.getServerLogger().trace('RestRequestHandler.findAttacks:');
        Logger.getServerLogger().trace(`earliest: ${earliest}`);

        const criteria = new SearchCriteria();
        criteria.setEarliest(new Date(earliest));

        //error to the service consumer 
        //it doesn't need to be detailed since this is an internal server error
        //it is detailed in the server log
        const internalError = "Internal Server Error"; 

        try {
            const attackStore = this.appSensorServer.getAttackStore();
            if (attackStore) {
                return attackStore.findAttacks(criteria);
            } else {
                Logger.getServerLogger().error("RestRequestHandler.findAttacks: Internal Error: AttackStore cannot be undefined!");
                return Promise.reject(internalError);
            }
        } catch (error) {
			Logger.getServerLogger().error(error);

			return Promise.reject(internalError);
        }
        
    }

    async getResponses(earliest: Date): Promise<Response[]> {
		Logger.getServerLogger().trace('RestRequestHandler.getResponses:');
        Logger.getServerLogger().trace(`earliest: ${earliest}`);

        try {

            const detSystem = RestRequestHandler.detectionSystemId !== null ? RestRequestHandler.detectionSystemId : "";
            const criteria = new SearchCriteria().
                    setDetectionSystemIds([detSystem]).
                    setEarliest(earliest);
            
            let responses: Response[] = []         

            const responseStore = this.appSensorServer.getResponseStore();
            if (responseStore) {
                responses = await responseStore.findResponses(criteria);
            }
            return responses;

        } catch (error) {
            Logger.getServerLogger().error(error);

            return Promise.reject(error);
        }
    }

}

export {RestRequestHandler}