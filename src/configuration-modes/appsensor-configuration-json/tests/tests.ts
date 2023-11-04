import { Logger } from "../../../logging/logging.js";
import { JSONClientConfigurationTest } from "../client/tests/JSONClientConfigurationTest.js";
import { JSONServerConfigurationTest } from "../server/tests/JSONServerConfigurationTest.js";

function runTests() {
    Logger.getTestsLogger().info('----- Run configuration tests -----');
    JSONServerConfigurationTest.runTests();
    JSONClientConfigurationTest.runTests();
}

export {runTests};