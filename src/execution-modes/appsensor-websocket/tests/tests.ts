
import * as readline from 'readline';
import { runTests as test} from '../../tests/tests.js';
import { AppSensorWebsocketExecClient } from '../client/appsensor_websocket_client.js';
import { AppSensorWebsocketExecServer } from '../server/appsensor_websocket_server.js';

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