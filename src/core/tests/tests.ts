import { Logger } from "../../logging/logging.js";
import { DetectionPointTest } from "./DetectionPointTests.js";
import { IPAddressTests } from "./IPAddressTests.js";

async function runTests() {
    Logger.getTestsLogger().info('----- Run core API tests -----');
    await IPAddressTests.runTests();
    DetectionPointTest.runTests();
}

export {runTests};