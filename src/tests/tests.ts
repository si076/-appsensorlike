import { runTests as analysis_rules_tests} from "../analysis-engines/appsensor-analysis-rules/test/tests.js";
import { runTests as core_tests} from "../core/tests/tests.js";
import { runTests as appsensor_local_tests} from "../execution-modes/appsensor-local/tests/tests.js";

function runAllTests() {
    console.log('Run All Tests');
    core_tests();
    analysis_rules_tests();
    appsensor_local_tests();
}

runAllTests();