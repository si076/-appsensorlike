import { DetectionPoint, Interval, INTERVAL_UNITS, Threshold } from "../core.js";

import * as assert from 'assert';
import { Logger } from "../../logging/logging.js";

class DetectionPointTest {

	// @Test(expected=IllegalArgumentException.class)
	// public testTypeMatchesNull(): void {
	// 	const point1: DetectionPoint = new DetectionPoint();
	// 	point1.typeAndThresholdMatches(null);
	// }
	
	// public static testTypeMatchesEmptyDetectionPoints(): void {
	// 	const point1: DetectionPoint = new DetectionPoint();
	// 	const point2: DetectionPoint = new DetectionPoint();
		
	// 	assert.equal(point1.typeAndThresholdMatches(point2), true);
	// }
	
	public static testTypeMatchesFullMismatch(): void {
		const point1: DetectionPoint = new DetectionPoint("a", "a1", 
				new Threshold(5, new Interval(1, INTERVAL_UNITS.SECONDS)));
        const point2: DetectionPoint = new DetectionPoint("b", "b1", 
				new Threshold(5, new Interval(2, INTERVAL_UNITS.SECONDS)));
		
		assert.equal(point1.typeAndThresholdMatches(point2), false);
	}
	
	public static testTypeMatchesCategoryMismatch(): void {
		const point1: DetectionPoint = new DetectionPoint("a", "a1", 
				new Threshold(5, new Interval(1, INTERVAL_UNITS.SECONDS)));
        const point2: DetectionPoint = new DetectionPoint("a", "b1", 
				new Threshold(5, new Interval(2, INTERVAL_UNITS.SECONDS)));
		
		assert.equal(point1.typeAndThresholdMatches(point2), false);
	}
	
	public static testTypeMatchesLabelMismatch(): void {
		const point1: DetectionPoint = new DetectionPoint("a", "a1", 
				new Threshold(5, new Interval(1, INTERVAL_UNITS.SECONDS)));
        const point2: DetectionPoint = new DetectionPoint("b", "a1", 
				new Threshold(5, new Interval(2, INTERVAL_UNITS.SECONDS)));
		
		assert.equal(point1.typeAndThresholdMatches(point2), false);
	}
	
	public static testTypeMatchesThresholdMismatch(): void {
		const point1: DetectionPoint = new DetectionPoint("a", "a1", 
				new Threshold(5, new Interval(1, INTERVAL_UNITS.SECONDS)));
        const point2: DetectionPoint = new DetectionPoint("a", "a1", 
				new Threshold(5, new Interval(2, INTERVAL_UNITS.SECONDS)));
		
		assert.equal(point1.typeAndThresholdMatches(point2), false);
	}
	
	public static testTypeMatchesThresholdMatch(): void {
		const point1: DetectionPoint = new DetectionPoint("a", "a1", 
				new Threshold(5, new Interval(1, INTERVAL_UNITS.SECONDS)));
        const point2: DetectionPoint = new DetectionPoint("a", "a1", 
				new Threshold(5, new Interval(1, INTERVAL_UNITS.SECONDS)));
		
		assert.equal(point1.typeAndThresholdMatches(point2), true);
	}

    public static runTests() {
        Logger.getTestsLogger().info('-> Start of DetectionPointTest');

        // DetectionPointTest.testTypeMatchesEmptyDetectionPoints();
        DetectionPointTest.testTypeMatchesFullMismatch();
        DetectionPointTest.testTypeMatchesCategoryMismatch();
        DetectionPointTest.testTypeMatchesLabelMismatch();
        DetectionPointTest.testTypeMatchesThresholdMismatch();
        DetectionPointTest.testTypeMatchesThresholdMatch();
        
        Logger.getTestsLogger().info('<- End of DetectionPointTest');
    }
}

export {DetectionPointTest}