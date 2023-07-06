import { AppSensorClient, AppSensorEvent, AppSensorServer, DetectionPoint, KeyValuePair } from "@appsensorlike/appsensorlike/core/core.js";
import { DOP, TYPE_FILTER_FUNCTION } from "../DOP.js";
import { BaseTests } from "./BaseTests.js";

import assert from "assert";

class DOPTests extends BaseTests {

	constructor(appSensorServer: AppSensorServer, appSensorClient: AppSensorClient) {
		super(appSensorServer, appSensorClient);
	}

    private async persistObjects() {
        console.log('--> persistObjects');


        const event1 = new AppSensorEvent(BaseTests.user, BaseTests.point1, BaseTests.detectionSystem, new Date());
        event1.setResource(BaseTests.resource);
        event1.setMetadata(BaseTests.metadata);

		const event2 = new AppSensorEvent(BaseTests.user, BaseTests.point1, BaseTests.detectionSystem, new Date());
        event2.setResource(BaseTests.resource);
        event2.setMetadata(BaseTests.metadata);

		const event3 = new AppSensorEvent(BaseTests.user, BaseTests.point2, BaseTests.detectionSystem, new Date());
        event3.setResource(BaseTests.resource);
        event3.setMetadata(BaseTests.metadata);


		const event4 = new AppSensorEvent(BaseTests.user, BaseTests.point3, BaseTests.detectionSystem, new Date());
		const keyValue3 = new KeyValuePair("key3", "value3");
		const metadata4 = BaseTests.metadata.slice();
		metadata4.push(keyValue3);

        event4.setResource(BaseTests.resource);
        event4.setMetadata(metadata4);

		const event5 = new AppSensorEvent(BaseTests.user, BaseTests.point3, BaseTests.detectionSystem, new Date());
		event5.setResource(BaseTests.resource);
	

		await DOP.persistMany([event1,event2, event3, event4, event5]);

		const propFilterFuncMap = new Map<string, TYPE_FILTER_FUNCTION | string>();

		propFilterFuncMap.set("user", (obj: Object) => {
			return  BaseTests.user.equals(obj);
		});

		propFilterFuncMap.set("detectionPoint", (obj: Object) => {
			return BaseTests.point3.typeAndThresholdMatches(obj as DetectionPoint);
		});

		const foundEvents = await DOP.findObjects("AppSensorEvent", propFilterFuncMap);
		assert.equal(foundEvents.length, 2);

		console.log(foundEvents[1]);

        console.log('<-- persistObjects');
    } 

    public static async runTests(appSensorServer: AppSensorServer, appSensorClient: AppSensorClient) {
        console.log('----- Run DOPTests -----');
		const inst = new DOPTests(appSensorServer, appSensorClient);
		await inst.initializeTest();
		await inst.persistObjects();
		
    }

}

export {DOPTests}