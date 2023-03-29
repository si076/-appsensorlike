import { AppSensorClient, AppSensorServer } from "../../../../core/core.js";
import { InMemoryAttackStore, InMemoryEventStore, InMemoryResponseStore } from "../../../../storage-providers/appsensor-storage-in-memory/appsensor-storage-in-memory.js";
import { LocalRequestHandler } from "../../handler/handler.js";
import { LocalEventManager } from "../../event/event.js";
import { NoopUserManager, UserManager } from "../../../../core/response/response.js";
import { LocalResponseHandler } from "../../response/response.js";
import { AttackAnalysisEngine, EventAnalysisEngine } from "../../../../core/analysis/analysis.js";
import { JSONServerConfigurationReader } from "../../../../configuration-modes/appsensor-configuration-json/server/JSONServerConfig.js";
import { AggregateAttackAnalysisEngine, AggregateEventAnalysisEngine } from "../../../../analysis-engines/appsensor-analysis-rules/appsensor-analysis-rules.js";
import { ReferenceAttackAnalysisEngine, ReferenceEventAnalysisEngine } from "../../../../analysis-engines/appsensor-analysis-reference/appsensor-analysis-reference.js";
import { Rule } from "../../../../core/rule/rule.js";

abstract class BaseTest {

	protected appSensorServer: AppSensorServer  = new AppSensorServer();

	protected appSensorClient: AppSensorClient = new AppSensorClient();

	private aggrEventEngine = new AggregateEventAnalysisEngine();
	private aggrAttackEngine = new AggregateAttackAnalysisEngine();

	private refEventEngine = new ReferenceEventAnalysisEngine();
	private refAttackEngine = new ReferenceAttackAnalysisEngine();

	protected initializeTest(): void {

		this.appSensorServer.setConfiguration(
			new JSONServerConfigurationReader()
					.read('./execution-modes/appsensor-local/tests/analysis/appsensor-server-config.json'));
					
		const emptyRules: Rule[] = [];
		this.appSensorServer.getConfiguration()!.setRules(emptyRules);
			
		const eventStore = new InMemoryEventStore();
        this.appSensorServer.setEventStore(eventStore);

		const attackStore = new InMemoryAttackStore();
        this.appSensorServer.setAttackStore(attackStore);

		const responseStore = new InMemoryResponseStore();
        this.appSensorServer.setResponseStore(responseStore);

		this.clearStores();

		this.appSensorServer.getAttackStore()!.setListeners([]);
		this.appSensorServer.getEventStore()!.setListeners([]);
		this.appSensorServer.getResponseStore()!.setListeners([]);

		// const rulesEngine = this.getRulesEngine();
        const attackAnalysisEngines = this.getAttackAnalysisEngines();
        this.appSensorServer.setAttackAnalysisEngines(attackAnalysisEngines);
		for (let i = 0; i < attackAnalysisEngines.length; i++) {
			attackStore.registerListener(attackAnalysisEngines[i]);
		}

        const eventAnalysisEngines = this.getEventAnalysisEngines();
        this.appSensorServer.setEventAnalysisEngines(eventAnalysisEngines);
		for (let i = 0; i < eventAnalysisEngines.length; i++) {
			eventStore.registerListener(eventAnalysisEngines[i]);
		}

		this.aggrAttackEngine.setAppSensorServer(this.appSensorServer);
        this.aggrEventEngine.setAppSensorServer(this.appSensorServer);

		this.refAttackEngine.setAppSensorServer(this.appSensorServer);
        this.refEventEngine.setAppSensorServer(this.appSensorServer);

        const requestHandler: LocalRequestHandler = new LocalRequestHandler(this.appSensorServer);
        const eventManager: LocalEventManager = new LocalEventManager(requestHandler);
        const userManager: UserManager = new NoopUserManager();
        const responseHandler: LocalResponseHandler = new LocalResponseHandler(userManager);

        this.appSensorClient = new AppSensorClient();
        this.appSensorClient.setEventManager(eventManager);
        this.appSensorClient.setResponseHandler(responseHandler);
        this.appSensorClient.setUserManager(userManager);
	}

	protected clearStores(): void {
		(this.appSensorServer.getAttackStore() as InMemoryAttackStore).clearAll();
		(this.appSensorServer.getEventStore() as InMemoryEventStore).clearAll();
		(this.appSensorServer.getResponseStore() as InMemoryResponseStore).clearAll();
	}


    protected getAttackAnalysisEngines(): AttackAnalysisEngine[] {
		return [this.aggrAttackEngine, this.refAttackEngine];
	}

    protected getEventAnalysisEngines(): EventAnalysisEngine[] {
		return [this.aggrEventEngine, this.refEventEngine];
	}

	protected sleep(millis: number): Promise<null> {
		return new Promise((resolve, reject) => {
			setTimeout(() => {
				resolve(null);
			}, millis);
		});

	}


}

export {BaseTest};