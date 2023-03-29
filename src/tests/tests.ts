import { runTests as analysis_rules_tests} from "../analysis-engines/appsensor-analysis-rules/test/tests.js";
import { runTests as core_tests} from "../core/tests/tests.js";
import { runTests as appsensor_local_tests} from "../execution-modes/appsensor-local/tests/tests.js";
import { runTests as config_tests } from "../configuration-modes/appsensor-configuration-json/tests/tests.js";

import * as readline from 'readline';

async function runTests() {
    console.log('---------- Run Tests ----------');

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    if (process.argv.length > 2 && isValidChoice(process.argv[2])) {
        testChoice(process.argv[2], rl);
        return;
    }

    console.log(" 1: Core API tests");
    console.log(" 2: Configuration tests");
    console.log(" 3: Analysis rules tests");
    console.log(" 4: Appsensor local tests");
    const choice: string = await new Promise((resolve, reject) => {
        rl.question("To run all tests press 'a', to execute specific test choose a number:", (choice: string) => {
            resolve(choice);
        });
    });
    await testChoice(choice, rl);
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
            core_tests();
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
            await appsensor_local_tests();
            if (choice !== 'a') {
                break;
            }
        }
    }

    process.exit(0);
}



await runTests();