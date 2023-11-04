import { AggregateEventAnalysisEngine } from "../appsensor-analysis-rules.js";
import {MonitorPoint, Clause, Notification} from "../../../core/rule/rule.js"
import { Category, DetectionPoint, Interval, INTERVAL_UNITS } from "../../../core/core.js";

import assert from 'assert';
import { Logger } from "../../../logging/logging.js";

class CheckClauseTest {

    static engine: AggregateEventAnalysisEngine;
    static point1: MonitorPoint;
    static point2: MonitorPoint;
    static point3: MonitorPoint;

    // @BeforeClass
    static {
        CheckClauseTest.engine = new AggregateEventAnalysisEngine();
        CheckClauseTest.point1 = new MonitorPoint(new DetectionPoint(Category.INPUT_VALIDATION, "IE1"), "1");
        CheckClauseTest.point2 = new MonitorPoint(new DetectionPoint(Category.INPUT_VALIDATION, "IE2"), "2");
        CheckClauseTest.point3 = new MonitorPoint(new DetectionPoint(Category.INPUT_VALIDATION, "IE3"), "3");
    }

    // @Test
    private static testExactMatchOneDetectionPoint(): void {
        Logger.getTestsLogger().info('-> testExactMatchOneDetectionPoint');

        const points: DetectionPoint[] = [];
        points.push(CheckClauseTest.point1);
        const clause: Clause = new Clause(points);

        const sensors: Notification[] = [];
        sensors.push(new Notification(2, INTERVAL_UNITS.MINUTES, new Date(10), CheckClauseTest.point1));

        assert.ok(CheckClauseTest.engine.checkClause(clause, sensors));

        Logger.getTestsLogger().info('<- testExactMatchOneDetectionPoint');
    }

    // @Test
    private static testExactMatchTwoDetectionPoints(): void {
        Logger.getTestsLogger().info('-> testExactMatchTwoDetectionPoints');

        const points: DetectionPoint[] = [];
        points.push(CheckClauseTest.point1);
        points.push(CheckClauseTest.point2);
        const clause: Clause = new Clause(points);

        const sensors: Notification[] = [];
        sensors.push(new Notification(2, INTERVAL_UNITS.MINUTES, new Date(10), CheckClauseTest.point1));
        sensors.push(new Notification(3, INTERVAL_UNITS.MINUTES, new Date(10), CheckClauseTest.point2));

        assert.ok(CheckClauseTest.engine.checkClause(clause, sensors));

        Logger.getTestsLogger().info('<- testExactMatchTwoDetectionPoints');
    }

    // @Test
    private static testExtraDetectionPoints(): void {
        Logger.getTestsLogger().info('-> testExtraDetectionPoints');

        const points: DetectionPoint[] = [];
        points.push(CheckClauseTest.point1);
        const clause: Clause = new Clause(points);

        const sensors: Notification[] = [];
        sensors.push(new Notification(2, INTERVAL_UNITS.MINUTES, new Date(10), CheckClauseTest.point1));
        sensors.push(new Notification(3, INTERVAL_UNITS.MINUTES, new Date(10), CheckClauseTest.point2));

        assert.ok(CheckClauseTest.engine.checkClause(clause, sensors));

        Logger.getTestsLogger().info('<- testExtraDetectionPoints');
    }

    // @Test
    private static testNoDetectionPoints(): void {
        Logger.getTestsLogger().info('-> testNoDetectionPoints');

        const points: DetectionPoint[] = [];
        points.push(CheckClauseTest.point1);
        const clause: Clause = new Clause(points);

        const sensors: Notification[] = [];

        assert.equal(CheckClauseTest.engine.checkClause(clause, sensors), false);

        Logger.getTestsLogger().info('<- testNoDetectionPoints');
    }

    // @Test
    private static testMissingDetectionPoint(): void {
        Logger.getTestsLogger().info('-> testMissingDetectionPoint');

        const points: DetectionPoint[] = [];
        points.push(CheckClauseTest.point1);
        points.push(CheckClauseTest.point2);
        const clause: Clause = new Clause(points);

        const sensors: Notification[] = [];
        sensors.push(new Notification(2, INTERVAL_UNITS.MINUTES, new Date(10), CheckClauseTest.point1));

        assert.equal(CheckClauseTest.engine.checkClause(clause, sensors), false);

        Logger.getTestsLogger().info('<- testMissingDetectionPoint');
    }

    public static runTests() {
        Logger.getTestsLogger().info('----- Run CheckClauseTest -----');
        CheckClauseTest.testExactMatchOneDetectionPoint();
        CheckClauseTest.testExactMatchTwoDetectionPoints();
        CheckClauseTest.testExtraDetectionPoints();
        CheckClauseTest.testNoDetectionPoints();
        CheckClauseTest.testMissingDetectionPoint();
    }

}

export {CheckClauseTest};