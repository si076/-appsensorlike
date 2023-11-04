import { AppSensorClient, AppSensorServer } from "../../../core/core.js";
import { InMemoryAttackStore, InMemoryEventStore, InMemoryResponseStore } from "../../../storage-providers/appsensor-storage-in-memory/appsensor-storage-in-memory.js";
import { Rule } from "../../../core/rule/rule.js";

import assert from "assert";

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

	protected async pullEventsAssert(earliest: Date, eventCount: number) {
		const responses = await this.appSensorClient.getEventManager()!.getEvents(earliest);

		assert.equal(responses.length, eventCount);
	}

	protected async pullAttacksAssert(earliest: Date, attackCount: number) {
		const responses = await this.appSensorClient.getEventManager()!.getAttacks(earliest);

		assert.equal(responses.length, attackCount);
	}

	protected async pullResponsesAssertAnalyse(earliest: Date, responseCount: number, responseActions: string[]) {
		const responses = await this.appSensorClient.getEventManager()!.getResponses(earliest);

		assert.equal(responses.length, responseCount);

		for (let i = 0; i < responses.length; i++) {
			assert.equal(responses[i].getAction(), responseActions[i]);
			this.appSensorClient.getResponseHandler()!.handle(responses[i]);
		}
	}

}

export {BaseTest};