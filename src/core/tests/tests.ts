import { DetectionPointTest } from "./DetectionPointTests.js";
import { IPAddressTests } from "./IPAddressTests.js";

async function runTests() {
    console.log();
    console.log('----- Run core API tests -----');
    await IPAddressTests.runTests();
    DetectionPointTest.runTests();
}

export {runTests};