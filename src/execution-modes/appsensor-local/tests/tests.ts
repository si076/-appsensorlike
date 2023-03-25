import { AggregateEventAnalysisEngineIntegrationTest } from "./analysis/AggregateEventAnalysisEngineIntegrationTest.js";
import { ReferenceStatisticalEventAnalysisEngineTest } from "./analysis/ReferenceStatisticalEventAnalysisEngineTest.js";
import { SimpleAggregateEventAnalysisEngineTest } from "./analysis/SimpleAggregateEventAnalysisEngineTest.js";
import { MultipleDetectionPointsSameLabelEventAnalysisEngineTest } from "./analysis/MultipleDetectionPointsSameLabelEventAnalysisEngineTest.js";

import * as readline from 'readline';

async function runTests(readInf: readline.Interface | null = null) {

    let rl = readInf;
    if (!rl) {
        rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }

    console.log();
    console.log(" 1: SimpleAggregateEventAnalysisEngineTest tests");
    console.log(" 2: ReferenceStatisticalEventAnalysisEngineTest tests");
    console.log(" 3: AggregateEventAnalysisEngineIntegrationTest tests");
    console.log(" 4: MultipleDetectionPointsSameLabelEventAnalysisEngineTest tests")
    const choice: string = await new Promise((resolve, reject) => {
        rl!.question("To run all tests press 'a', to execute specific test choose a number:", (choice: string) => {
            resolve(choice);
        });
    });
    await testChoice(choice);
}

async function testChoice(choice: string) {
    switch (choice) {
        case "1":  
        case "a": {
            await SimpleAggregateEventAnalysisEngineTest.runTests();
            if (choice !== 'a') {
                break;
            }
        }
        case "2":  
        case "a": {
            await ReferenceStatisticalEventAnalysisEngineTest.runTests();
            if (choice !== 'a') {
                break;
            }
        }
        case "3":  
        case "a": {
            await AggregateEventAnalysisEngineIntegrationTest.runTests();
            if (choice !== 'a') {
                break;
            }
        }
        case "4":  
        case "a": {
            await MultipleDetectionPointsSameLabelEventAnalysisEngineTest.runTests();
            if (choice !== 'a') {
                break;
            }
        }
    }

    // process.exit(0);
}

export {runTests};