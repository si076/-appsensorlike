import { AppSensorLocal } from "../../../execution-modes/appsensor-local/appsensor_local.js";
import { AppSensorWebsocketExecClient, AppSensorWebsocketExecServer } from "../../../execution-modes/appsensor-websocket/appsensor_websocket.js";
import { MySQLAttackStore, MySQLEventStore, MySQLResponseStore } from "../appsensor-storage-mysql.js";
import { AggregateEventAnalysisEngineIntegrationTest } from "./AggregateEventAnalysisEngineIntegrationTest.js";
import { DOPTests } from "./DOPTests.js";
import { MySQLStorageTests } from "./MySQLStorageTests.js";

import * as readline from 'readline';
import { AppSensorClient, AppSensorServer } from "../../../core/core.js";

async function runTests(appSensorServer: AppSensorServer, 
                        appSensorClient: AppSensorClient, 
                        readInf: readline.Interface | null = null) {
    let rl = readInf;
    if (!rl) {
        rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }

    console.log();
    console.log(" 1: DOPTests tests");
    console.log(" 2: MySQLStorageTests tests");
    console.log(" 3: AggregateEventAnalysisEngineIntegrationTest tests");
    const choice: string = await new Promise((resolve, reject) => {
        rl!.question("To run all tests press 'a', to execute specific test choose a number:", (choice: string) => {
            resolve(choice);
        });
    });
    await testChoice(appSensorServer, appSensorClient, choice);
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


async function runTestsLocally(readInf: readline.Interface | null = null) {
    console.log('----- Run MySQL Storage Tests -----');
    const appSensorLocal = new AppSensorLocal('',
                                                new MySQLAttackStore(),
                                                new MySQLEventStore(),
                                                new MySQLResponseStore());
    await runTests(appSensorLocal.getAppSensorServer(), 
                   appSensorLocal.getAppSensorClient(), 
                   readInf);
}

async function runTestsWebSocket(readInf: readline.Interface | null = null) {
    console.log('----- Run MySQL Storage Tests -----');
    const appSensorWebSocketServer = 
            new AppSensorWebsocketExecServer('', '', undefined,
                                             new MySQLAttackStore(),
                                             new MySQLEventStore(),
                                             new MySQLResponseStore());
                                             
    const appSensorWebSocketClient = new AppSensorWebsocketExecClient();

    await runTests(appSensorWebSocketServer.getAppSensorServer(), 
                   appSensorWebSocketClient.getAppSensorClient(), 
                   readInf);

    appSensorWebSocketClient.closeWebSocket();
    appSensorWebSocketServer.closeWebSocketServer();
}

export {runTestsLocally, runTestsWebSocket}