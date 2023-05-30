import { AppSensorClient } from "../../../core/core";
import { UserManager, NoopUserManager, ResponseHandler } from "../../../core/response/response";
import { LocalResponseHandler } from "../../appsensor-local/response/response";
import { RestEventManager } from "./event/event";

class AppSensorRestClient {
	private appSensorClient = new AppSensorClient();

    private userManager: UserManager = new NoopUserManager();
    private responseHandler: ResponseHandler = new LocalResponseHandler(this.userManager);

    constructor(url: string = '', 
                configLocation: string = '',
                responseHandler?: ResponseHandler) {

        if (responseHandler) {
            this.responseHandler = responseHandler;
        }

        const eventManager = new RestEventManager(url, configLocation);

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