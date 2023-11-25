import { AppSensorClient, AppSensorEvent, AppSensorServer, Attack, Category, DetectionPoint, 
	     DetectionSystem, Interval, INTERVAL_UNITS, IPAddress, Response, Threshold, User,
		 ClientApplication } from "@appsensorlike/appsensorlike/core/core.js";
import { ServerConfiguration } from "@appsensorlike/appsensorlike/core/configuration/server/server_configuration.js";
import { AppSensorLocal } from "@appsensorlike/appsensorlike/execution-modes/appsensor-local/appsensor_local.js";
import { Role } from "@appsensorlike/appsensorlike/core/accesscontrol/accesscontrol.js"
import { Logger } from "@appsensorlike/appsensorlike/logging/logging.js";
import { InMemoryAttackStore, InMemoryEventStore, InMemoryResponseStore } from "@appsensorlike/appsensorlike/storage-providers/appsensor-storage-in-memory/appsensor-storage-in-memory.js";
import { AppSensorReportingWebSocketClient } from "../client/appsensor-reporting-websocket-client.js";
import { AppSensorReportingWebSocketServer } from "../server/appsensor-reporting-websocket-server.js";
import { Utils } from "@appsensorlike/appsensorlike/utils/Utils.js";
import { JSONServerConfigurationReader } from "@appsensorlike/appsensorlike/configuration-modes/appsensor-configuration-json/server/JSONServerConfig.js";
import { loggedUnexpectedErrors } from "@appsensorlike/appsensorlike/execution-modes/tests/tests.js";

import assert from "assert";

class AppSensorReportingWebsocketClientTest {

    private wsClient: AppSensorReportingWebSocketClient;

	constructor(websocketConfigLocation: string = '') {
        this.wsClient = new AppSensorReportingWebSocketClient(websocketConfigLocation);
	}

    public async test(earliest: string, withCustomPoints: boolean) {
        const events = await this.wsClient.findEvents(earliest);

		const expectedEventCount = withCustomPoints ? 31 : 21;
        assert.equal(events.length, expectedEventCount);

		let attackCount = 0;
		let responseCount = 0;

        let res = await this.getStatForUser(earliest, "user1");
		attackCount += res.attackCount;
		responseCount += res.responseCount;

        res = await this.getStatForUser(earliest, "user2");
		attackCount += res.attackCount;
		responseCount += res.responseCount;

        res = await this.getStatForUser(earliest, "user3");
		attackCount += res.attackCount;
		responseCount += res.responseCount;

        res = await this.getStatForUser(earliest, "user4");
		attackCount += res.attackCount;
		responseCount += res.responseCount;

		const eventCountByCategoryLabel = await this.wsClient.countEventsByCategoryLabel(earliest, Category.INPUT_VALIDATION, "IE1");
		assert.equal(eventCountByCategoryLabel, 6);

		const attackCountByCategoryLabel = await this.wsClient.countAttacksByCategoryLabel(earliest, Category.INPUT_VALIDATION, "IE1");
		assert.equal(attackCountByCategoryLabel, 2);

		const responseCountByCategoryLabel = await this.wsClient.countResponsesByCategoryLabel(earliest, Category.INPUT_VALIDATION, "IE1");
		assert.equal(responseCountByCategoryLabel, 2);

		const configStr = await this.wsClient.getServerConfigurationAsJson();

		const config: ServerConfiguration | null = new JSONServerConfigurationReader().readFromString(configStr);

		Logger.getTestsLogger().info(config);
    }

    private async getStatForUser(earliest: string, userName: string): Promise<{eventCount: number, attackCount: number, responseCount: number}> {
        const eventCount = await this.wsClient.countEventsByUser(earliest, userName);
        const attackCount = await this.wsClient.countAttacksByUser(earliest, userName);
        const responseCount = await this.wsClient.countResponsesByUser(earliest, userName);
        Logger.getTestsLogger().info(`Stats for user: ${userName} since: ${earliest}`);
        Logger.getTestsLogger().info(`Event count: ${eventCount}`);
        Logger.getTestsLogger().info(`Attack count: ${attackCount}`);
        Logger.getTestsLogger().info(`Response count: ${responseCount}`);

		return {eventCount: eventCount, attackCount: attackCount, responseCount: responseCount};
    }

	async connectWebsocket() {
		await this.wsClient.connect();
	}

	async closeWebsocket() {
		await this.wsClient.closeSocket();
	}
}

class AppSensorReportingWebsocketClientExt extends AppSensorReportingWebSocketClient {

	constructor() {
		super();
	}

	onAdd(event: AppSensorEvent | Attack | Response): Promise<void> {
        Logger.getTestsLogger().info(event);
        if (event.getTimestamp()) {
            Logger.getTestsLogger().info(event.getTimestamp()!.getMilliseconds());
        }

		return Promise.resolve();
	}
}


class AppSensorReportingWebsocketTests {

