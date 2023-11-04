import { AppSensorLocal } from "@appsensorlike/appsensorlike/execution-modes/appsensor-local/appsensor_local.js";
import { AppSensorClient, AppSensorServer } from "@appsensorlike/appsensorlike/core/core.js";
import { Logger } from "@appsensorlike/appsensorlike/logging/logging.js";

import { MySQLAttackStore, MySQLEventStore, MySQLResponseStore } from "../appsensor-storage-mysql.js";
import { AggregateEventAnalysisEngineIntegrationTest } from "./AggregateEventAnalysisEngineIntegrationTest.js";
import { DOPTests } from "./DOPTests.js";
import { MySQLStorageTests } from "./MySQLStorageTests.js";
// import { AppSensorWebsocketExecServer } from "../../../execution-modes/appsensor-websocket/server/appsensor_websocket_server.js";
// import { AppSensorWebsocketExecClient } from "../../../execution-modes/appsensor-websocket/client/appsensor_websocket_client.js";

import * as readline from 'readline';

async function runTests(appSensorServer: AppSensorServer, 
                        appSensorClient: AppSensorClient, 
                        choice: string | null = null,
                        readInf: readline.Interface | null = null) {

    if (!choice) {
        console.log();
        console.log(" 1: DOPTests tests");
        console.log(" 2: MySQLStorageTests tests");
        console.log(" 3: AggregateEventAnalysisEngineIntegrationTest tests");

        let rl = readInf;
        if (!rl) {
            rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });
        }

        choice = await new Promise((resolve, reject) => {
            rl!.question("To run all tests press 'a', to execute specific test choose a number:", (choice: string) => {
                resolve(choice);
            });
        });
    }
    
    await testChoice(appSensorServer, appSensorClient, choice!);
}

async function testChoice(appSensorServer: AppSensorServer, 
                          appSensorClient: AppSensorClient, 
                          choice: string) {
    switch (choice) {
        case "1":  
        case "a": {
            await DOPTests.runTests(appSensorServer, appSensorClient);
            if (choice !== 'a') {
                break;
            }
        }
        case "2":  
        case "a": {
            await MySQLStorageTests.runTests(appSensorServer, appSensorClient);
            if (choice !== 'a') {
                break;
            }
        }
        case "3":  
        case "a": {
            await AggregateEventAnalysisEngineIntegrationTest.runTests(appSensorServer, appSensorClient);
            if (choice !== 'a') {
                break;
            }
        }
    }
}


async function runTestsExecModeLocal(testChoice: string | null = null, 
                                     readInf: readline.Interface | null = null) {
    console.log('----- Run MySQL Storage Tests Locall Execution -----');
    const appSensorLocal = new AppSensorLocal('',
                                                new MySQLAttackStore(),
                                                new MySQLEventStore(),
                                                new MySQLResponseStore());
    await runTests(appSensorLocal.getAppSensorServer(), 
                   appSensorLocal.getAppSensorClient(), 
                   testChoice,
                   readInf);

    await Logger.shutdownAsync();

    process.exit(0);
}

// async function runTestsExecModeWebSocket(readInf: readline.Interface | null = null) {
//     console.log('----- Run MySQL Storage Tests WebSocket Execution -----');
//     const appSensorWebSocketServer = 
//             new AppSensorWebsocketExecServer('', '', undefined,
//                                              new MySQLAttackStore(),
//                                              new MySQLEventStore(),
//                                              new MySQLResponseStore());
                                             
//     const appSensorWebSocketClient = new AppSensorWebsocketExecClient();

//     await appSensorWebSocketServer.startWebSocketServer();

//     await runTests(appSensorWebSocketServer.getAppSensorServer(), 
//                    appSensorWebSocketClient.getAppSensorClient(), 
//                    readInf);

//     await appSensorWebSocketClient.closeWebSocket();
//     await appSensorWebSocketServer.closeWebSocketServer();
// }

export {runTestsExecModeLocal} //,runTestsWebSocket}