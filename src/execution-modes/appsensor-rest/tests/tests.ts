import * as readline from 'readline';
import { JSONConfigReadValidate } from '../../../utils/Utils.js';
import { EXEC_MODE, runTests as test} from '../../tests/tests.js';
import { AppSensorRestClient } from '../client/appsensor_rest_client.js';
import { AppSensorRestServer } from '../server/appsensor-rest-server.js';

async function runTests(readInf: readline.Interface | null = null) {
    const configLocation = "../execution-modes/tests/analysis/appsensor-analysis-tests-server-config.json";
    const configAbsolutPath = JSONConfigReadValidate.resolvePath(import.meta.url, configLocation);

    const appSensorRestServer = 
            new AppSensorRestServer(configAbsolutPath,
                                    "");
    const appSensorRestClient = new AppSensorRestClient();

    await appSensorRestServer.initStartServer();
    
    await test(appSensorRestServer.getAppSensorServer(), 
               appSensorRestClient.getAppSensorClient(), 
               configLocation,
               readInf,
               EXEC_MODE.EXEC_MODE_REST);
   
}



export {runTests};