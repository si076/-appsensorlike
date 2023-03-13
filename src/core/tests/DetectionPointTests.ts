import { DetectionPoint, Interval, Threshold } from "../core.js";

import * as assert from 'assert';

class DetectionPointTest {

	// @Test(expected=IllegalArgumentException.class)
	// public testTypeMatchesNull(): void {
	// 	const point1: DetectionPoint = new DetectionPoint();
	// 	point1.typeAndThresholdMatches(null);
	// }
	
	// @Test
	public static testTypeMatchesEmptyDetectionPoints(): void {
		const point1: DetectionPoint = new DetectionPoint();
		const point2: DetectionPoint = new DetectionPoint();
		
		assert.equal(point1.typeAndThresholdMatches(point2), true);
	}
	
	// @Test
	public static testTypeMatchesFullMismatch(): void {
		const point1: DetectionPoint = new DetectionPoint("a", "a1", 
				new Threshold(5, new Interval(1, Interval.SECONDS)));
        const point2: DetectionPoint = new DetectionPoint("b", "b1", 
				new Threshold(5, new Interval(2, Interval.SECONDS)));
		
		assert.equal(point1.typeAndThresholdMatches(point2), false);
	}
	
	// @Test
	public static testTypeMatchesCategoryMismatch(): void {
		const point1: DetectionPoint = new DetectionPoint("a", "a1", 
				new Threshold(5, new Interval(1, Interval.SECONDS)));
        const point2: DetectionPoint = new DetectionPoint("a", "b1", 
				new Threshold(5, new Interval(2, Interval.SECONDS)));
		
		assert.equal(point1.typeAndThresholdMatches(point2), false);
	}
	
	// @Test
	public static testTypeMatchesLabelMismatch(): void {
		const point1: DetectionPoint = new DetectionPoint("a", "a1", 
				new Threshold(5, new Interval(1, Interval.SECONDS)));
        const point2: DetectionPoint = new DetectionPoint("b", "a1", 
				new Threshold(5, new Interval(2, Interval.SECONDS)));
		
		assert.equal(point1.typeAndThresholdMatches(point2), false);
	}
	
	// @Test
	public static testTypeMatchesThresholdMismatch(): void {
		const point1: DetectionPoint = new DetectionPoint("a", "a1", 
				new Threshold(5, new Interval(1, Interval.SECONDS)));
        const point2: DetectionPoint = new DetectionPoint("a", "a1", 
				new Threshold(5, new Interval(2, Interval.SECONDS)));
		
		assert.equal(point1.typeAndThresholdMatches(point2), false);
	}
	
	// @Test
	public static testTypeMatchesThresholdMatch(): void {
		const point1: DetectionPoint = new DetectionPoint("a", "a1", 
				new Threshold(5, new Interval(1, Interval.SECONDS)));
        const point2: DetectionPoint = new DetectionPoint("a", "a1", 
				new Threshold(5, new Interval(1, Interval.SECONDS)));
		
		assert.equal(point1.typeAndThresholdMatches(point2), true);
	}

    public static runTests() {
        console.log('-> Start of DetectionPointTest');

        DetectionPointTest.testTypeMatchesEmptyDetectionPoints();
        DetectionPointTest.testTypeMatchesFullMismatch();
        DetectionPointTest.testTypeMatchesCategoryMismatch();
        DetectionPointTest.testTypeMatchesLabelMismatch();
        DetectionPointTest.testTypeMatchesThresholdMismatch();
        DetectionPointTest.testTypeMatchesThresholdMatch();
        
        console.log('<- End of DetectionPointTest');
    }
}

export {DetectionPointTest}