import { AppSensorClient, AppSensorServer } from "../../../core/core.js";
import { InMemoryAttackStore, InMemoryEventStore, InMemoryResponseStore } from "../../../storage-providers/appsensor-storage-in-memory/appsensor-storage-in-memory.js";
import { Rule } from "../../../core/rule/rule.js";

abstract class BaseTest {

	protected appSensorServer: AppSensorServer;

	protected appSensorClient: AppSensorClient;

	constructor(appSensorServer: AppSensorServer, appSensorClient: AppSensorClient) {

		this.appSensorServer = appSensorServer;

		this.appSensorClient = appSensorClient;
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