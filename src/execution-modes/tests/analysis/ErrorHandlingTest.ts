import { AppSensorClient, AppSensorEvent, AppSensorServer } from "../../../core/core.js";
import { BaseTest } from "./BaseTest.js";

import assert from "assert";

class ErrorHandlingTest extends BaseTest {

    constructor(appSensorServer: AppSensorServer, appSensorClient: AppSensorClient) {
        super(appSensorServer, appSensorClient);
    }

    public async testError(execModeLocal: boolean = true) {
        //generate false event object
        const event: AppSensorEvent = JSON.parse("{}");

        const errorToCheck = execModeLocal ? new TypeError("event.getDetectionSystem is not a function") : 
                                             new Error("TypeError: Cannot read property 'getDetectionSystemId' of undefined");

        await assert.rejects(this.appSensorClient.getEventManager()!.addEvent(event), 
                             errorToCheck);

    }

    public static async runTests(appSensorServer: AppSensorServer, 
                                 appSensorClient: AppSensorClient, 
                                 execModeLocal: boolean = true) {
		console.log();
		console.log('----- Run ErrorHandlingTest -----');
		const inst = new ErrorHandlingTest(appSensorServer, appSensorClient);
		inst.initializeTest();
		await inst.testError(execModeLocal);
    }
}

export {ErrorHandlingTest};

