import { ReferenceAccessController } from "../../../access-controllers/appsensor-access-control-reference/ReferenceAccessController.js";
import { ReferenceAttackAnalysisEngine, ReferenceEventAnalysisEngine } from "../../../analysis-engines/appsensor-analysis-reference/appsensor-analysis-reference.js";
import { AggregateAttackAnalysisEngine, AggregateEventAnalysisEngine } from "../../../analysis-engines/appsensor-analysis-rules/appsensor-analysis-rules.js";
import { JSONServerConfigurationReader } from "../../../configuration-modes/appsensor-configuration-json/server/JSONServerConfig.js";
import { AppSensorServer, RequestHandler } from "../../../core/core.js";
import { AttackStore, EventStore, ResponseStore } from "../../../core/storage/storage.js";
import { InMemoryAttackStore, InMemoryEventStore, InMemoryResponseStore } from "../../../storage-providers/appsensor-storage-in-memory/appsensor-storage-in-memory.js";
import { JSONConfigManager } from "../../../utils/Utils.js";
import { RestRequestHandler } from "./handler/handler.js";

class AppSensorRestServer {
	private appSensorServer = new AppSensorServer();

	private aggrEventEngine = new AggregateEventAnalysisEngine();
	private aggrAttackEngine = new AggregateAttackAnalysisEngine();

	private refEventEngine = new ReferenceEventAnalysisEngine();
	private refAttackEngine = new ReferenceAttackAnalysisEngine();

    private attackStore: AttackStore = new InMemoryAttackStore();
    private eventStore: EventStore = new InMemoryEventStore();
    private responseStore: ResponseStore = new InMemoryResponseStore();

    private requestHandler: RequestHandler;

    private configManager: JSONConfigManager;

    constructor(appServerConfigFile: string = '',
                restServerConfigFile: string = '',
                attackStore?: AttackStore,
                eventStore?: EventStore,
                responseStore?: ResponseStore) {
        if (attackStore) {
            this.attackStore = attackStore;
        }

        if (eventStore) {
            this.eventStore = eventStore;
        }

        if (responseStore) {
            this.responseStore = responseStore;
        }


        this.configManager = new JSONConfigManager(new JSONServerConfigurationReader(),
                                                   appServerConfigFile.trim(),
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

        this.requestHandler = new RestRequestHandler(this.appSensorServer, restServerConfigFile);
    }

    getAppSensorServer() {
        return this.appSensorServer;
    }

    async initStartServer() {
        await (this.requestHandler as RestRequestHandler).initStartServer();
    }

    async stopServer() {
        await (this.requestHandler as RestRequestHandler).stopServer();
    }
}

export {AppSensorRestServer}