    private appSensorLocal: AppSensorLocal;
    private appSensorClient: AppSensorClient;
    private appSensorServer: AppSensorServer;

    private wsServer: AppSensorReportingWebSocketServer;

    constructor(websocketServerConfigLocation: string = '') {
        this.appSensorLocal = new AppSensorLocal('');

        this.appSensorClient = this.appSensorLocal.getAppSensorClient();
        this.appSensorServer = this.appSensorLocal.getAppSensorServer();

		(this.appSensorServer.getEventStore() as InMemoryEventStore).clearAll();
		(this.appSensorServer.getAttackStore() as InMemoryAttackStore).clearAll();
		(this.appSensorServer.getResponseStore() as InMemoryResponseStore).clearAll();

        this.wsServer = new AppSensorReportingWebSocketServer(this.appSensorServer, websocketServerConfigLocation);
    }

	public async startServer() {
		await this.wsServer.startServer();
	}

    public async populateData(withCustomPoints: boolean = false) {
        const ipAddress1 = await IPAddress.fromString("83.228.0.1");
		const user1 = new User("user1", ipAddress1);

        const ipAddress2 = await IPAddress.fromString("83.228.0.2");
		const user2 = new User("user2", ipAddress2);

        const ipAddress3 = await IPAddress.fromString("83.228.0.3");
		const user3 = new User("user3", ipAddress3);

        const ipAddress4 = await IPAddress.fromString("83.228.0.4");
		const user4 = new User("user4", ipAddress4);

        const ipAddress5 = await IPAddress.fromString("80.80.128.1");
		const detectionSystem1 = new DetectionSystem("attacked server1", ipAddress5);

        const ipAddress6 = await IPAddress.fromString("80.80.128.2");
		const detectionSystem2 = new DetectionSystem("attacked server2", ipAddress6);
		
		const users: User[] = [user1, user2, user3, user4];
		const detectionSystems: DetectionSystem[] = [detectionSystem1, detectionSystem2];
		
		const clientApps = this.loadMockedClientApplications();
		this.appSensorServer.getConfiguration()!.setClientApplications(clientApps);

		const configuredDetPoint = this.loadMockedDetectionPoints();
		this.appSensorServer.getConfiguration()!.setDetectionPoints(configuredDetPoint);

		for (let i = 0; i < 10; i++) {
			await Utils.sleep(Math.floor(Math.random() * 2000)  + 500);
			await this.appSensorClient.getEventManager()!
						.addEvent(new AppSensorEvent(users[this.getRandomInt(4)], configuredDetPoint[this.getRandomInt(4)], detectionSystems[this.getRandomInt(2)]));
		}


		//to ensure that will have at least one generated attack and response
        const detectionPoint1 = new DetectionPoint(Category.INPUT_VALIDATION, "IE1");
		for (let i = 0; i < 6; i++) {
			await Utils.sleep(Math.floor(Math.random() * 2000)  + 500);
			await this.appSensorClient.getEventManager()!
						.addEvent(new AppSensorEvent(users[0], detectionPoint1, detectionSystems[0]));
		}


		//add events of one more category detection point 
		const detectionPointRE7 = new DetectionPoint(Category.REQUEST, "RE7");
		for (let i = 0; i < 5; i++) {
			await Utils.sleep(Math.floor(Math.random() * 2000)  + 500);
			await this.appSensorClient.getEventManager()!
						.addEvent(new AppSensorEvent(users[1], detectionPointRE7, detectionSystems[1]));
		}
		

		if (withCustomPoints) {
			const customDetPoint = this.loadCustomMockedDetectionPoints();
			this.appSensorServer.getConfiguration()!.setCustomDetectionPoints(customDetPoint);
						
			//generate random events of custom detection points
			const clients = [detectionSystems[0].getDetectionSystemId(), 
							 detectionSystems[1].getDetectionSystemId()];

			for (let i = 0; i < 10; i++)  {
				await Utils.sleep(Math.floor(Math.random() * 1000 * 40)  + 500);
	
				const random = this.getRandomInt(2);
				const client = clients[random];
	
				const detPoints = customDetPoint.get(client);
				if (detPoints) {
					await this.appSensorClient.getEventManager()!
							.addEvent(new AppSensorEvent(users[this.getRandomInt(4)], 
														 detPoints[this.getRandomInt(detPoints.length)], 
														 detectionSystems[random]));
				}
			}
		}
			
	}
    
    private getRandomInt(max: number) {
        return Math.floor(Math.random() * max);
    }
	
