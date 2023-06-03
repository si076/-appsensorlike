import { AppSensorReportingWebSocketClient } from "../../reporting-engines/appsensor-reporting-websocket/client/appsensor-reporting-websocket-client.js";
import { RestServer, RestServerConfig } from "../../rest/server/rest-server.js";
import { JSONConfigReadValidate } from "../../utils/Utils.js";
import { UserController } from "./controller/UserController.js";

import morgan from 'morgan';
import { Logger } from "../../logging/logging.js";

class AppsensorUIRestServerConfigReader extends JSONConfigReadValidate {
    constructor() {
        super('./appsensor-ui/web/appsensor-ui-rest-server-config.json',
              './rest/server/appsensor-rest-server-config_schema.json',
              RestServerConfig.prototype);
    }
}


class AppsensorUIRestServer extends RestServer {
    
    private userController: UserController;

    private wsClient: AppSensorReportingWebSocketClient;

    constructor(restServerConfig: string = 'appsensor-ui-rest-server-config.json') {
        super(new AppsensorUIRestServerConfigReader().read(restServerConfig));

        this.wsClient = new AppSensorReportingWebSocketClient();

        this.userController = new UserController(this.wsClient);
    }


    protected override setRequestLogging() {
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
    }

    protected setEndpoints(): void {
        console.log(this);
        //user endpoints
        this.expressApp.get('/api/users/:username/all', this.userController.allContent.bind(this));
        // this.expressApp.get('/api/users/:username/active-responses', );
        // this.expressApp.get('/api/users/:username/by-time-frame',);
        // this.expressApp.get('/api/users/:username/latest-events', );
        // this.expressApp.get('/api/users/:username/latest-attacks');
        // this.expressApp.get('/api/users/:username/latest-responses');
        // this.expressApp.get('/api/users/:username/by-client-application');
        // this.expressApp.get('/api/users/:username/grouped');
        // this.expressApp.get('/api/users/top');
    }
}

(() => {
    const inst = new AppsensorUIRestServer();
    inst.init();
    inst.startServer();
})()