import { AppSensorClient, AppSensorServer, Category, DetectionPoint, DetectionSystem, Interval, INTERVAL_UNITS, KeyValuePair, Resource, Response, Threshold, User } from "../../../core/core.js";
import { AppSensorLocal } from "../../../execution-modes/appsensor-local/appsensor_local.js";
import { MySQLAttackStore, MySQLEventStore, MySQLResponseStore } from "../appsensor-storage-mysql.js";
import { DOP } from "../DOP.js";
import { Utils } from "../utils.js";

class BaseTests {

    protected static user = new User("Test");
    protected static detectionSystem = new DetectionSystem("localhostme");

    protected static minutes5 = new Interval(5, INTERVAL_UNITS.MINUTES);
    protected static minutes6 = new Interval(6, INTERVAL_UNITS.MINUTES);

    protected static events3minutes5 = new Threshold(3, BaseTests.minutes5);
    protected static events12minutes5 = new Threshold(12, BaseTests.minutes5);
    protected static events13minutes6 = new Threshold(13, BaseTests.minutes6);

    protected static responses: Response[] = BaseTests.generateResponses();

    protected static point1 = new DetectionPoint(Category.INPUT_VALIDATION, "IE1", BaseTests.events3minutes5, BaseTests.responses);
    protected static point2 = new DetectionPoint(Category.INPUT_VALIDATION, "IE2", BaseTests.events12minutes5, BaseTests.responses);
    protected static point3 = new DetectionPoint(Category.INPUT_VALIDATION, "IE3", BaseTests.events13minutes6, BaseTests.responses);

    protected static keyValue1 = new KeyValuePair("key1", "value1");
    protected static keyValue2 = new KeyValuePair("key2", "value2");

    protected static metadata = [BaseTests.keyValue1, BaseTests.keyValue2];

    protected static resource = new Resource("https://test.test.org", "GET");

	protected appSensorServer: AppSensorServer;

	protected appSensorClient: AppSensorClient;

	private appSensorLocal: AppSensorLocal;

	constructor() {
		this.appSensorLocal = new AppSensorLocal('',
												 new MySQLAttackStore(),
												 new MySQLEventStore(),
												 new MySQLResponseStore());

		this.appSensorServer = this.appSensorLocal.getAppSensorServer();

		this.appSensorClient = this.appSensorLocal.getAppSensorClient();
	}

	protected static generateResponses(): Response[] {
		const minutes5 = new Interval(5, INTERVAL_UNITS.MINUTES);

		const log = new Response();
		log.setAction("log");

		const logout = new Response();
		logout.setAction("logout");

		const disableUser = new Response();
		disableUser.setAction("disableUser");

		const disableComponentForSpecificUser5 = new Response();
		disableComponentForSpecificUser5.setAction("disableComponentForSpecificUser");
		disableComponentForSpecificUser5.setInterval(minutes5);

		const disableComponentForAllUsers5 = new Response();
		disableComponentForAllUsers5.setAction("disableComponentForAllUsers");
		disableComponentForAllUsers5.setInterval(minutes5);

		const responses: Response[] = [];
		responses.push(log);
		responses.push(logout);
		responses.push(disableUser);
		responses.push(disableComponentForSpecificUser5);
		responses.push(disableComponentForAllUsers5);

		return responses;
	}

	public async initializeTest() {
		await this.clearTables();

		DOP.clearCache();
	}

	protected async clearTables() {
		let sql = 'delete from attack';
		await Utils.executeSQLOnDB(sql, (results: any) =>{});

		sql = 'delete from response';
		await Utils.executeSQLOnDB(sql, (results: any) =>{});

		sql = 'delete from appsensorevent';
		await Utils.executeSQLOnDB(sql, (results: any) =>{});

		sql = 'delete from rule';
		await Utils.executeSQLOnDB(sql, (results: any) =>{});

		sql = 'delete from detection_point';
		await Utils.executeSQLOnDB(sql, (results: any) =>{});

		sql = 'delete from detection_system';
		await Utils.executeSQLOnDB(sql, (results: any) =>{});

		sql = 'delete from `resource`';
		await Utils.executeSQLOnDB(sql, (results: any) =>{});

		sql = 'delete from threshold';
		await Utils.executeSQLOnDB(sql, (results: any) =>{});

		sql = 'delete from `interval`';
		await Utils.executeSQLOnDB(sql, (results: any) =>{});

		sql = 'delete from `user`';
		await Utils.executeSQLOnDB(sql, (results: any) =>{});

		sql = 'delete from metadata';
		await Utils.executeSQLOnDB(sql, (results: any) =>{});

		sql = 'delete from key_value_pair';
		await Utils.executeSQLOnDB(sql, (results: any) =>{});

		sql = 'delete from ipaddress';
		await Utils.executeSQLOnDB(sql, (results: any) =>{});

		sql = 'delete from geo_location';
		await Utils.executeSQLOnDB(sql, (results: any) =>{});
	}

	protected sleep(millis: number): Promise<null> {
		return new Promise((resolve, reject) => {
			setTimeout(() => {
				resolve(null);
			}, millis);
		});

	}

}

export {BaseTests}