	private loadMockedClientApplications(): ClientApplication[] {
		const app = new ClientApplication('Test', 
		                                  [Role.ADD_EVENT, 
										   Role.ADD_ATTACK, 
										   Role.GET_RESPONSES, 
										   Role.EXECUTE_REPORT]);
		
		app.setIPAddress(new IPAddress("127.0.0.1"));

		return [app];
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
		const events2minutes8 = new Threshold(2, minutes8);
		const events5minutes5 = new Threshold(5, minutes5);
		
		const log = new Response();
		log.setAction("log");
		log.setInterval(new Interval(30, INTERVAL_UNITS.MINUTES));
		
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
		

		const point6Responses: Response[] = [];
		point6Responses.push(log);

		const point6 = new DetectionPoint(Category.REQUEST, "RE7", events2minutes8, point6Responses);

		const point7Responses: Response[] = [];
		point7Responses.push(logout);
		
		const point7 = new DetectionPoint(Category.REQUEST, "RE7", events5minutes5, point7Responses);


		configuredDetectionPoints.push(point2);
		configuredDetectionPoints.push(point3);
		configuredDetectionPoints.push(point4);
		configuredDetectionPoints.push(point5);
		//
		configuredDetectionPoints.push(point1);
		configuredDetectionPoints.push(point6);
		configuredDetectionPoints.push(point7);

		return configuredDetectionPoints;
	}    

	public loadCustomMockedDetectionPoints(): Map<string, DetectionPoint[]> {
		const customDetectionPoints = new Map<string, DetectionPoint[]>();

		const minutes5 = new Interval(5, INTERVAL_UNITS.MINUTES);
		const minutes6 = new Interval(6, INTERVAL_UNITS.MINUTES);

		const events3minutes5 = new Threshold(3, minutes5);
		const events4minutes6 = new Threshold(4, minutes6);

		const logout = new Response();
		logout.setAction("logout");
		
		const disableUser = new Response();
		disableUser.setAction("disableUser");

		const point1Responses: Response[] = [];
		point1Responses.push(logout);

		const point1 = new DetectionPoint("Custom", "Z1", events3minutes5, point1Responses);

		customDetectionPoints.set("attacked server1", [point1]);

		
		const point2Responses: Response[] = [];
		point2Responses.push(disableUser);

		const point2 = new DetectionPoint("Custom", "Z2", events4minutes6, point2Responses);

		customDetectionPoints.set("attacked server2", [point2]);


		return customDetectionPoints;
	}


	async closeServer() {
		await this.wsServer.closeServer();
	}
}

async function runTestWithHttpServer(earliest: string, withCustomPoints: boolean) {
	Logger.getTestsLogger().info('----- With Http Server -----');
	let configLocation = 'appsensor-reporting-websocket-server-config1.json';
	let configAbsolutPath = Utils.resolvePath(import.meta.url, configLocation);

    const server = new AppSensorReportingWebsocketTests(configAbsolutPath);
	await server.startServer();
    await server.populateData(withCustomPoints);

	configLocation = 'appsensor-reporting-websocket-client-config1.json';
	configAbsolutPath = Utils.resolvePath(import.meta.url, configLocation);

	const client = new AppSensorReportingWebsocketClientTest(configAbsolutPath);
	await client.connectWebsocket();
    await client.test(earliest, withCustomPoints);

	await client.closeWebsocket();

	await server.closeServer();
}

async function runTestWithHttpsServer(earliest: string, withCustomPoints: boolean) {
	Logger.getTestsLogger().info('----- With Https Server -----');
	let configLocation = 'appsensor-reporting-websocket-server-config2.json';
	let configAbsolutPath = Utils.resolvePath(import.meta.url, configLocation);

    const server = new AppSensorReportingWebsocketTests(configAbsolutPath);
	await server.startServer();
    await server.populateData(withCustomPoints);

	configLocation = 'appsensor-reporting-websocket-client-config2.json';
	configAbsolutPath = Utils.resolvePath(import.meta.url, configLocation);

	const client = new AppSensorReportingWebsocketClientTest(configAbsolutPath);
	await client.connectWebsocket();
    await client.test(earliest, withCustomPoints);
	
	await client.closeWebsocket();

	await server.closeServer();
}

async function runTests() {
    Logger.getTestsLogger().info('----- Run AppSensorReportingWebsocketTests -----');
	const earliest = new Date().toISOString();

    let exitCode = 0;

    try {
		await runTestWithHttpServer(earliest, true);
		
		await runTestWithHttpsServer(earliest, false);
	} catch (error) {
		exitCode = 1;
		Logger.getTestsLogger().error(error);
	}

    if (loggedUnexpectedErrors([])) {
        exitCode = 1;
    }

    await Logger.shutdownAsync();
    
    process.exit(exitCode);
}

async function runServerSeparately(withCustomPoints: boolean = false) {
    const inst = new AppSensorReportingWebsocketTests();
	await inst.startServer();
    await inst.populateData(withCustomPoints);
}

async function runClientSeparately() {
	await new AppSensorReportingWebsocketClientTest().test('1970-01-01T00:00:00.000Z', false);
}

async function runClientSeparatelyReportEvents() {
	new AppSensorReportingWebsocketClientExt();
}

export {runTests, runServerSeparately, runClientSeparately, runClientSeparatelyReportEvents};