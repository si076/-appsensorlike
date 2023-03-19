import { ServerConfiguration } from "../../../../core/configuration/server/server_configuration.js";
import { AppSensorClient, AppSensorEvent, AppSensorServer, Category, DetectionPoint, 
	     DetectionSystem, Interval, IPAddress, KeyValuePair, Resource, Response, 
		 Threshold, User } from "../../../../core/core.js";
import { SearchCriteria } from "../../../../core/criteria/criteria.js";
import { ServerConfigurationReaderImpl } from "../config/config.js";
import { InMemoryAttackStore, InMemoryEventStore, InMemoryResponseStore } from "../../../../storage-providers/appsensor-storage-in-memory/appsensor-storage-in-memory.js";
import { LocalRequestHandler } from "../../handler/handler.js";
import { LocalEventManager } from "../../event/event.js";
import { NoopUserManager, UserManager } from "../../../../core/response/response.js";
import { LocalResponseHandler } from "../../response/response.js";
import { ReferenceEventAnalysisEngine } from "../../../../analysis-engines/appsensor-analysis-reference/appsensor-analysis-reference.js";

import assert from "assert";

class ReferenceStatisticalEventAnalysisEngineTest {

	private sleepAmount: number = 1;

	private appSensorServer: AppSensorServer;

	private appSensorClient: AppSensorClient;

    private ipAddressLocator: IPAddress = new IPAddress();

	constructor() {
        this.appSensorServer = new AppSensorServer();

		this.appSensorServer.setConfiguration(new ServerConfigurationReaderImpl().read());

		const eventStore = new InMemoryEventStore();
        this.appSensorServer.setEventStore(eventStore);

		const attackStore = new InMemoryAttackStore();
        this.appSensorServer.setAttackStore(attackStore);

		const responseStore = new InMemoryResponseStore();
        this.appSensorServer.setResponseStore(responseStore);

        const eventEngine = new ReferenceEventAnalysisEngine();
        eventEngine.setAppSensorServer(this.appSensorServer);

        this.appSensorServer.setEventAnalysisEngines([eventEngine]);

		eventStore.registerListener(eventEngine);


		const updatedConfiguration: ServerConfiguration | null = this.appSensorServer.getConfiguration();
		if (updatedConfiguration) {
			updatedConfiguration.setDetectionPoints(this.loadMockedDetectionPoints());
		}
		this.appSensorServer.setConfiguration(updatedConfiguration);

        const requestHandler: LocalRequestHandler = new LocalRequestHandler(this.appSensorServer);
        const eventManager: LocalEventManager = new LocalEventManager(requestHandler);
        const userManager: UserManager = new NoopUserManager();
        const responseHandler: LocalResponseHandler = new LocalResponseHandler(userManager);

        this.appSensorClient = new AppSensorClient();
        this.appSensorClient.setEventManager(eventManager);
        this.appSensorClient.setResponseHandler(responseHandler);
        this.appSensorClient.setUserManager(userManager);
	}

