
import * as readline from 'readline';
import { runTests as test} from '../../tests/tests.js';
import { AppSensorLocal } from '../appsensor_local.js';

async function runTests(readInf: readline.Interface | null = null) {
    const configLocation = "./execution-modes/tests/analysis/appsensor-analysis-tests-server-config.json";
    const appSensorLocal = new AppSensorLocal(configLocation);
    await test(appSensorLocal.getAppSensorServer(), appSensorLocal.getAppSensorClient(), configLocation, readInf);
}



export {runTests};