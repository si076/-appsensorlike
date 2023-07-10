
import * as readline from 'readline';
import { JSONConfigReadValidate, Utils } from '../../../utils/Utils.js';
import { runTests as test} from '../../tests/tests.js';
import { AppSensorLocal } from '../appsensor_local.js';

async function runTests(readInf: readline.Interface | null = null) {
    const configLocation = "../execution-modes/tests/analysis/appsensor-analysis-tests-server-config.json";
    const configAbsolutPath = Utils.resolvePath(import.meta.url, configLocation);

    const appSensorLocal = new AppSensorLocal(configAbsolutPath);
    
    await test(appSensorLocal.getAppSensorServer(), appSensorLocal.getAppSensorClient(), configLocation, readInf);
}



export {runTests};