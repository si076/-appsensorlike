import { AppSensorLocal } from "../../../execution-modes/appsensor-local/appsensor_local.js";
import { AppSensorWebsocketExecClient, AppSensorWebsocketExecServer } from "../../../execution-modes/appsensor-websocket/appsensor_websocket.js";
import { MySQLAttackStore, MySQLEventStore, MySQLResponseStore } from "../appsensor-storage-mysql.js";
import { AggregateEventAnalysisEngineIntegrationTest } from "./AggregateEventAnalysisEngineIntegrationTest.js";
import { DOPTests } from "./DOPTests.js";
import { MySQLStorageTests } from "./MySQLStorageTests.js";

async function runTests() {
    console.log('----- Run MySQL Storage Tests -----');
    const appSensorLocal = new AppSensorLocal('',
                                                new MySQLAttackStore(),
                                                new MySQLEventStore(),
                                                new MySQLResponseStore());
    await DOPTests.runTests(appSensorLocal.getAppSensorServer(),
                            appSensorLocal.getAppSensorClient());
    await MySQLStorageTests.runTests(appSensorLocal.getAppSensorServer(),
                                     appSensorLocal.getAppSensorClient(), 
                                     'Exection Mode Local');
    await AggregateEventAnalysisEngineIntegrationTest.runTests(appSensorLocal.getAppSensorServer(),
                                                               appSensorLocal.getAppSensorClient(),
                                                               'Exection Mode Local');

    const appSensorWebSocketServer = 
            new AppSensorWebsocketExecServer('', '', undefined,
                                             new MySQLAttackStore(),
                                             new MySQLEventStore(),
                                             new MySQLResponseStore());
                                             
    const appSensorWebSocketClient = new AppSensorWebsocketExecClient();

    await MySQLStorageTests.runTests(appSensorWebSocketServer.getAppSensorServer(),
                                     appSensorWebSocketClient.getAppSensorClient(), 
                                     'Exection Mode WebSocket');
    await AggregateEventAnalysisEngineIntegrationTest.runTests(appSensorWebSocketServer.getAppSensorServer(),
                                                               appSensorWebSocketClient.getAppSensorClient(),
                                                               'Exection Mode WebSocket');

                                                   
}

export {runTests}