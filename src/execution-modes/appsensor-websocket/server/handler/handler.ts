import { IncomingMessage } from "http";
import { Context } from "../../../../core/accesscontrol/accesscontrol.js";

import { AppSensorEvent, RequestHandler, AppSensorServer, Attack, Response, IPAddress, Utils as coreUtils} from "../../../../core/core.js";
import { SearchCriteria } from "../../../../core/criteria/criteria.js";
import { Logger } from "../../../../logging/logging.js";
import { JSONConfigReadValidate, Utils } from "../../../../utils/Utils.js";
import { ActionRequest } from "../../../../websocket/appsensor-websocket.js";
import { AppSensorWebSocketServer, WebSocketExt, WebSocketServerConfig } from "../../../../websocket/server/appsensor-websocket-server.js";

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
            const clientApp = config.findClientApplication(new IPAddress(ws.remoteAddress));
            if (clientApp) {
                allowed = true;
            }
        }

        return allowed;
    }

    protected isActionAuthorized(ws: WebSocketExt, request: ActionRequest): boolean {
        let authorized = false;

        const config = this.appSensorServer.getConfiguration();
        if (ws.remoteAddress && config) {
            const clientApp = config.findClientApplication(new IPAddress(ws.remoteAddress));
            if (clientApp) {
                authorized = this.appSensorServer.getAccessController()!
                                    .isAuthorized(clientApp, 
                                                  coreUtils.getActionFromMethod(request.actionName), 
                                                  new Context());
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