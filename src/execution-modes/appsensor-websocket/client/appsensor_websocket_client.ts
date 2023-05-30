import { ClientRequestArgs } from "http";
import WebSocket from "ws";

import { AppSensorClient } from "../../../core/core.js";
import { NoopUserManager, ResponseHandler, UserManager } from "../../../core/response/response.js";
import { LocalResponseHandler } from "../../appsensor-local/response/response.js";
import { WebSocketEventManager } from "./../client/event/event.js";

class AppSensorWebsocketExecClient {

	private appSensorClient = new AppSensorClient();

    private userManager: UserManager = new NoopUserManager();
    private responseHandler: ResponseHandler = new LocalResponseHandler(this.userManager);

    constructor(address: string | URL = '', 
                configLocation: string = '',
                options?: WebSocket.ClientOptions | ClientRequestArgs, 
                responseHandler?: ResponseHandler) {

        if (responseHandler) {
            this.responseHandler = responseHandler;
        }

        const eventManager = new WebSocketEventManager(address, configLocation, options);

        this.appSensorClient = new AppSensorClient();
        this.appSensorClient.setEventManager(eventManager);
        this.appSensorClient.setResponseHandler(this.responseHandler);
        this.appSensorClient.setUserManager(this.userManager);
    }

    getAppSensorClient() {
        return this.appSensorClient;
    }

    closeWebSocket() {
        (this.appSensorClient.getEventManager() as WebSocketEventManager).closeSocket();
    }
}

export {AppSensorWebsocketExecClient}