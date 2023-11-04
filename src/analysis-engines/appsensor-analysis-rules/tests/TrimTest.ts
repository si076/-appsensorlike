import { DetectionPoint, Category, Interval, INTERVAL_UNITS} from "../../../core/core.js";
import { MonitorPoint, Notification } from "../../../core/rule/rule.js";
import { AggregateEventAnalysisEngine } from "../appsensor-analysis-rules.js";

import assert from "assert";
import { Logger } from "../../../logging/logging.js";

class TrimTest {

	static engine: AggregateEventAnalysisEngine;
	static point1: MonitorPoint;
	static queue: Notification[];

	private static buildQueue(): Notification[] {
		const queue: Notification[] = [];

		queue.push(new Notification(2, INTERVAL_UNITS.MINUTES, new Date(10), TrimTest.point1));
		queue.push(new Notification(2, INTERVAL_UNITS.MINUTES, new Date(11), TrimTest.point1));
		queue.push(new Notification(2, INTERVAL_UNITS.MINUTES, new Date(12), TrimTest.point1));
		queue.push(new Notification(2, INTERVAL_UNITS.MINUTES, new Date(13), TrimTest.point1));
		queue.push(new Notification(2, INTERVAL_UNITS.MINUTES, new Date(14), TrimTest.point1));

		return queue;
	}

	// @BeforeClass
	static {
		TrimTest.engine = new AggregateEventAnalysisEngine();
		TrimTest.point1 = new MonitorPoint(new DetectionPoint(Category.INPUT_VALIDATION, "IE1"), "1");

        TrimTest.queue = TrimTest.buildQueue();
	}


	// @Test
	private static testTrimOne(): void {
        Logger.getTestsLogger().info('-> testTrimOne');

		const trimTime: Date = new Date(10);
		const lengthBefore: number = TrimTest.queue.length;

		TrimTest.engine.trim(TrimTest.queue, trimTime);

		assert.equal(lengthBefore - 1, TrimTest.queue.length);

		for (const ts of TrimTest.queue) {
			assert.ok(ts.getStartTime().getTime() > trimTime.getTime());
		}

        Logger.getTestsLogger().info('<- testTrimOne');
	}

	// @Test
	private static testTrimNone(): void {
        Logger.getTestsLogger().info('-> testTrimNone');

		const trimTime: Date = new Date(9);
		const lengthBefore: number = TrimTest.queue.length;

		TrimTest.engine.trim(TrimTest.queue, trimTime);

		assert.equal(lengthBefore, TrimTest.queue.length);

		for (const ts of TrimTest.queue) {
			assert.ok(ts.getStartTime().getTime() > trimTime.getTime());
		}

        Logger.getTestsLogger().info('<- testTrimNone');
	}

	// @Test
	private static testTrimAll(): void {
        Logger.getTestsLogger().info('-> testTrimAll');

		const trimTime: Date = new Date(14);

		TrimTest.engine.trim(TrimTest.queue, trimTime);

		assert.equal(0, TrimTest.queue.length);

		for (const ts of TrimTest.queue) {
			assert.ok(ts.getStartTime().getTime() > trimTime.getTime());
		}

        Logger.getTestsLogger().info('<- testTrimAll');
	}

    public static runTests() {
        Logger.getTestsLogger().info('----- Run TrimTest -----');
        
        TrimTest.testTrimOne();
        TrimTest.testTrimNone();
        TrimTest.testTrimAll();
    }
}

export {TrimTest};