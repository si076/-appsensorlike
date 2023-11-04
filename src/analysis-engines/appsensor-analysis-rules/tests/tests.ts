import { Logger } from "../../../logging/logging.js";
import { CheckClauseTest } from "./CheckClauseTest.js";
import { CheckExpressionTest } from "./CheckExpressionTest.js";
import { TrimTest } from "./TrimTest.js";

function runTests() {
    Logger.getTestsLogger().info('----- Run analysis rules tests -----');
    CheckClauseTest.runTests();
    CheckExpressionTest.runTests();
    TrimTest.runTests();
}

export {runTests};