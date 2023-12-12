import * as readline from 'readline';
import util from 'util';

import { AppSensorClient, AppSensorServer } from '../../core/core.js';
import { Logger } from '../../logging/logging.js';
import { AggregateEventAnalysisEngineIntegrationTest } from './analysis/AggregateEventAnalysisEngineIntegrationTest.js';
import { MultipleDetectionPointsSameLabelEventAnalysisEngineTest } from './analysis/MultipleDetectionPointsSameLabelEventAnalysisEngineTest.js';
import { ReferenceStatisticalEventAnalysisEngineTest } from './analysis/ReferenceStatisticalEventAnalysisEngineTest.js';
import { SimpleAggregateEventAnalysisEngineTest } from './analysis/SimpleAggregateEventAnalysisEngineTest.js';


async function runTests(appSensorServer: AppSensorServer, 
                        appSensorClient: AppSensorClient, 
                        configLocation: string,
                        readInf: readline.Interface | null = null,
                        choice: string = 'a',
                        executionTimes: number = 1) {

    let rl = readInf;
    if (!rl) {
        rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }

    if (!choice) {
        console.log(" 1: MultipleDetectionPointsSameLabelEventAnalysisEngineTest tests");
        console.log(" 2: SimpleAggregateEventAnalysisEngineTest tests");
        console.log(" 3: ReferenceStatisticalEventAnalysisEngineTest tests");
        console.log(" 4: AggregateEventAnalysisEngineIntegrationTest tests");
        choice = await new Promise((resolve, reject) => {
            rl!.question("To run all tests press 'a', to execute specific test choose a number:", (choice: string) => {
                resolve(choice);
            });
        });

    }

    await testChoice(appSensorServer, appSensorClient, configLocation, rl, choice, executionTimes);
}

async function testChoice(appSensorServer: AppSensorServer, 
                          appSensorClient: AppSensorClient, 
                          configLocation: string,
                          readInf: readline.Interface,
                          choice: string,
                          executionTimes: number) {
    if (executionTimes === 0) {
        const execTimesStr: string = await new Promise((resolve, reject) => {
            readInf!.question("Execution times:", (choice: string) => {
                resolve(choice);
            });
        });
    
        executionTimes = Number.parseInt(execTimesStr);
    }
    
    const startInMillis = new Date().getTime();

    for (let i = 0; i < executionTimes; i++) {
        
        switch (choice) {
            case "1":  
            case "a": {
                await MultipleDetectionPointsSameLabelEventAnalysisEngineTest.runTests(appSensorServer, appSensorClient, configLocation);
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
            
        }

    }
    
    const endInMillis = new Date().getTime();
    const average = (endInMillis - startInMillis) / executionTimes;
    Logger.getTestsLogger().info('Average time for test exection:', average, ' in in milliseconds.');
}

function loggedUnexpectedErrors(expectedErrors: (Error | string)[]): boolean {
    let unexpectedErrorFound = false;

    const events = Logger.getRecordingErrorEvents();

    for (let i = 0; i < events.length; i++) {
        let writtenEventStr = util.format(...events[i].data);
        if (events[i].error) {
            writtenEventStr = events[i].error!.constructor.name + ': ' + events[i].error!.message;
        }
        // console.log(events[i].categoryName, writtenEventStr);

        let found = false;

        for (let j = 0; j < expectedErrors.length; j++) {
            let expErrorStr = util.format(...[expectedErrors[j]]);
            if (expectedErrors[j] instanceof Error) {
                expErrorStr = (expectedErrors[j] as Error).constructor.name + ': ' + (expectedErrors[j] as Error).message;
            }
            if (expErrorStr == writtenEventStr) {
                found = true;
                break;
            }
        }

        if (!found) {
            unexpectedErrorFound = true;
            const errorStr  = events[i].categoryName + ' - '  + writtenEventStr;
            Logger.getTestsLogger().error("Unexpected error:", errorStr);
        }
    };

    return unexpectedErrorFound;
}  

export {runTests, loggedUnexpectedErrors};