import { AppSensorClient, AppSensorEvent, AppSensorServer, Category, DetectionPoint, 
	     DetectionSystem, Interval, INTERVAL_UNITS, IPAddress, KeyValuePair, Resource, Response, 
		 Threshold, User } from "../../../core/core.js";
import { SearchCriteria } from "../../../core/criteria/criteria.js";

import assert from "assert";
import { BaseTest } from "./BaseTest.js";
import { Logger } from "../../../logging/logging.js";

class ReferenceStatisticalEventAnalysisEngineTest extends BaseTest {

	private sleepAmount: number = 1;

    constructor(appSensorServer: AppSensorServer, appSensorClient: AppSensorClient) {
		super(appSensorServer, appSensorClient);
	}

	protected override initializeTest(): void {

		super.initializeTest();

		this.appSensorServer.getConfiguration()!.setDetectionPoints(this.loadMockedDetectionPoints());
	}

	private async testAttackCreation() {
		Logger.getTestsLogger().info('--> testAttackCreation');

		const criteria = new SearchCriteria().
				setUser(this.generateUserTest()).
				setDetectionPoint(this.generateDetectionPoint1()).
				setDetectionSystemIds([this.generateDetectionSystemLocalhostMe().getDetectionSystemId()]);

		await super.sleep(this.sleepAmount);

		let events = await this.appSensorServer.getEventStore()!.findEvents(criteria);
		let attacks = await this.appSensorServer.getAttackStore()!.findAttacks(criteria);
		assert.equal(0, events.length);
		assert.equal(0, attacks.length);

		await this.appSensorClient.getEventManager()!.addEvent(this.generateNewEvent());

		await super.sleep(this.sleepAmount);

		events = await this.appSensorServer.getEventStore()!.findEvents(criteria);
		attacks = await this.appSensorServer.getAttackStore()!.findAttacks(criteria);
		assert.equal(1, events.length);
		assert.equal(0, attacks.length);

        await this.appSensorClient.getEventManager()!.addEvent(this.generateNewEvent());

		await super.sleep(this.sleepAmount);

		events = await this.appSensorServer.getEventStore()!.findEvents(criteria);
		attacks = await this.appSensorServer.getAttackStore()!.findAttacks(criteria);
		assert.equal(2, events.length);
		assert.equal(0, attacks.length);

        await this.appSensorClient.getEventManager()!.addEvent(this.generateNewEvent());

		await super.sleep(this.sleepAmount);

		events = await this.appSensorServer.getEventStore()!.findEvents(criteria);
		attacks = await this.appSensorServer.getAttackStore()!.findAttacks(criteria);
		assert.equal(3, events.length);
		assert.equal(1, attacks.length);

        await this.appSensorClient.getEventManager()!.addEvent(this.generateNewEvent());

		await super.sleep(this.sleepAmount);

		events = await this.appSensorServer.getEventStore()!.findEvents(criteria);
		attacks = await this.appSensorServer.getAttackStore()!.findAttacks(criteria);
		assert.equal(4, events.length);
		assert.equal(1, attacks.length);

        await this.appSensorClient.getEventManager()!.addEvent(this.generateNewEvent());

		await super.sleep(this.sleepAmount);

		events = await this.appSensorServer.getEventStore()!.findEvents(criteria);
		attacks = await this.appSensorServer.getAttackStore()!.findAttacks(criteria);
		assert.equal(5, events.length);
		assert.equal(1, attacks.length);

        await this.appSensorClient.getEventManager()!.addEvent(this.generateNewEvent());

		await super.sleep(this.sleepAmount);

		events = await this.appSensorServer.getEventStore()!.findEvents(criteria);
		attacks = await this.appSensorServer.getAttackStore()!.findAttacks(criteria);
		assert.equal(6, events.length);
		assert.equal(2, attacks.length);

        await this.appSensorClient.getEventManager()!.addEvent(this.generateNewEvent());

		await super.sleep(this.sleepAmount);

		events = await this.appSensorServer.getEventStore()!.findEvents(criteria);
		attacks = await this.appSensorServer.getAttackStore()!.findAttacks(criteria);
		assert.equal(7, events.length);
		assert.equal(2, attacks.length);

		Logger.getTestsLogger().info('<-- testAttackCreation');
	}

