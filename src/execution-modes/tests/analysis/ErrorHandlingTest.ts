import { AppSensorClient, AppSensorEvent, AppSensorServer } from "../../../core/core.js";
import { BaseTest } from "./BaseTest.js";

import assert from "assert";

class ErrorHandlingTest extends BaseTest {

    constructor(appSensorServer: AppSensorServer, appSensorClient: AppSensorClient) {
        super(appSensorServer, appSensorClient);
    }

    public async testError() {
        // //generate false event object
        // const event: AppSensorEvent = JSON.parse("{}");

        // let errorToCheck: string | Error = new TypeError("event.getDetectionSystem is not a function");
        // switch (execMode) {
        //     case EXEC_MODE.EXEC_MODE_WEBSOCKET: {
        //         errorToCheck = new Error("TypeError: Cannot read property 'getDetectionSystemId' of undefined");
        //         break;
        //     }
        //     case EXEC_MODE.EXEC_MODE_REST: {
        //         errorToCheck = new Error('Server responded with status: 500');
        //         break;
        //     }
        // }

        // await assert.rejects(this.appSensorClient.getEventManager()!.addEvent(event), 
        //                      errorToCheck);

    }

    public static async runTests(appSensorServer: AppSensorServer, 
                                 appSensorClient: AppSensorClient) {
		console.log();
		console.log('----- Run ErrorHandlingTest -----');
		const inst = new ErrorHandlingTest(appSensorServer, appSensorClient);
		inst.initializeTest();
		await inst.testError();
    }
}

export {ErrorHandlingTest};

