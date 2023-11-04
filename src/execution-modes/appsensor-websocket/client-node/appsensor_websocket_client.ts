
import { AppSensorClient } from "@appsensorlike/appsensorlike/core/core.js";
import { NoopUserManager, ResponseHandler, UserManager } from "@appsensorlike/appsensorlike/core/response/response.js";
import { LocalResponseHandler } from "@appsensorlike/appsensorlike/execution-modes/appsensor-local/response/response.js";
import { WebSocketEventManager } from "./event/event.js";
import { WebSocketClientConfig } from "@appsensorlike/appsensorlike_websocket/client";

class AppSensorWebsocketExecClient {

	private appSensorClient = new AppSensorClient();

    private userManager: UserManager = new NoopUserManager();
    private responseHandler: ResponseHandler = new LocalResponseHandler(this.userManager);

    constructor(config: WebSocketClientConfig | null = null,
                configLocation: string = 'appsensor-websocket-event-manager-config.json', 
                responseHandler?: ResponseHandler) {

        if (responseHandler) {
            this.responseHandler = responseHandler;
        }

        const eventManager = new WebSocketEventManager(config, configLocation);

        this.appSensorClient = new AppSensorClient();
        this.appSensorClient.setEventManager(eventManager);
        this.appSensorClient.setResponseHandler(this.responseHandler);
        this.appSensorClient.setUserManager(this.userManager);
    }

    getAppSensorClient() {
        return this.appSensorClient;
    }

    async connectWebSocket(): Promise<boolean> {
        return (this.appSensorClient.getEventManager() as WebSocketEventManager).connect();
    }

    async closeWebSocket() {
        await (this.appSensorClient.getEventManager() as WebSocketEventManager).closeSocket();
    }
}

export {AppSensorWebsocketExecClient}