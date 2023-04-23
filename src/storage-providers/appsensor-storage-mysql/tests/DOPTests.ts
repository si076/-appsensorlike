import { AppSensorEvent, Category, DetectionPoint, DetectionSystem, Interval, INTERVAL_UNITS, KeyValuePair, Resource, Response, Threshold, User } from "../../../core/core.js";
import { ConnectionManager } from "../connection_manager.js";
import { DOP } from "../DOP.js";

class DOPTests {

	private static init(func: () => void) {
		if (!DOP.isCacheLoaded()) {
			DOP.addCacheLoadedListener(func);
		} else {
			func();
		}
	}

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

    private static async persistObjects() {
        console.log('--> persistObjects');

        const user = new User("Test");
        const detectionSystem = new DetectionSystem("localhostme");

		const minutes5 = new Interval(5, INTERVAL_UNITS.MINUTES);
		const minutes6 = new Interval(6, INTERVAL_UNITS.MINUTES);

		const events3minutes5 = new Threshold(3, minutes5);
		const events12minutes5 = new Threshold(12, minutes5);
		const events13minutes6 = new Threshold(13, minutes6);

        const responses: Response[] = DOPTests.generateResponses();

		const point1 = new DetectionPoint(Category.INPUT_VALIDATION, "IE1", events3minutes5, responses);
		const point2 = new DetectionPoint(Category.INPUT_VALIDATION, "IE2", events12minutes5, responses);
		const point3 = new DetectionPoint(Category.INPUT_VALIDATION, "IE3", events13minutes6, responses);

        const keyValue1 = new KeyValuePair("key1", "value1");
        const keyValue2 = new KeyValuePair("key2", "value2");

        const metadata = [keyValue1, keyValue2];

        const resource = new Resource("https://test.test.org", "GET");

        const event1 = new AppSensorEvent(user, point1, detectionSystem, new Date());
        event1.setResource(resource);
        event1.setMetadata(metadata);

		const event2 = new AppSensorEvent(user, point1, detectionSystem, new Date());;
        event2.setResource(resource);
        event2.setMetadata(metadata);

		const event3 = new AppSensorEvent(user, point2, detectionSystem, new Date());;
        event3.setResource(resource);
        event3.setMetadata(metadata);


		const event4 = new AppSensorEvent(user, point3, detectionSystem, new Date());
		const keyValue3 = new KeyValuePair("key3", "value3");
		const metadata4 = metadata.slice();
		metadata4.push(keyValue3);

        event4.setResource(resource);
        event4.setMetadata(metadata4);
		

		DOP.persistMany([event1,event2, event3, event4]);

        console.log('<-- persistObjects');
    } 

    public static async runTests() {
        console.log('----- Run DOPTests -----');
		DOPTests.init(async () => {
			await DOPTests.persistObjects();
		});
		
    }
}

export {DOPTests}