	private loadMockedDetectionPoints(): DetectionPoint[] {
		const configuredDetectionPoints: DetectionPoint[] = [];

		const minutes5 = new Interval(5, INTERVAL_UNITS.MINUTES);
		const minutes6 = new Interval(6, INTERVAL_UNITS.MINUTES);
		const minutes7 = new Interval(7, INTERVAL_UNITS.MINUTES);
		const minutes8 = new Interval(8, INTERVAL_UNITS.MINUTES);
		const minutes11 = new Interval(11, INTERVAL_UNITS.MINUTES);
		const minutes12 = new Interval(12, INTERVAL_UNITS.MINUTES);
		const minutes13 = new Interval(13, INTERVAL_UNITS.MINUTES);
		const minutes14 = new Interval(14, INTERVAL_UNITS.MINUTES);
		const minutes15 = new Interval(15, INTERVAL_UNITS.MINUTES);
		const minutes31 = new Interval(31, INTERVAL_UNITS.MINUTES);
		const minutes32 = new Interval(32, INTERVAL_UNITS.MINUTES);
		const minutes33 = new Interval(33, INTERVAL_UNITS.MINUTES);
		const minutes34 = new Interval(34, INTERVAL_UNITS.MINUTES);
		const minutes35 = new Interval(35, INTERVAL_UNITS.MINUTES);

		const events3minutes5 = new Threshold(3, minutes5);
		const events12minutes5 = new Threshold(12, minutes5);
		const events13minutes6 = new Threshold(13, minutes6);
		const events14minutes7 = new Threshold(14, minutes7);
		const events15minutes8 = new Threshold(15, minutes8);

		const log = new Response();
		log.setAction("log");

		const logout = new Response();
		logout.setAction("logout");

		const disableUser = new Response();
		disableUser.setAction("disableUser");

		const disableComponentForSpecificUser31 = new Response();
		disableComponentForSpecificUser31.setAction("disableComponentForSpecificUser");
		disableComponentForSpecificUser31.setInterval(minutes31);

		const disableComponentForSpecificUser32 = new Response();
		disableComponentForSpecificUser32.setAction("disableComponentForSpecificUser");
		disableComponentForSpecificUser32.setInterval(minutes32);

		const disableComponentForSpecificUser33 = new Response();
		disableComponentForSpecificUser33.setAction("disableComponentForSpecificUser");
		disableComponentForSpecificUser33.setInterval(minutes33);

		const disableComponentForSpecificUser34 = new Response();
		disableComponentForSpecificUser34.setAction("disableComponentForSpecificUser");
		disableComponentForSpecificUser34.setInterval(minutes34);

		const disableComponentForSpecificUser35 = new Response();
		disableComponentForSpecificUser35.setAction("disableComponentForSpecificUser");
		disableComponentForSpecificUser35.setInterval(minutes35);

		const disableComponentForAllUsers11 = new Response();
		disableComponentForAllUsers11.setAction("disableComponentForAllUsers");
		disableComponentForAllUsers11.setInterval(minutes11);

		const disableComponentForAllUsers12 = new Response();
		disableComponentForAllUsers12.setAction("disableComponentForAllUsers");
		disableComponentForAllUsers12.setInterval(minutes12);

		const disableComponentForAllUsers13 = new Response();
		disableComponentForAllUsers13.setAction("disableComponentForAllUsers");
		disableComponentForAllUsers13.setInterval(minutes13);

		const disableComponentForAllUsers14 = new Response();
		disableComponentForAllUsers14.setAction("disableComponentForAllUsers");
		disableComponentForAllUsers14.setInterval(minutes14);

		const disableComponentForAllUsers15 = new Response();
		disableComponentForAllUsers15.setAction("disableComponentForAllUsers");
		disableComponentForAllUsers15.setInterval(minutes15);

		const point1Responses: Response[] = [];
		point1Responses.push(log);
		point1Responses.push(logout);
		point1Responses.push(disableUser);
		point1Responses.push(disableComponentForSpecificUser31);
		point1Responses.push(disableComponentForAllUsers11);

		const point1 = new DetectionPoint(Category.INPUT_VALIDATION, "IE1", events3minutes5, point1Responses);

		const point2Responses: Response[] = [];
		point2Responses.push(log);
		point2Responses.push(logout);
		point2Responses.push(disableUser);
		point2Responses.push(disableComponentForSpecificUser32);
		point2Responses.push(disableComponentForAllUsers12);

		const point2 = new DetectionPoint(Category.INPUT_VALIDATION, "IE2", events12minutes5, point2Responses);

		const point3Responses: Response[] = [];
		point3Responses.push(log);
		point3Responses.push(logout);
		point3Responses.push(disableUser);
		point3Responses.push(disableComponentForSpecificUser33);
		point3Responses.push(disableComponentForAllUsers13);

		const point3 = new DetectionPoint(Category.INPUT_VALIDATION, "IE3", events13minutes6, point3Responses);

		const point4Responses: Response[] = [];
		point4Responses.push(log);
		point4Responses.push(logout);
		point4Responses.push(disableUser);
		point4Responses.push(disableComponentForSpecificUser34);
		point4Responses.push(disableComponentForAllUsers14);

		const point4 = new DetectionPoint(Category.INPUT_VALIDATION, "IE4", events14minutes7, point4Responses);

		const point5Responses: Response[] = [];
		point5Responses.push(log);
		point5Responses.push(logout);
		point5Responses.push(disableUser);
		point5Responses.push(disableComponentForSpecificUser35);
		point5Responses.push(disableComponentForAllUsers15);

		const point5 = new DetectionPoint(Category.INPUT_VALIDATION, "IE5", events15minutes8, point5Responses);

		configuredDetectionPoints.push(point1);
		configuredDetectionPoints.push(point2);
		configuredDetectionPoints.push(point3);
		configuredDetectionPoints.push(point4);
		configuredDetectionPoints.push(point5);

		return configuredDetectionPoints;
	}

