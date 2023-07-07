import { ReferenceAccessController } from "../../access-controllers/appsensor-access-control-reference/ReferenceAccessController.js";
import { ReferenceAttackAnalysisEngine, ReferenceEventAnalysisEngine } from "../../analysis-engines/appsensor-analysis-reference/appsensor-analysis-reference.js";
import { AggregateAttackAnalysisEngine, AggregateEventAnalysisEngine } from "../../analysis-engines/appsensor-analysis-rules/appsensor-analysis-rules.js";
import { JSONServerConfiguration, JSONServerConfigurationReader } from "../../configuration-modes/appsensor-configuration-json/server/JSONServerConfig.js";
import { AppSensorClient, AppSensorServer } from "../../core/core.js";
import { NoopUserManager, ResponseHandler, UserManager } from "../../core/response/response.js";
import { AttackStore, EventStore, ResponseStore } from "../../core/storage/storage.js";
import { InMemoryAttackStore, InMemoryEventStore, InMemoryResponseStore } from "../../storage-providers/appsensor-storage-in-memory/appsensor-storage-in-memory.js";
import { JSONConfigManager } from "../../utils/Utils.js";
import { LocalResponseAnalysisEngine } from "./analysis/analysis.js";
import { LocalEventManager } from "./event/event.js";
import { LocalRequestHandler } from "./handler/handler.js";
import { LocalResponseHandler } from "./response/response.js";

class AppSensorLocal {

	private appSensorServer = new AppSensorServer();

	private appSensorClient = new AppSensorClient();

	private aggrEventEngine = new AggregateEventAnalysisEngine();
	private aggrAttackEngine = new AggregateAttackAnalysisEngine();

	private refEventEngine = new ReferenceEventAnalysisEngine();
	private refAttackEngine = new ReferenceAttackAnalysisEngine();

    private attackStore: AttackStore = new InMemoryAttackStore();
    private eventStore: EventStore = new InMemoryEventStore();
    private responseStore: ResponseStore = new InMemoryResponseStore();

    private userManager: UserManager = new NoopUserManager();
    private responseHandler: ResponseHandler = new LocalResponseHandler(this.userManager);

    private configManager: JSONConfigManager;

    constructor(configFile: string = 'appsensor-server-config.json',
                attackStore?: AttackStore,
                eventStore?: EventStore,
                responseStore?: ResponseStore,
                responseHandler?: ResponseHandler) {
        if (attackStore) {
            this.attackStore = attackStore;
        }

        if (eventStore) {
            this.eventStore = eventStore;
        }

        if (responseStore) {
            this.responseStore = responseStore;
        }

        if (responseHandler) {
            this.responseHandler = responseHandler;
        }

        this.configManager = new JSONConfigManager(new JSONServerConfigurationReader(),
                                                   configFile.trim(),
                                                   null,
                                                   true);
        this.configManager.listenForConfigurationChange((newConfig: any) => {
            this.appSensorServer.setConfiguration(this.configManager.getConfiguration());
        });                                           

        this.appSensorServer.setConfiguration(this.configManager.getConfiguration());

        this.appSensorServer.setAttackStore(this.attackStore);
        this.appSensorServer.setEventStore(this.eventStore);
        this.appSensorServer.setResponseStore(this.responseStore);

        const attackAnalysisEngines = [this.aggrAttackEngine, this.refAttackEngine];
        this.appSensorServer.setAttackAnalysisEngines(attackAnalysisEngines);
		for (let i = 0; i < attackAnalysisEngines.length; i++) {
			this.attackStore.registerListener(attackAnalysisEngines[i]);
		}

        const eventAnalysisEngines = [this.aggrEventEngine, this.refEventEngine];
        this.appSensorServer.setEventAnalysisEngines(eventAnalysisEngines);
		for (let i = 0; i < eventAnalysisEngines.length; i++) {
			this.eventStore.registerListener(eventAnalysisEngines[i]);
		}

		this.aggrAttackEngine.setAppSensorServer(this.appSensorServer);
        this.aggrEventEngine.setAppSensorServer(this.appSensorServer);

		this.refAttackEngine.setAppSensorServer(this.appSensorServer);
        this.refEventEngine.setAppSensorServer(this.appSensorServer);

        this.appSensorServer.setAccessController(new ReferenceAccessController());

        const localResponseHandler = new LocalResponseAnalysisEngine(this.responseHandler);

        const responseAnalysisEngines = [localResponseHandler];
        this.appSensorServer.setResponseAnalysisEngines(responseAnalysisEngines);
        for (let i = 0; i < responseAnalysisEngines.length; i++) {
            this.responseStore.registerListener(responseAnalysisEngines[i]);
        }

        const requestHandler = new LocalRequestHandler(this.appSensorServer);
        const eventManager = new LocalEventManager(requestHandler);

        this.appSensorClient = new AppSensorClient();
        this.appSensorClient.setEventManager(eventManager);
        this.appSensorClient.setResponseHandler(this.responseHandler);
        this.appSensorClient.setUserManager(this.userManager);
    }

    getAppSensorServer() {
        return this.appSensorServer;
    }

    getAppSensorClient() {
        return this.appSensorClient;
    }
}

export {AppSensorLocal};