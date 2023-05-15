import { runTests as analysis_rules_tests} from "../analysis-engines/appsensor-analysis-rules/test/tests.js";
import { runTests as core_tests} from "../core/tests/tests.js";
import { runTests as appsensor_local_tests} from "../execution-modes/appsensor-local/tests/tests.js";
import { runTests as appsensor_websocket_tests} from "../execution-modes/appsensor-websocket/tests/tests.js";
import { runTests as config_tests } from "../configuration-modes/appsensor-configuration-json/tests/tests.js";
import { runTestsLocally as msql_storage_tests_locally, runTestsWebSocket as msql_storage_tests_websocket} from "../storage-providers/appsensor-storage-mysql/tests/tests.js"
import { runTests as reporting_websocket_tests } from "../reporting-engines/appsensor-reporting-websocket/tests/appsensor-reporting-websocket-tests.js"

import * as readline from 'readline';
import { IPAddressGeoLocationTest } from "../geolocators/fast-geoip/tests/IPAddressGeoLocationTest.js";
import { Logger } from "../logging/logging.js";

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
    console.log(" 4: Appsensor Local execution mode tests");
    console.log(" 5: Appsensor WebSocket execution mode tests");
    console.log(" 6: MySQL storage Local execution mode tests");
    console.log(" 7: MySQL storage WebSocket execution mode tests");
    console.log(" 8: Reporting WebSocket tests");
    console.log(" 9: IP address GeoLocation tests");
    const choice: string = await new Promise((resolve, reject) => {
        rl.question("To run all tests press 'a', to execute specific test choose a number:", (choice: string) => {
            resolve(choice);
        });
    });
    await testChoice(choice, rl);
    await Logger.shutdownAsync();

    process.exit(0);

}

function isValidChoice(choice: string): boolean {
    let result = true;
    if (!(choice === 'a' || choice === 'A')) {
        const number = parseInt(choice);
        if (isNaN(number) || number < 1 || number > 9) {
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
            await appsensor_local_tests(readInf);
            if (choice !== 'a') {
                break;
            }
        }
        case "5":  
        case "a": {
            await appsensor_websocket_tests(readInf);
            if (choice !== 'a') {
                break;
            }
        }
        case "6":  
        case "a": {
            await msql_storage_tests_locally(readInf);
            if (choice !== 'a') {
                break;
            }
        }
        case "7":  
        case "a": {
            await msql_storage_tests_websocket(readInf);
            if (choice !== 'a') {
                break;
            }
        }
        case "8":  
        case "a": {
            await reporting_websocket_tests();
            if (choice !== 'a') {
                break;
            }
        }
        case "9":  
        case "a": {
            await IPAddressGeoLocationTest.runTests();
            if (choice !== 'a') {
                break;
            }
        }
    }
}



await runTests();