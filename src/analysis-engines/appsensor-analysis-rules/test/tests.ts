import { CheckClauseTest } from "./CheckClauseTest.js";
import { CheckExpressionTest } from "./CheckExpressionTest.js";
import { TrimTest } from "./TrimTest.js";

function runTests() {
    CheckClauseTest.runTests();
    CheckExpressionTest.runTests();
    TrimTest.runTests();
}

export {runTests};