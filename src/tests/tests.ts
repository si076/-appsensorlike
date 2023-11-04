import { runTests as analysis_rules_tests } from "../analysis-engines/appsensor-analysis-rules/tests/tests.js";
import { runTests as core_tests } from "../core/tests/tests.js";
import { runTests as appsensor_local_tests } from "../execution-modes/appsensor-local/tests/tests.js";
import { runTests as config_tests } from "../configuration-modes/appsensor-configuration-json/tests/tests.js";
import { loggedUnexpectedErrors } from "../execution-modes/tests/tests.js";

import * as readline from 'readline';
import { Logger } from "../logging/logging.js";

async function runTests(choice: string | null = null) {
    Logger.getTestsLogger().info('---------- Run Core Tests ----------');

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    if (!choice) {
        console.log(" 1: Core API tests");
        console.log(" 2: Configuration tests");
        console.log(" 3: Analysis rules tests");
        console.log(" 4: Appsensor Local execution mode tests");
        choice = await new Promise((resolve, reject) => {
            rl.question("To run all tests press 'a', to execute specific test choose a number:", (choice: string) => {
                resolve(choice);
            });
        });
    }

    let exitCode = 0;

    try {
        await testChoice(choice!, rl);
    } catch (error) {
        exitCode = 1;
        Logger.getTestsLogger().error(error);
    }

    const expectedErrors = [new TypeError("event.getDetectionSystem is not a function"),
                            'ReferenceEventAnalysisEngine.analyze: Could not find detection point configured for this type: IE4'];
    if (loggedUnexpectedErrors(expectedErrors)) {
        exitCode = 1;
    }

    await Logger.shutdownAsync();
    
    process.exit(exitCode);

}

function isValidChoice(choice: string): boolean {
    let result = true;
    if (!(choice === 'a' || choice === 'A')) {
        const number = parseInt(choice);
        if (isNaN(number) || number < 1 || number > 4) {
            result = false;
        }
    }
    return result;
}

async function testChoice(choice: string, readInf: readline.Interface) {
    switch (choice) {
        case "1":  
        case "a": {
            await core_tests();
            if (choice !== 'a') {
                break;
            }
        }
        case "2":  
        case "a": {
            config_tests();
            if (choice !== 'a') {
                break;
            }
        }
        case "3":  
        case "a": {
            analysis_rules_tests();
            if (choice !== 'a') {
                break;
            }
        }
        case "4":  
        case "a": {
            await appsensor_local_tests(readInf);
            if (choice !== 'a') {
                break;
            }
        }
    }
}

export {runTests}