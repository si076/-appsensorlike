import WebSocket from "ws";
import { AppSensorEvent, RequestHandler, AppSensorServer, Attack, Response } from "../../../core/core.js";
import { SearchCriteria } from "../../../core/criteria/criteria.js";
import { JSONConfigReadValidate, Utils } from "../../../utils/Utils.js";
import { MethodRequest } from "../../../websocket/appsensor-websocket.js";
import { AppSensorWebSocketServer, WebSockedExt, WebSocketServerConfig } from "../../../websocket/server/appsensor-websocket-server.js";

class WebSocketRequestHandlerConfigReader  extends JSONConfigReadValidate {

    constructor() {
        super('./execution-modes/appsensor-websocket/handler/appsensor-websocket-request-handler-config.json',
              './websocket/server/appsensor-websocket-server-config_schema.json',
              WebSocketServerConfig.prototype);
    }
}

class WebSocketRequestHandler extends AppSensorWebSocketServer implements RequestHandler {

	// @SuppressWarnings("unused")
	// private Logger logger;
	
	private appSensorServer: AppSensorServer;
	
	private static detectionSystemId: string | null = null;	//start with blank
	
    constructor(appSensorServer: AppSensorServer,
				configLocation: string = '',
				serverOptions? :WebSocket.ServerOptions) {
		super(new WebSocketRequestHandlerConfigReader().read(configLocation), serverOptions);
        this.appSensorServer = appSensorServer;
    }

	protected override onClientRequest(ws: WebSockedExt, data: WebSocket.RawData, isBinary: boolean): void {
        const request: MethodRequest = JSON.parse(data.toString());
        Object.setPrototypeOf(request, MethodRequest.prototype);

        switch (request.methodName) {
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
        // console.log(event);
        const detSystem = event.getDetectionSystem();
		if (WebSocketRequestHandler.detectionSystemId === null && detSystem !== null) {
			WebSocketRequestHandler.detectionSystemId = detSystem.getDetectionSystemId();
		}
		
        const eventStore = this.appSensorServer.getEventStore();
        if (eventStore) {
            await eventStore.addEvent(event);
        }
	}

	/**
	 * {@inheritDoc}
	 */
	public async addAttack(attack: Attack): Promise<void> {
        const detSystem = attack.getDetectionSystem();
		if (WebSocketRequestHandler.detectionSystemId == null && detSystem !== null) {
			WebSocketRequestHandler.detectionSystemId = detSystem.getDetectionSystemId();
		}
		
        const attackStore = this.appSensorServer.getAttackStore();
        if (attackStore) {
            await attackStore.addAttack(attack);
        }
	}


	/**
	 * {@inheritDoc}
	 */
	public async getResponses(earliest: Date): Promise<Response[]> {
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
	}

}

export {WebSocketRequestHandler};