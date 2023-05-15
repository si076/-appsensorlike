
import * as readline from 'readline';
import { MySQLAttackStore, MySQLEventStore, MySQLResponseStore } from '../../../storage-providers/appsensor-storage-mysql/appsensor-storage-mysql.js';
import { runTests as test} from '../../tests/tests.js';
import { AppSensorWebsocketExecClient, AppSensorWebsocketExecServer } from '../appsensor_websocket.js';

async function runTests(readInf: readline.Interface | null = null) {
    const appSensorWebSocketServer = 
            new AppSensorWebsocketExecServer("./execution-modes/tests/analysis/appsensor-analysis-tests-server-config.json",
                                             "");
    const appSensorWebSocketClient = new AppSensorWebsocketExecClient();

    await test(appSensorWebSocketServer.getAppSensorServer(), 
               appSensorWebSocketClient.getAppSensorClient(), 
               readInf,
               false);
    
    appSensorWebSocketClient.closeWebSocket();
    appSensorWebSocketServer.closeWebSocketServer();
}



export {runTests};