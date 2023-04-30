import { AggregateEventAnalysisEngineIntegrationTest } from "./AggregateEventAnalysisEngineIntegrationTest.js";
import { DOPTests } from "./DOPTests.js";
import { MySQLStorageTests } from "./MySQLStorageTests.js";

async function runTests() {
    console.log('----- Run MySQL Storage Tests -----');
    await DOPTests.runTests();
    await MySQLStorageTests.runTests();
    await AggregateEventAnalysisEngineIntegrationTest.runTests();
}

export {runTests}