import { AppSensorEvent, AppSensorServer, Attack, RequestHandler, Response } from "../../../../core/core";
import { SearchCriteria } from "../../../../core/criteria/criteria";
import { Logger } from "../../../../logging/logging";
import { JSONConfigReadValidate, Utils } from "../../../../utils/Utils";
import { Action } from "../../../../core/accesscontrol/accesscontrol";
import { RestServer, RestServerConfig } from "../../../../rest/server/rest-server";

import e from 'express';

class RestRequestHandlerConfigReader extends JSONConfigReadValidate {
    constructor() {
        super('./execution-modes/appsensor-rest/server/handler/appsensor-rest-request-handler-config.json',
              './rest/server/appsensor-rest-server-config_schema.json',
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

    protected override setEndpoints(): void {
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

        this.expressApp.post("/events", this.addEventRequest);
        this.expressApp.get("/events:earliest", this.findEventsRequest);
    }



    private checkConsumerRights(req: e.Request, res: e.Response, action: Action): boolean {

        const appSensorServerConfig = this.appSensorServer.getConfiguration();
        const appSensorAccessController = this.appSensorServer.getAccessController();

        if (!this.isConnectionAllowed(req.ip, appSensorServerConfig)) {
            res.status(403).send("Access denied for this client application! Configure server!");

            return false;
        }

        if (!this.isActionAuthorized(req.ip, appSensorServerConfig, appSensorAccessController, action)) {
            res.status(401).send(`Unauthorized action ${action}`);

            return false;
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
                res.status(500).send(error.toString);                              
            });
        }
    }

    findEventsRequest(req: e.Request, res: e.Response, next: e.NextFunction) {
        if (this.checkConsumerRights(req, res, Action.FIND_EVENTS)) {
            this.findEvents(req.query.earliest as string)
            .then((result) => {
                res.send(result);
            })
            .catch((error) => {
                res.status(500).send(error.toString);
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

    findEvents(earliest: string): Promise<AppSensorEvent[]> {
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