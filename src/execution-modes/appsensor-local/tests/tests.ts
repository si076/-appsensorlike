
import assert from 'assert';

import * as readline from 'readline';

import { AppSensorClient, AppSensorEvent } from '../../../core/core.js';
import { Utils } from '../../../utils/Utils.js';
import { runTests as test} from '../../tests/tests.js';
import { AppSensorLocal } from '../appsensor_local.js';

async function testErrorHandling(appSensorClient: AppSensorClient) {
    //generate false event object
    const event: AppSensorEvent = JSON.parse("{}");

    await assert.rejects(appSensorClient.getEventManager()!.addEvent(event), 
                         new TypeError("event.getDetectionSystem is not a function"));
}

async function runTests(readInf: readline.Interface | null = null) {
    const configLocation = "../execution-modes/tests/analysis/appsensor-analysis-tests-server-config.json";
    const configAbsolutPath = Utils.resolvePath(import.meta.url, configLocation);

    const appSensorLocal = new AppSensorLocal(configAbsolutPath);
    
    await testErrorHandling(appSensorLocal.getAppSensorClient());

    await test(appSensorLocal.getAppSensorServer(), appSensorLocal.getAppSensorClient(), configLocation, readInf);
}



export {runTests};