    // @Ignore
	// @Test
	private async testAttackCreation() {

		const criteria = new SearchCriteria().
				setUser(this.generateUserBob()).
				setDetectionPoint(this.generateDetectionPoint1()).
				setDetectionSystemIds([this.generateDetectionSystemLocalhostMe().getDetectionSystemId()]);

		await this.sleep(this.sleepAmount);

		assert.equal(0, this.appSensorServer.getEventStore()!.findEvents(criteria).length);
		assert.equal(0, this.appSensorServer.getAttackStore()!.findAttacks(criteria).length);

		this.appSensorClient.getEventManager()!.addEvent(this.generateNewEvent());

		await this.sleep(this.sleepAmount);

		assert.equal(1, this.appSensorServer.getEventStore()!.findEvents(criteria).length);
		assert.equal(0, this.appSensorServer.getAttackStore()!.findAttacks(criteria).length);

        this.appSensorClient.getEventManager()!.addEvent(this.generateNewEvent());

		await this.sleep(this.sleepAmount);

		assert.equal(2, this.appSensorServer.getEventStore()!.findEvents(criteria).length);
		assert.equal(0, this.appSensorServer.getAttackStore()!.findAttacks(criteria).length);

        this.appSensorClient.getEventManager()!.addEvent(this.generateNewEvent());

		await this.sleep(this.sleepAmount);

		assert.equal(3, this.appSensorServer.getEventStore()!.findEvents(criteria).length);
		assert.equal(1, this.appSensorServer.getAttackStore()!.findAttacks(criteria).length);

        this.appSensorClient.getEventManager()!.addEvent(this.generateNewEvent());

		await this.sleep(this.sleepAmount);

		assert.equal(4, this.appSensorServer.getEventStore()!.findEvents(criteria).length);
		assert.equal(1, this.appSensorServer.getAttackStore()!.findAttacks(criteria).length);

        this.appSensorClient.getEventManager()!.addEvent(this.generateNewEvent());

		await this.sleep(this.sleepAmount);

		assert.equal(5, this.appSensorServer.getEventStore()!.findEvents(criteria).length);
		assert.equal(1, this.appSensorServer.getAttackStore()!.findAttacks(criteria).length);

        this.appSensorClient.getEventManager()!.addEvent(this.generateNewEvent());

		await this.sleep(this.sleepAmount);

		assert.equal(6, this.appSensorServer.getEventStore()!.findEvents(criteria).length);
		assert.equal(2, this.appSensorServer.getAttackStore()!.findAttacks(criteria).length);

        this.appSensorClient.getEventManager()!.addEvent(this.generateNewEvent());

		await this.sleep(this.sleepAmount);

		assert.equal(7, this.appSensorServer.getEventStore()!.findEvents(criteria).length);
		assert.equal(2, this.appSensorServer.getAttackStore()!.findAttacks(criteria).length);
	}

	private loadMockedDetectionPoints(): DetectionPoint[] {
		const configuredDetectionPoints: DetectionPoint[] = [];

		const minutes5 = new Interval(5, Interval.MINUTES);
		const minutes6 = new Interval(6, Interval.MINUTES);
		const minutes7 = new Interval(7, Interval.MINUTES);
		const minutes8 = new Interval(8, Interval.MINUTES);
		const minutes11 = new Interval(11, Interval.MINUTES);
		const minutes12 = new Interval(12, Interval.MINUTES);
		const minutes13 = new Interval(13, Interval.MINUTES);
		const minutes14 = new Interval(14, Interval.MINUTES);
		const minutes15 = new Interval(15, Interval.MINUTES);
		const minutes31 = new Interval(31, Interval.MINUTES);
		const minutes32 = new Interval(32, Interval.MINUTES);
		const minutes33 = new Interval(33, Interval.MINUTES);
		const minutes34 = new Interval(34, Interval.MINUTES);
		const minutes35 = new Interval(35, Interval.MINUTES);

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
        const event = new AppSensorEvent(this.generateUserBob(), 
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

    private generateUserBob(): User {
        const bob = new User("bob");
        bob.setIPAddress(this.ipAddressLocator.fromString("8.8.8.8"));

        return bob;
    }

    private generateDetectionPoint1(): DetectionPoint {
        const detectionPoint1 = new DetectionPoint();
        detectionPoint1.setCategory(Category.INPUT_VALIDATION);
        detectionPoint1.setLabel("IE1");
        return detectionPoint1;
    }

    private generateDetectionSystemLocalhostMe(): DetectionSystem {
        const detectionSystem = new DetectionSystem("localhostme");
        detectionSystem.setIPAddress(this.ipAddressLocator.fromString("9.9.9.9"));

        return detectionSystem;
    }

	private generateMetaData(): KeyValuePair[] {
		const metaDataCol: KeyValuePair[] =  [];
		metaDataCol.push(new KeyValuePair("meta", "data"));

		return metaDataCol;
	}

	private sleep(millis: number): Promise<null> {
		return new Promise((resolve, reject) => {
			setTimeout(() => {
				resolve(null);
			}, millis);
		});

	}

	public static async runTests() {
		const test = new ReferenceStatisticalEventAnalysisEngineTest();
		await test.testAttackCreation();
	}

}

(async () => {
	await ReferenceStatisticalEventAnalysisEngineTest.runTests();
})();