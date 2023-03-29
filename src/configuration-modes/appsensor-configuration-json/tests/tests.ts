import { JSONServerConfigurationTest } from "../server/tests/JSONServerConfigurationTest.js";

function runTests() {
    console.log();
    console.log('----- Run configuration tests -----');
    JSONServerConfigurationTest.runTests();
}

export {runTests};