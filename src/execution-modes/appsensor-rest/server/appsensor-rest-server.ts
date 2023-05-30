import { ReferenceAccessController } from "../../../access-controllers/appsensor-access-control-reference/ReferenceAccessController";
import { ReferenceAttackAnalysisEngine, ReferenceEventAnalysisEngine } from "../../../analysis-engines/appsensor-analysis-reference/appsensor-analysis-reference";
import { AggregateAttackAnalysisEngine, AggregateEventAnalysisEngine } from "../../../analysis-engines/appsensor-analysis-rules/appsensor-analysis-rules";
import { JSONServerConfigurationReader } from "../../../configuration-modes/appsensor-configuration-json/server/JSONServerConfig";
import { AppSensorServer, RequestHandler } from "../../../core/core";
import { AttackStore, EventStore, ResponseStore } from "../../../core/storage/storage";
import { InMemoryAttackStore, InMemoryEventStore, InMemoryResponseStore } from "../../../storage-providers/appsensor-storage-in-memory/appsensor-storage-in-memory";
import { JSONConfigManager } from "../../../utils/Utils";
import { RestRequestHandler } from "./handler/handler";

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
                                                   JSONServerConfigurationReader.DEFAULT_CONFIG_FILE, 
                                                   JSONServerConfigurationReader.DEFAULT_CONFIG_SCHEMA_FILE,
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

}