    private generateNewEvent(): AppSensorEvent {
        const event = new AppSensorEvent(this.generateUserTest(), 
										 this.generateDetectionPoint1(), 
									     this.generateDetectionSystemLocalhostMe());

        event.setResource(this.generateResource());

		event.setMetadata(this.generateMetaData());

        return event;
    }

    private generateResource(): Resource {
        const resource = new Resource();
        resource.setLocation("/someResourceLocation");
        resource.setMethod("GET");
        return resource;
    }

    private generateUserTest(): User {
        const test = new User("test");
        test.setIPAddress(new IPAddress("8.8.8.8"));

        return test;
    }

    private generateDetectionPoint1(): DetectionPoint {
        return new DetectionPoint(Category.INPUT_VALIDATION, "IE1");
    }

    private generateDetectionSystemLocalhostMe(): DetectionSystem {
        const detectionSystem = new DetectionSystem("localhostme");
        detectionSystem.setIPAddress(new IPAddress("9.9.9.9"));

        return detectionSystem;
    }

	private generateMetaData(): KeyValuePair[] {
		const metaDataCol: KeyValuePair[] =  [];
		metaDataCol.push(new KeyValuePair("meta", "data"));

		return metaDataCol;
	}

	public static async runTests(appSensorServer: AppSensorServer, appSensorClient: AppSensorClient) {
		Logger.getTestsLogger().info('----- Run ReferenceStatisticalEventAnalysisEngineTest -----');
		const test = new ReferenceStatisticalEventAnalysisEngineTest(appSensorServer, appSensorClient);
		test.initializeTest();
		await test.testAttackCreation();
	}

}

export {ReferenceStatisticalEventAnalysisEngineTest};