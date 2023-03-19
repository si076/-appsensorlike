import { Category, DetectionPoint, Interval } from "../../../core/core.js";
import { Clause, Expression, MonitorPoint, Notification } from "../../../core/rule/rule.js";
import { AggregateEventAnalysisEngine } from "../appsensor-analysis-rules.js";

import assert from 'assert';

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
        console.log('-> testOneValidClause');

		const clauses: Clause[] = [];
		clauses.push(CheckExpressionTest.clause1);

		const expression: Expression = new Expression(new Interval(), clauses);

		const sensors: Notification[] = [];
		sensors.push(new Notification(2, Interval.MINUTES, new Date(10), CheckExpressionTest.point1));

		assert.ok(CheckExpressionTest.engine.checkExpression(expression, sensors));

        console.log('<- testOneValidClause');
	}

	// @Test
	private static testTwoValidClause(): void {
        console.log('-> testTwoValidClause');

		const clauses: Clause[] = [];
		clauses.push(CheckExpressionTest.clause1);
		clauses.push(CheckExpressionTest.clause2);

		const expression: Expression = new Expression(new Interval(), clauses);

		const sensors: Notification[] = [];
		sensors.push(new Notification(2, Interval.MINUTES, new Date(10), CheckExpressionTest.point1));
		sensors.push(new Notification(2, Interval.MINUTES, new Date(10), CheckExpressionTest.point2));

		assert.ok(CheckExpressionTest.engine.checkExpression(expression, sensors));

        console.log('<- testTwoValidClause');
	}

	// @Test
	private static testOneValidOneInvalidClause(): void {
        console.log('-> testOneValidOneInvalidClause');

		const clauses: Clause[] = [];
		clauses.push(CheckExpressionTest.clause1);
		clauses.push(CheckExpressionTest.clause2);

		const expression: Expression = new Expression(new Interval(), clauses);

		const sensors: Notification[] = [];
		sensors.push(new Notification(2, Interval.MINUTES, new Date(10), CheckExpressionTest.point2));

		assert.ok(CheckExpressionTest.engine.checkExpression(expression, sensors));

        console.log('<- testOneValidOneInvalidClause');
	}

	// @Test
	private static testOneInvalidClause(): void {
        console.log('-> testOneInvalidClause');

		const clauses: Clause[] = [];
		clauses.push(CheckExpressionTest.clause1);

		const expression: Expression = new Expression(new Interval(), clauses);

		const sensors: Notification[] = [];

		assert.equal(CheckExpressionTest.engine.checkExpression(expression, sensors), false);

        console.log('<- testOneInvalidClause');
	}

    public static runTests() {
        console.log('Run CheckExpressionTest');
        CheckExpressionTest.testOneValidClause();
        CheckExpressionTest.testTwoValidClause();
        CheckExpressionTest.testOneValidOneInvalidClause();
        CheckExpressionTest.testOneInvalidClause();
    }

}

export {CheckExpressionTest};