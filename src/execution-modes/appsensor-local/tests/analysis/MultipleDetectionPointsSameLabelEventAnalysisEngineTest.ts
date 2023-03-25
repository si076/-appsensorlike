import { AppSensorEvent, Category, DetectionPoint, DetectionSystem, User } from "../../../../core/core.js";
import { SearchCriteria } from "../../../../core/criteria/criteria.js";
import { ReferenceAttackAnalysisEngine, ReferenceEventAnalysisEngine } from "../../../../analysis-engines/appsensor-analysis-reference/appsensor-analysis-reference.js";
import { BaseTest } from "./BaseTest.js";
import { AttackAnalysisEngine, EventAnalysisEngine } from "../../../../core/analysis/analysis.js";

import assert from "assert";

class MultipleDetectionPointsSameLabelEventAnalysisEngineTest extends BaseTest {

	private static bob = new User("bob");

	private static detectionPoint1 = new DetectionPoint();

	private static detectionSystems1: string[] = [];

	private static detectionSystem1 = new DetectionSystem("localhostme");

	static {
		MultipleDetectionPointsSameLabelEventAnalysisEngineTest.detectionPoint1.setCategory(Category.REQUEST);
		MultipleDetectionPointsSameLabelEventAnalysisEngineTest.detectionPoint1.setLabel("RE7");

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

		assert.equal(0, this.appSensorServer!.getEventStore()!.findEvents(criteria).length);
		assert.equal(0, this.appSensorServer!.getAttackStore()!.findAttacks(criteria).length);

		this.appSensorClient!.getEventManager()!.addEvent(new AppSensorEvent(MultipleDetectionPointsSameLabelEventAnalysisEngineTest.bob, MultipleDetectionPointsSameLabelEventAnalysisEngineTest.detectionPoint1, new DetectionSystem("localhostme")));
		await this.sleep(500);

		assert.equal(1, this.appSensorServer!.getEventStore()!.findEvents(criteria).length);
		assert.equal(0, this.appSensorServer!.getAttackStore()!.findAttacks(criteria).length);

		this.appSensorClient!.getEventManager()!.addEvent(new AppSensorEvent(MultipleDetectionPointsSameLabelEventAnalysisEngineTest.bob, MultipleDetectionPointsSameLabelEventAnalysisEngineTest.detectionPoint1, new DetectionSystem("localhostme")));
		await this.sleep(500);

		assert.equal(2, this.appSensorServer!.getEventStore()!.findEvents(criteria).length);
		assert.equal(1, this.appSensorServer!.getAttackStore()!.findAttacks(criteria).length);

		this.appSensorClient!.getEventManager()!.addEvent(new AppSensorEvent(MultipleDetectionPointsSameLabelEventAnalysisEngineTest.bob, MultipleDetectionPointsSameLabelEventAnalysisEngineTest.detectionPoint1, new DetectionSystem("localhostme")));
		await this.sleep(500);

		assert.equal(3, this.appSensorServer!.getEventStore()!.findEvents(criteria).length);
		assert.equal(1, this.appSensorServer!.getAttackStore()!.findAttacks(criteria).length);

		this.appSensorClient!.getEventManager()!.addEvent(new AppSensorEvent(MultipleDetectionPointsSameLabelEventAnalysisEngineTest.bob, MultipleDetectionPointsSameLabelEventAnalysisEngineTest.detectionPoint1, new DetectionSystem("localhostme")));
		await this.sleep(500);

		assert.equal(4, this.appSensorServer!.getEventStore()!.findEvents(criteria).length);
		assert.equal(2, this.appSensorServer!.getAttackStore()!.findAttacks(criteria).length);

		this.appSensorClient!.getEventManager()!.addEvent(new AppSensorEvent(MultipleDetectionPointsSameLabelEventAnalysisEngineTest.bob, MultipleDetectionPointsSameLabelEventAnalysisEngineTest.detectionPoint1, new DetectionSystem("localhostme")));
		await this.sleep(500);

		assert.equal(5, this.appSensorServer!.getEventStore()!.findEvents(criteria).length);
		assert.equal(3, this.appSensorServer!.getAttackStore()!.findAttacks(criteria).length);

		this.appSensorClient!.getEventManager()!.addEvent(new AppSensorEvent(MultipleDetectionPointsSameLabelEventAnalysisEngineTest.bob, MultipleDetectionPointsSameLabelEventAnalysisEngineTest.detectionPoint1, new DetectionSystem("localhostme")));
		await this.sleep(500);

		assert.equal(6, this.appSensorServer!.getEventStore()!.findEvents(criteria).length);
		assert.equal(4, this.appSensorServer!.getAttackStore()!.findAttacks(criteria).length);

		this.appSensorClient!.getEventManager()!.addEvent(new AppSensorEvent(MultipleDetectionPointsSameLabelEventAnalysisEngineTest.bob, MultipleDetectionPointsSameLabelEventAnalysisEngineTest.detectionPoint1, new DetectionSystem("localhostme")));
		await this.sleep(500);

		assert.equal(7, this.appSensorServer!.getEventStore()!.findEvents(criteria).length);
		assert.equal(4, this.appSensorServer!.getAttackStore()!.findAttacks(criteria).length);

		this.appSensorClient!.getEventManager()!.addEvent(new AppSensorEvent(MultipleDetectionPointsSameLabelEventAnalysisEngineTest.bob, MultipleDetectionPointsSameLabelEventAnalysisEngineTest.detectionPoint1, new DetectionSystem("localhostme")));
		await this.sleep(500);

		assert.equal(8, this.appSensorServer!.getEventStore()!.findEvents(criteria).length);
		assert.equal(5, this.appSensorServer!.getAttackStore()!.findAttacks(criteria).length);

		this.appSensorClient!.getEventManager()!.addEvent(new AppSensorEvent(MultipleDetectionPointsSameLabelEventAnalysisEngineTest.bob, MultipleDetectionPointsSameLabelEventAnalysisEngineTest.detectionPoint1, new DetectionSystem("localhostme")));
		await this.sleep(500);

		assert.equal(9, this.appSensorServer!.getEventStore()!.findEvents(criteria).length);
		assert.equal(5, this.appSensorServer!.getAttackStore()!.findAttacks(criteria).length);

		this.appSensorClient!.getEventManager()!.addEvent(new AppSensorEvent(MultipleDetectionPointsSameLabelEventAnalysisEngineTest.bob, MultipleDetectionPointsSameLabelEventAnalysisEngineTest.detectionPoint1, new DetectionSystem("localhostme")));
		await this.sleep(500);

		assert.equal(10, this.appSensorServer!.getEventStore()!.findEvents(criteria).length);
		assert.equal(7, this.appSensorServer!.getAttackStore()!.findAttacks(criteria).length);

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