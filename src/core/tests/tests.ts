import { DetectionPointTest } from "./DetectionPointTests.js";
import { IPAddressTests } from "./IPAddressTests.js";

function runTests() {
    IPAddressTests.runTests();
    DetectionPointTest.runTests();
}

runTests();