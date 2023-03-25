import { CheckClauseTest } from "./CheckClauseTest.js";
import { CheckExpressionTest } from "./CheckExpressionTest.js";
import { TrimTest } from "./TrimTest.js";

function runTests() {
    console.log();
    console.log('----- Run analysis rules tests -----');
    CheckClauseTest.runTests();
    CheckExpressionTest.runTests();
    TrimTest.runTests();
}

export {runTests};