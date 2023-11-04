import { IncomingMessage } from "http";
import { Context } from "@appsensorlike/appsensorlike/core/accesscontrol/accesscontrol.js";

import { AppSensorEvent, RequestHandler, AppSensorServer, Attack, Response, IPAddress, Utils as coreUtils} from "@appsensorlike/appsensorlike/core/core.js";
import { SearchCriteria } from "@appsensorlike/appsensorlike/core/criteria/criteria.js";
import { Logger } from "@appsensorlike/appsensorlike/logging/logging.js";
import { JSONConfigReadValidate, Utils } from "@appsensorlike/appsensorlike/utils/Utils.js";
import { ActionRequest, ACTION_CONFIG } from "@appsensorlike/appsensorlike_websocket";
import { AppSensorWebSocketServer, WebSocketExt, WebSocketServerConfig } from "@appsensorlike/appsensorlike_websocket/server";

class WebSocketRequestHandlerConfigReader  extends JSONConfigReadValidate {

    constructor() {
        super(import.meta.url,
              'appsensor-websocket-request-handler-config.json',
              'appsensor-websocket-server-config_schema.json',
              WebSocketServerConfig.prototype);
    }
}

class WebSocketRequestHandler extends AppSensorWebSocketServer implements RequestHandler {

	private appSensorServer: AppSensorServer;
	
	private static detectionSystemId: string | null = null;
	
    constructor(appSensorServer: AppSensorServer,
				configLocation: string = 'appsensor-websocket-request-handler-config.json',
				handleProtocols?: (protocols: Set<string>, request: IncomingMessage) => string | false) {
		super(new WebSocketRequestHandlerConfigReader().read(configLocation), handleProtocols);
        this.appSensorServer = appSensorServer;
    }

    protected isConnectionAllowed(ws: WebSocketExt): boolean {
        let allowed = false;

        const config = this.appSensorServer.getConfiguration();
        if (ws.remoteAddress && config) {
            const clientApp = config.findClientApplication(ws.clientApplication);
            if (clientApp) {
                const clientAppIP = clientApp.getIPAddress();
                if (clientAppIP) {
                    if (clientAppIP.equalAddress(ws.remoteAddress)) {
                        allowed = true;
                    }
                } else {
                    allowed = true;
                }

            }
        }

        return allowed;
    }

    protected isActionAuthorized(ws: WebSocketExt, request: ActionRequest): boolean {
        let authorized = false;

        if (request.actionName === ACTION_CONFIG) {
            authorized = true;
        } else {

            const config = this.appSensorServer.getConfiguration();
            if (ws.remoteAddress && config) {
                const clientApp = config.findClientApplication(ws.clientApplication);
                if (clientApp) {
                    authorized = this.appSensorServer.getAccessController()!
                                        .isAuthorized(clientApp, 
                                                    coreUtils.getActionFromMethod(request.actionName), 
                                                    new Context());
                }
            }
            
        }

        return authorized;
    }

	protected override onClientRequest(ws: WebSocketExt, request: ActionRequest): void {
        Logger.getServerLogger().trace('WebSocketRequestHandler.onClientRequest');

        switch (request.actionName) {
            case "addEvent": {
                const event = AppSensorWebSocketServer.getParameter(request, "event");

                if (!event) {

                    AppSensorWebSocketServer.reportMissingParameter(ws, request, "event");

                } else {
                    Utils.setPrototypeInDepth(event, Utils.appSensorEventPrototypeSample);

                    Utils.setTimestampFromJSONParsedObject(event as AppSensorEvent, event);

                    this.addEvent(event as AppSensorEvent)
                    .then((result) => {
                        AppSensorWebSocketServer.sendResult(ws, request, null, null);                                            
                    })
                    .catch((error) => {
                        AppSensorWebSocketServer.reportError(ws, request, error);                                          
                    });
                }

                break;
            }
            case "addAttack": {
                const attack = AppSensorWebSocketServer.getParameter(request, "attack");

                if (!attack) {

                    AppSensorWebSocketServer.reportMissingParameter(ws, request, "attack");

                } else {
					Utils.setPrototypeInDepth(attack, Utils.attackPrototypeSample);

                    Utils.setTimestampFromJSONParsedObject(attack as Attack, attack);

                    this.addAttack(attack as Attack)
                    .then((result) => {
                        AppSensorWebSocketServer.sendResult(ws, request, null, null);                                            
                    })
                    .catch((error) => {
                        AppSensorWebSocketServer.reportError(ws, request, error);                                          
                    });
                }

                break;
            }
            case "getEvents": {
                const earliest = AppSensorWebSocketServer.getParameter(request, "earliest");

                if (!earliest) {

                    AppSensorWebSocketServer.reportMissingParameter(ws, request, "earliest");

                } else {

                    this.getEvents(new Date(earliest as string))
                    .then((result) => {
                        AppSensorWebSocketServer.sendResult(ws, request, result, 'AppSensorEvent');                                            
                    })
                    .catch((error) => {
                        AppSensorWebSocketServer.reportError(ws, request, error);                                          
                    });
                }

                break;
            }
            case "getAttacks": {
                const earliest = AppSensorWebSocketServer.getParameter(request, "earliest");

                if (!earliest) {

                    AppSensorWebSocketServer.reportMissingParameter(ws, request, "earliest");

                } else {

                    this.getAttacks(new Date(earliest as string))
                    .then((result) => {
                        AppSensorWebSocketServer.sendResult(ws, request, result, 'Attack');                                            
                    })
                    .catch((error) => {
                        AppSensorWebSocketServer.reportError(ws, request, error);                                          
                    });
                }

                break;
            }
            case "getResponses": {
                const earliest = AppSensorWebSocketServer.getParameter(request, "earliest");

                if (!earliest) {

                    AppSensorWebSocketServer.reportMissingParameter(ws, request, "earliest");

                } else {

                    this.getResponses(new Date(earliest as string))
                    .then((result) => {
                        AppSensorWebSocketServer.sendResult(ws, request, result, 'Response');                                            
                    })
                    .catch((error) => {
                        AppSensorWebSocketServer.reportError(ws, request, error);                                          
                    });
                }

                break;
            }
		}
		
	}
	
