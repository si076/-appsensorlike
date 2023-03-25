import { DetectionPointTest } from "./DetectionPointTests.js";
import { IPAddressTests } from "./IPAddressTests.js";

function runTests() {
    console.log();
    console.log('----- Run core API tests -----');
    IPAddressTests.runTests();
    DetectionPointTest.runTests();
}

export {runTests};