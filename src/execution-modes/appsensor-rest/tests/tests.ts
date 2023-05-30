import * as readline from 'readline';
import { EXEC_MODE, runTests as test} from '../../tests/tests.js';
import { AppSensorRestClient } from '../client/appsensor_rest_client.js';
import { AppSensorRestServer } from '../server/appsensor-rest-server.js';

async function runTests(readInf: readline.Interface | null = null) {
    const appSensorRestServer = 
            new AppSensorRestServer("./execution-modes/tests/analysis/appsensor-analysis-tests-server-config.json",
                                             "");
    const appSensorRestClient = new AppSensorRestClient();

    await test(appSensorRestServer.getAppSensorServer(), 
               appSensorRestClient.getAppSensorClient(), 
               readInf,
               EXEC_MODE.EXEC_MODE_REST);
   
}



export {runTests};