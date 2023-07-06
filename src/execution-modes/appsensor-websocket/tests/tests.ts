
import * as readline from 'readline';
import { JSONConfigReadValidate } from '../../../utils/Utils.js';
import { EXEC_MODE, runTests as test} from '../../tests/tests.js';
import { AppSensorWebsocketExecClient } from '../client/appsensor_websocket_client.js';
import { AppSensorWebsocketExecServer } from '../server/appsensor_websocket_server.js';

async function runTests(readInf: readline.Interface | null = null) {
    const configLocation = "../execution-modes/tests/analysis/appsensor-analysis-tests-server-config.json";
    const configAbsolutPath = JSONConfigReadValidate.resolvePath(import.meta.url, configLocation);

    const appSensorWebSocketServer = 
            new AppSensorWebsocketExecServer(configAbsolutPath,
                                             "");
    const appSensorWebSocketClient = new AppSensorWebsocketExecClient();

    await appSensorWebSocketServer.startWebSocketServer();

    await test(appSensorWebSocketServer.getAppSensorServer(), 
               appSensorWebSocketClient.getAppSensorClient(), 
               configLocation,
               readInf,
               EXEC_MODE.EXEC_MODE_WEBSOCKET);
    
    await appSensorWebSocketClient.closeWebSocket();
    await appSensorWebSocketServer.closeWebSocketServer();
}



export {runTests};