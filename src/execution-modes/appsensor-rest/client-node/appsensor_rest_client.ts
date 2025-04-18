import { ServerConnection } from "@appsensorlike/appsensorlike/core/configuration/client/client_configuration.js";
import { AppSensorClient } from "@appsensorlike/appsensorlike/core/core.js";
import { UserManager, NoopUserManager, ResponseHandler } from "@appsensorlike/appsensorlike/core/response/response.js";
import { LocalResponseHandler } from "@appsensorlike/appsensorlike/execution-modes/appsensor-local/response/response.js";
import { RestEventManager } from "./event/event.js";

class AppSensorRestClient {
	private appSensorClient = new AppSensorClient();

    private userManager: UserManager = new NoopUserManager();
    private responseHandler: ResponseHandler = new LocalResponseHandler(this.userManager);

    constructor(url: string = '', 
                configLocation: string = 'appsensor-rest-request-event-config.json',
                clientApplicationIdentificationHeaderName: string = ServerConnection.DEFAULT_HEADER_NAME,
                clientApplicationIdentificationHeaderValue: string = '',
                responseHandler?: ResponseHandler) {

        if (responseHandler) {
            this.responseHandler = responseHandler;
        }

        const eventManager = new RestEventManager(url, 
                                                  clientApplicationIdentificationHeaderName,
                                                  clientApplicationIdentificationHeaderValue,
                                                  configLocation);

        this.appSensorClient = new AppSensorClient();
        this.appSensorClient.setEventManager(eventManager);
        this.appSensorClient.setResponseHandler(this.responseHandler);
        this.appSensorClient.setUserManager(this.userManager);
    }

    getAppSensorClient() {
        return this.appSensorClient;
    }

}

export {AppSensorRestClient}