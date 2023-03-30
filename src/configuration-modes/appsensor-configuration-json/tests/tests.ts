import { JSONClientConfigurationTest } from "../client/tests/JSONClientConfigurationTest.js";
import { JSONServerConfigurationTest } from "../server/tests/JSONServerConfigurationTest.js";

function runTests() {
    console.log();
    console.log('----- Run configuration tests -----');
    JSONServerConfigurationTest.runTests();
    JSONClientConfigurationTest.runTests();
}

export {runTests};