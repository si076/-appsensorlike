import * as readline from 'readline';

import { AppSensorClient, AppSensorServer } from '../../core/core.js';
import { AggregateEventAnalysisEngineIntegrationTest } from './analysis/AggregateEventAnalysisEngineIntegrationTest.js';
import { ErrorHandlingTest } from './analysis/ErrorHandlingTest.js';
import { MultipleDetectionPointsSameLabelEventAnalysisEngineTest } from './analysis/MultipleDetectionPointsSameLabelEventAnalysisEngineTest.js';
import { ReferenceStatisticalEventAnalysisEngineTest } from './analysis/ReferenceStatisticalEventAnalysisEngineTest.js';
import { SimpleAggregateEventAnalysisEngineTest } from './analysis/SimpleAggregateEventAnalysisEngineTest.js';

enum EXEC_MODE {
    EXEC_MODE_LOCAL     = "EXEC_MODE_LOCAL",
    EXEC_MODE_WEBSOCKET = "EXEC_MODE_WEBSOCKET",
    EXEC_MODE_REST      = "EXEC_MODE_REST"
}

async function runTests(appSensorServer: AppSensorServer, 
                        appSensorClient: AppSensorClient, 
                        readInf: readline.Interface | null = null,
                        execMode: EXEC_MODE = EXEC_MODE.EXEC_MODE_LOCAL) {

    let rl = readInf;
    if (!rl) {
        rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }

    console.log();
    console.log(" 1: MultipleDetectionPointsSameLabelEventAnalysisEngineTest tests");
    console.log(" 2: SimpleAggregateEventAnalysisEngineTest tests");
    console.log(" 3: ReferenceStatisticalEventAnalysisEngineTest tests");
    console.log(" 4: AggregateEventAnalysisEngineIntegrationTest tests");
    console.log(" 5: ErrorHandlingTest tests");
    const choice: string = await new Promise((resolve, reject) => {
        rl!.question("To run all tests press 'a', to execute specific test choose a number:", (choice: string) => {
            resolve(choice);
        });
    });
    await testChoice(appSensorServer, appSensorClient, choice, execMode);
}

async function testChoice(appSensorServer: AppSensorServer, 
                          appSensorClient: AppSensorClient, 
                          choice: string,
                          execMode: EXEC_MODE = EXEC_MODE.EXEC_MODE_LOCAL) {
    switch (choice) {
        case "1":  
        case "a": {
            await MultipleDetectionPointsSameLabelEventAnalysisEngineTest.runTests(appSensorServer, appSensorClient);
            if (choice !== 'a') {
                break;
            }
        }
        case "2":  
        case "a": {
            await SimpleAggregateEventAnalysisEngineTest.runTests(appSensorServer, appSensorClient);
            if (choice !== 'a') {
                break;
            }
        }
        case "3":  
        case "a": {
            await ReferenceStatisticalEventAnalysisEngineTest.runTests(appSensorServer, appSensorClient);
            if (choice !== 'a') {
                break;
            }
        }
        case "4":  
        case "a": {
            await AggregateEventAnalysisEngineIntegrationTest.runTests(appSensorServer, appSensorClient);
            if (choice !== 'a') {
                break;
            }
        }
        case "5":  
        case "a": {
            await ErrorHandlingTest.runTests(appSensorServer, appSensorClient, execMode);
            if (choice !== 'a') {
                break;
            }
        }
        
    }

}

export {runTests, EXEC_MODE};