	/**
	 * {@inheritDoc}
	 */
	public async addEvent(event: AppSensorEvent): Promise<void> {
		Logger.getServerLogger().trace('WebSocketRequestHandler.addEvent:');
        Logger.getServerLogger().trace(event);

        try {

            const detSystem = event.getDetectionSystem();
            if (WebSocketRequestHandler.detectionSystemId === null && detSystem !== null) {
                WebSocketRequestHandler.detectionSystemId = detSystem.getDetectionSystemId();
            }
            
            const eventStore = this.appSensorServer.getEventStore();
            if (eventStore) {
                await eventStore.addEvent(event);
            }

        } catch (error) {
			Logger.getServerLogger().error(error);

			return Promise.reject(error);
        }
	}

	/**
	 * {@inheritDoc}
	 */
	public async addAttack(attack: Attack): Promise<void> {
		Logger.getServerLogger().trace('WebSocketRequestHandler.addAttack:');
		Logger.getServerLogger().trace(attack);

        try {

            const detSystem = attack.getDetectionSystem();
            if (WebSocketRequestHandler.detectionSystemId == null && detSystem !== null) {
                WebSocketRequestHandler.detectionSystemId = detSystem.getDetectionSystemId();
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


    public async getEvents(earliest: Date): Promise<AppSensorEvent[]> {
		Logger.getServerLogger().trace('WebSocketRequestHandler.getEvents:');
		Logger.getServerLogger().trace(`earliest: ${earliest}`);

        try {

            const detSystem = WebSocketRequestHandler.detectionSystemId !== null ? WebSocketRequestHandler.detectionSystemId : "";
            const criteria: SearchCriteria = new SearchCriteria().
                    setDetectionSystemIds([detSystem]).
                    setEarliest(earliest);
            
            let events: AppSensorEvent[] = []         

            const eventStore = this.appSensorServer.getEventStore();
            if (eventStore) {
                events = await eventStore.findEvents(criteria);
            }
            return events;

        } catch (error) {
            Logger.getServerLogger().error(error);

            return Promise.reject(error);
        }
    }

    public async getAttacks(earliest: Date): Promise<Attack[]> {
		Logger.getServerLogger().trace('WebSocketRequestHandler.getAttacks:');
		Logger.getServerLogger().trace(`earliest: ${earliest}`);

        try {

            const detSystem = WebSocketRequestHandler.detectionSystemId !== null ? WebSocketRequestHandler.detectionSystemId : "";
            const criteria: SearchCriteria = new SearchCriteria().
                    setDetectionSystemIds([detSystem]).
                    setEarliest(earliest);
            
            let attacks: Attack[] = []         

            const attackStore = this.appSensorServer.getAttackStore();
            if (attackStore) {
                attacks = await attackStore.findAttacks(criteria);
            }
            return attacks;

        } catch (error) {
            Logger.getServerLogger().error(error);

            return Promise.reject(error);
        }
    }

	/**
	 * {@inheritDoc}
	 */
	public async getResponses(earliest: Date): Promise<Response[]> {
		Logger.getServerLogger().trace('WebSocketRequestHandler.getResponses:');
		Logger.getServerLogger().trace(`earliest: ${earliest}`);

        try {

            const detSystem = WebSocketRequestHandler.detectionSystemId !== null ? WebSocketRequestHandler.detectionSystemId : "";
            const criteria: SearchCriteria = new SearchCriteria().
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

export {WebSocketRequestHandler};