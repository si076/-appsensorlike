import { Category, DetectionPoint, Interval, INTERVAL_UNITS } from "../../../core/core.js";
import { Clause, Expression, MonitorPoint, Notification } from "../../../core/rule/rule.js";
import { AggregateEventAnalysisEngine } from "../appsensor-analysis-rules.js";

import assert from 'assert';
import { Logger } from "../../../logging/logging.js";

class CheckExpressionTest {
	static engine: AggregateEventAnalysisEngine;
	static clause1: Clause;
    static clause2: Clause;
	static point1: MonitorPoint;
    static point2: MonitorPoint;

	private static buildClause(point: MonitorPoint): Clause {
		const points: DetectionPoint[] = [];
		points.push(point);

		return new Clause (points);
	}

	// @BeforeClass
	static  {
		CheckExpressionTest.engine = new AggregateEventAnalysisEngine();
		CheckExpressionTest.point1 = new MonitorPoint(new DetectionPoint(Category.INPUT_VALIDATION, "IE1"), "1");
		CheckExpressionTest.point2 = new MonitorPoint(new DetectionPoint(Category.INPUT_VALIDATION, "IE2"), "2");
        
		CheckExpressionTest.clause1 = CheckExpressionTest.buildClause(CheckExpressionTest.point1);
		CheckExpressionTest.clause2 = CheckExpressionTest.buildClause(CheckExpressionTest.point2);
	}

	// @Test
	private static testOneValidClause(): void {
        Logger.getTestsLogger().info('-> testOneValidClause');

		const clauses: Clause[] = [];
		clauses.push(CheckExpressionTest.clause1);

		const expression: Expression = new Expression(new Interval(), clauses);

		const sensors: Notification[] = [];
		sensors.push(new Notification(2, INTERVAL_UNITS.MINUTES, new Date(10), CheckExpressionTest.point1));

		assert.ok(CheckExpressionTest.engine.checkExpression(expression, sensors));

        Logger.getTestsLogger().info('<- testOneValidClause');
	}

	// @Test
	private static testTwoValidClause(): void {
        Logger.getTestsLogger().info('-> testTwoValidClause');

		const clauses: Clause[] = [];
		clauses.push(CheckExpressionTest.clause1);
		clauses.push(CheckExpressionTest.clause2);

		const expression: Expression = new Expression(new Interval(), clauses);

		const sensors: Notification[] = [];
		sensors.push(new Notification(2, INTERVAL_UNITS.MINUTES, new Date(10), CheckExpressionTest.point1));
		sensors.push(new Notification(2, INTERVAL_UNITS.MINUTES, new Date(10), CheckExpressionTest.point2));

		assert.ok(CheckExpressionTest.engine.checkExpression(expression, sensors));

        Logger.getTestsLogger().info('<- testTwoValidClause');
	}

	// @Test
	private static testOneValidOneInvalidClause(): void {
        Logger.getTestsLogger().info('-> testOneValidOneInvalidClause');

		const clauses: Clause[] = [];
		clauses.push(CheckExpressionTest.clause1);
		clauses.push(CheckExpressionTest.clause2);

		const expression: Expression = new Expression(new Interval(), clauses);

		const sensors: Notification[] = [];
		sensors.push(new Notification(2, INTERVAL_UNITS.MINUTES, new Date(10), CheckExpressionTest.point2));

		assert.ok(CheckExpressionTest.engine.checkExpression(expression, sensors));

        Logger.getTestsLogger().info('<- testOneValidOneInvalidClause');
	}

	// @Test
	private static testOneInvalidClause(): void {
        Logger.getTestsLogger().info('-> testOneInvalidClause');

		const clauses: Clause[] = [];
		clauses.push(CheckExpressionTest.clause1);

		const expression: Expression = new Expression(new Interval(), clauses);

		const sensors: Notification[] = [];

		assert.equal(CheckExpressionTest.engine.checkExpression(expression, sensors), false);

        Logger.getTestsLogger().info('<- testOneInvalidClause');
	}

    public static runTests() {
        Logger.getTestsLogger().info('----- Run CheckExpressionTest -----');
        CheckExpressionTest.testOneValidClause();
        CheckExpressionTest.testTwoValidClause();
        CheckExpressionTest.testOneValidOneInvalidClause();
        CheckExpressionTest.testOneInvalidClause();
    }

}

export {CheckExpressionTest};