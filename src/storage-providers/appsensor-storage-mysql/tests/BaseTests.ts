import { Category, DetectionPoint, DetectionSystem, Interval, INTERVAL_UNITS, KeyValuePair, Resource, Response, Threshold, User } from "../../../core/core.js";
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

	private static generateResponses(): Response[] {
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

	protected async init(func: () => Promise<void>) {
		await this.clearTables();

		DOP.clearCache();

		if (!DOP.isCacheLoaded()) {
			DOP.addCacheLoadedListener(func);
		} else {
			await func();
		}
	}

	protected async clearTables() {
		let sql = 'delete from appsensor.attack';
		await Utils.executeSQLOnDB(sql, (results: any) =>{});

		sql = 'delete from appsensor.response';
		await Utils.executeSQLOnDB(sql, (results: any) =>{});

		sql = 'delete from appsensor.appsensorevent';
		await Utils.executeSQLOnDB(sql, (results: any) =>{});

		sql = 'delete from appsensor.detection_point';
		await Utils.executeSQLOnDB(sql, (results: any) =>{});

		sql = 'delete from appsensor.detection_system';
		await Utils.executeSQLOnDB(sql, (results: any) =>{});

		sql = 'delete from appsensor.`resource`';
		await Utils.executeSQLOnDB(sql, (results: any) =>{});

		sql = 'delete from appsensor.threshold';
		await Utils.executeSQLOnDB(sql, (results: any) =>{});

		sql = 'delete from appsensor.`interval`';
		await Utils.executeSQLOnDB(sql, (results: any) =>{});

		sql = 'delete from appsensor.`user`';
		await Utils.executeSQLOnDB(sql, (results: any) =>{});

		sql = 'delete from appsensor.metadata';
		await Utils.executeSQLOnDB(sql, (results: any) =>{});

		sql = 'delete from appsensor.key_value_pair';
		await Utils.executeSQLOnDB(sql, (results: any) =>{});
	}

}

export {BaseTests}