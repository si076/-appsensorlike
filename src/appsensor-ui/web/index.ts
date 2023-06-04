import { AppSensorReportingWebSocketClient } from "../../reporting-engines/appsensor-reporting-websocket/client/appsensor-reporting-websocket-client.js";
import { RestServer, RestServerConfig } from "../../rest/server/rest-server.js";
import { JSONConfigReadValidate } from "../../utils/Utils.js";
import { UserController } from "./controller/UserController.js";
import { DashboardController } from "./controller/DashboardController.js";
import { Logger } from "../../logging/logging.js";

import morgan from 'morgan';

class AppsensorUIRestServerConfigReader extends JSONConfigReadValidate {
    constructor() {
        super('./appsensor-ui/web/appsensor-ui-rest-server-config.json',
              './rest/server/appsensor-rest-server-config_schema.json',
              RestServerConfig.prototype);
    }
}


class AppsensorUIRestServer extends RestServer {
    
    private userController: UserController;
    private dashboardController: DashboardController;

    private wsClient: AppSensorReportingWebSocketClient;

    constructor(restServerConfig: string = 'appsensor-ui-rest-server-config.json') {
        super(new AppsensorUIRestServerConfigReader().read(restServerConfig));

        this.wsClient = new AppSensorReportingWebSocketClient();

        this.userController = new UserController(this.wsClient);
        this.dashboardController = new DashboardController(this.wsClient)
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
                    
        super.setRequestLogging();
    }

    protected setEndpoints(): void {
        //dashboard endpoints
        this.expressApp.get('/api/dashboard/all', this.dashboardController.allContent.bind(this.dashboardController));
        this.expressApp.get('/api/responses/active', this.dashboardController.activeResponses.bind(this.dashboardController));
        this.expressApp.get('/api/dashboard/by-time-frame', this.dashboardController.byTimeFrame.bind(this.dashboardController));
        this.expressApp.get('/api/dashboard/by-category', this.dashboardController.byCategory.bind(this.dashboardController));
        this.expressApp.get('/api/events/grouped', this.dashboardController.groupedEvents.bind(this.dashboardController));

        // this.expressApp.get();
        // this.expressApp.get();

        //user endpoints
        this.expressApp.get('/api/users/:username/all', this.userController.allContent.bind(this.userController));
        this.expressApp.get('/api/users/:username/active-responses',  this.userController.activeResponses.bind(this.userController));
        this.expressApp.get('/api/users/:username/by-time-frame', this.userController.byTimeFrame.bind(this.userController));
        this.expressApp.get('/api/users/:username/latest-events',  this.userController.recentEvents.bind(this.userController));
        this.expressApp.get('/api/users/:username/latest-attacks',  this.userController.recentAttacks.bind(this.userController));
        this.expressApp.get('/api/users/:username/latest-responses', this.userController.recentResponses.bind(this.userController));
        this.expressApp.get('/api/users/:username/by-client-application',  this.userController.byClientApplication.bind(this.userController));
        this.expressApp.get('/api/users/:username/grouped',  this.userController.groupedUsers.bind(this.userController));
        this.expressApp.get('/api/users/top',  this.userController.topUsers.bind(this.userController));
    }
}

(() => {
    const inst = new AppsensorUIRestServer();
    inst.init();
    inst.startServer();
})()