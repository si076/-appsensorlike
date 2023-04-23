import { AppSensorEvent, Category, DetectionPoint, DetectionSystem, User } from "../../../../core/core.js";
import { SearchCriteria } from "../../../../core/criteria/criteria.js";
import { BaseTest } from "./BaseTest.js";

import assert from "assert";

class MultipleDetectionPointsSameLabelEventAnalysisEngineTest extends BaseTest {

	private static bob = new User("bob");

	private static detectionPoint1 = new DetectionPoint(Category.REQUEST, "RE7");

	private static detectionSystems1: string[] = [];

	private static detectionSystem1 = new DetectionSystem("localhostme");

	static {

		MultipleDetectionPointsSameLabelEventAnalysisEngineTest.detectionSystems1.push(
			MultipleDetectionPointsSameLabelEventAnalysisEngineTest.detectionSystem1.getDetectionSystemId());
	}

	private async testAttackCreationMultipleDetectionPointsOneLabel() {
		console.log('--> testAttackCreationMultipleDetectionPointsOneLabel');
		const criteria = new SearchCriteria().
				setUser(MultipleDetectionPointsSameLabelEventAnalysisEngineTest.bob).
				setDetectionPoint(MultipleDetectionPointsSameLabelEventAnalysisEngineTest.detectionPoint1).
				setDetectionSystemIds(MultipleDetectionPointsSameLabelEventAnalysisEngineTest.detectionSystems1);

		assert.equal(2, this.appSensorServer!.getConfiguration()!.findDetectionPoints(MultipleDetectionPointsSameLabelEventAnalysisEngineTest.detectionPoint1).length);

		let events = await this.appSensorServer!.getEventStore()!.findEvents(criteria);
		let attacks = await this.appSensorServer!.getAttackStore()!.findAttacks(criteria);
		assert.equal(0, events.length);
		assert.equal(0, attacks.length);

		await this.appSensorClient!.getEventManager()!.addEvent(new AppSensorEvent(MultipleDetectionPointsSameLabelEventAnalysisEngineTest.bob, MultipleDetectionPointsSameLabelEventAnalysisEngineTest.detectionPoint1, new DetectionSystem("localhostme")));
		await this.sleep(500);

		events = await this.appSensorServer!.getEventStore()!.findEvents(criteria);
		attacks = await this.appSensorServer!.getAttackStore()!.findAttacks(criteria);
		assert.equal(1, events.length);
		assert.equal(0, attacks.length);

		await this.appSensorClient!.getEventManager()!.addEvent(new AppSensorEvent(MultipleDetectionPointsSameLabelEventAnalysisEngineTest.bob, MultipleDetectionPointsSameLabelEventAnalysisEngineTest.detectionPoint1, new DetectionSystem("localhostme")));
		await this.sleep(500);

		events = await this.appSensorServer!.getEventStore()!.findEvents(criteria);
		attacks = await this.appSensorServer!.getAttackStore()!.findAttacks(criteria);
		assert.equal(2, events.length);
		assert.equal(1, attacks.length);

		await this.appSensorClient!.getEventManager()!.addEvent(new AppSensorEvent(MultipleDetectionPointsSameLabelEventAnalysisEngineTest.bob, MultipleDetectionPointsSameLabelEventAnalysisEngineTest.detectionPoint1, new DetectionSystem("localhostme")));
		await this.sleep(500);

		events = await this.appSensorServer!.getEventStore()!.findEvents(criteria);
		attacks = await this.appSensorServer!.getAttackStore()!.findAttacks(criteria);
		assert.equal(3, events.length);
		assert.equal(1, attacks.length);

		await this.appSensorClient!.getEventManager()!.addEvent(new AppSensorEvent(MultipleDetectionPointsSameLabelEventAnalysisEngineTest.bob, MultipleDetectionPointsSameLabelEventAnalysisEngineTest.detectionPoint1, new DetectionSystem("localhostme")));
		await this.sleep(500);

		events = await this.appSensorServer!.getEventStore()!.findEvents(criteria);
		attacks = await this.appSensorServer!.getAttackStore()!.findAttacks(criteria);
		assert.equal(4, events.length);
		assert.equal(2, attacks.length);

		await this.appSensorClient!.getEventManager()!.addEvent(new AppSensorEvent(MultipleDetectionPointsSameLabelEventAnalysisEngineTest.bob, MultipleDetectionPointsSameLabelEventAnalysisEngineTest.detectionPoint1, new DetectionSystem("localhostme")));
		await this.sleep(500);

		events = await this.appSensorServer!.getEventStore()!.findEvents(criteria);
		attacks = await this.appSensorServer!.getAttackStore()!.findAttacks(criteria);
		assert.equal(5, events.length);
		assert.equal(3, attacks.length);

		await this.appSensorClient!.getEventManager()!.addEvent(new AppSensorEvent(MultipleDetectionPointsSameLabelEventAnalysisEngineTest.bob, MultipleDetectionPointsSameLabelEventAnalysisEngineTest.detectionPoint1, new DetectionSystem("localhostme")));
		await this.sleep(500);

		events = await this.appSensorServer!.getEventStore()!.findEvents(criteria);
		attacks = await this.appSensorServer!.getAttackStore()!.findAttacks(criteria);
		assert.equal(6, events.length);
		assert.equal(4, attacks.length);

		await this.appSensorClient!.getEventManager()!.addEvent(new AppSensorEvent(MultipleDetectionPointsSameLabelEventAnalysisEngineTest.bob, MultipleDetectionPointsSameLabelEventAnalysisEngineTest.detectionPoint1, new DetectionSystem("localhostme")));
		await this.sleep(500);

		events = await this.appSensorServer!.getEventStore()!.findEvents(criteria);
		attacks = await this.appSensorServer!.getAttackStore()!.findAttacks(criteria);
		assert.equal(7, events.length);
		assert.equal(4, attacks.length);

		await this.appSensorClient!.getEventManager()!.addEvent(new AppSensorEvent(MultipleDetectionPointsSameLabelEventAnalysisEngineTest.bob, MultipleDetectionPointsSameLabelEventAnalysisEngineTest.detectionPoint1, new DetectionSystem("localhostme")));
		await this.sleep(500);

		events = await this.appSensorServer!.getEventStore()!.findEvents(criteria);
		attacks = await this.appSensorServer!.getAttackStore()!.findAttacks(criteria);
		assert.equal(8, events.length);
		assert.equal(5, attacks.length);

		await this.appSensorClient!.getEventManager()!.addEvent(new AppSensorEvent(MultipleDetectionPointsSameLabelEventAnalysisEngineTest.bob, MultipleDetectionPointsSameLabelEventAnalysisEngineTest.detectionPoint1, new DetectionSystem("localhostme")));
		await this.sleep(500);

		events = await this.appSensorServer!.getEventStore()!.findEvents(criteria);
		attacks = await this.appSensorServer!.getAttackStore()!.findAttacks(criteria);
		assert.equal(9, events.length);
		assert.equal(5, attacks.length);

		await this.appSensorClient!.getEventManager()!.addEvent(new AppSensorEvent(MultipleDetectionPointsSameLabelEventAnalysisEngineTest.bob, MultipleDetectionPointsSameLabelEventAnalysisEngineTest.detectionPoint1, new DetectionSystem("localhostme")));
		await this.sleep(500);

		events = await this.appSensorServer!.getEventStore()!.findEvents(criteria);
		attacks = await this.appSensorServer!.getAttackStore()!.findAttacks(criteria);
		assert.equal(10, events.length);
		assert.equal(7, attacks.length);

		console.log('<-- testAttackCreationMultipleDetectionPointsOneLabel');
	}

	public static async runTests() {
		console.log('----- Run MultipleDetectionPointsSameLabelEventAnalysisEngineTest -----');
		const inst = new MultipleDetectionPointsSameLabelEventAnalysisEngineTest();

		inst.initializeTest();
		await inst.testAttackCreationMultipleDetectionPointsOneLabel();
	}

}

export {MultipleDetectionPointsSameLabelEventAnalysisEngineTest};