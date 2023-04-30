import { AppSensorClient, AppSensorServer } from "../../../../core/core.js";
import { InMemoryAttackStore, InMemoryEventStore, InMemoryResponseStore } from "../../../../storage-providers/appsensor-storage-in-memory/appsensor-storage-in-memory.js";
import { Rule } from "../../../../core/rule/rule.js";
import { AppSensorLocal } from "../../appsensor_local.js";

abstract class BaseTest {

	protected appSensorServer: AppSensorServer;

	protected appSensorClient: AppSensorClient;

	private appSensorLocal: AppSensorLocal;

	constructor() {
		this.appSensorLocal = new AppSensorLocal('./execution-modes/appsensor-local/tests/analysis/appsensor-server-config.json');

		this.appSensorServer = this.appSensorLocal.getAppSensorServer();

		this.appSensorClient = this.appSensorLocal.getAppSensorClient();
	}

	protected initializeTest(): void {

		const emptyRules: Rule[] = [];
		this.appSensorServer.getConfiguration()!.setRules(emptyRules);

		this.clearStores();
	}

	protected clearStores(): void {
		(this.appSensorServer.getAttackStore() as InMemoryAttackStore).clearAll();
		(this.appSensorServer.getEventStore() as InMemoryEventStore).clearAll();
		(this.appSensorServer.getResponseStore() as InMemoryResponseStore).clearAll();
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