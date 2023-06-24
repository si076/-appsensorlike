import {AppsensorEntity, AppSensorEvent, Attack, Interval, Response, DetectionPoint, Utils, INTERVAL_UNITS, ObjectValidationError} from '../core.js'

/**
 * A Notification represents the {@link Interval} of time between a series
 * of {@link AppSensorEvent}s that trigger a {@link MonitorPoint}. 
 * Where a {@link DetectionPoint} generates an {@link Attack}, 
 *       a {@link MonitorPoint} generates a Notification.
 */
 class Notification extends Interval {

	/** the start time of the interval */
	private startTime: Date  = new Date();

	/** the MonitorPoint that generated the Notification */
	private monitorPoint: DetectionPoint | null = null;

	public constructor(duration: number = 0, 
		               unit: INTERVAL_UNITS = INTERVAL_UNITS.MINUTES, 
					   startTime: Date | null = null, 
		               monitorPoint: DetectionPoint | null = null) {
		super(duration, unit);
		this.setStartTime(startTime !== null ? startTime : new Date());
		this.setMonitorPoint(monitorPoint);
	}

	public getStartTime(): Date {
		return this.startTime;
	}

	public setStartTime(startTime: Date): void {
		this.startTime = startTime;
	}

	public getEndTime(): Date {
		return new Date(this.startTime.getTime() + super.toMillis());
	}

	public getMonitorPoint(): DetectionPoint | null {
		return this.monitorPoint;
	}

	public setMonitorPoint(monitorPoint: DetectionPoint | null): void {
		this.monitorPoint = monitorPoint;
	}

	public static getStartTimeAscendingComparator(n1: Notification, n2: Notification): number {
		if (n1 === null || n2 === null ) {
			throw new Error("n1 and n2 cannot be null");
		}

		const n1StartTime = n1.getStartTime();
		const n2StartTime = n2.getStartTime();

		if (n1StartTime.getTime() < n2StartTime.getTime()) {
			return -1;
		}
		else if (n1StartTime.getTime() > n2StartTime.getTime()) {
			return 1;
		}
		else {
			return 0;
		}
	}

	public static getEndTimeAscendingComparator(n1: Notification, n2: Notification): number {
		if (n1 === null || n2 === null ) {
			throw new Error("n1 and n2 cannot be null");
		}

		const n1EndTime = n1.getEndTime();
		const n2EndTime = n2.getEndTime();

		if (n1EndTime.getTime() < n2EndTime.getTime()) {
			return -1;
		}
		else if (n1EndTime.getTime() > n2EndTime.getTime()) {
			return 1;
		}
		else {
			return 0;
		}
	}
}

/**
 * A MonitorPoint is a {@link DetectionPoint} that does not generate attacks,
 * but is rather a component of a {@link Rule} which generates attacks.
 */
 class MonitorPoint extends DetectionPoint {
	
	public constructor(detectionPoint: DetectionPoint, guid: string = '') {
		super(detectionPoint.getCategory(),
			  (() => {
				//to satisfy TS
				const label = detectionPoint.getLabel();
				const id = detectionPoint.getId();
				return label !== undefined ? label : (id !== undefined ? id : '');

			  })(),
			  detectionPoint.getThreshold(),
			  detectionPoint.getResponses());
		this.guid = guid !== '' ? guid : detectionPoint.getGuid();
	}
}

/**
 * A Clause represents the terms in an {@link Expression} separated by an "OR" operator.
 * Each {@link MonitorPoint} in the monitorPoints field are the variables joined
 * by "AND" operators.
 *
 * For example:
 * 		In the expression: "MP1 AND MP2 OR MP3 AND MP4"
 *
 * 		"MP1 AND MP2" would be a single clause and "MP3 AND MP4" would be another.
 */
 class Clause  extends AppsensorEntity {

	/** The monitor points being checked as variables in an Expression */
	private monitorPoints: DetectionPoint[] = [];

	public constructor(monitorPoints: DetectionPoint[] = []) {
		super();
		this.setMonitorPoints(monitorPoints);
	}

	public getMonitorPoints(): DetectionPoint[] {
		return this.monitorPoints;
	}

	public setMonitorPoints(monitorPoints: DetectionPoint[]): Clause {
		this.monitorPoints = monitorPoints;
		return this;
	}

	public override equals(obj: Object | null): boolean {
		if (!super.equals(obj))
			return false;
		if (this === obj)
			return true;

		const other: Clause = obj as Clause;

		return Utils.equalsArrayEntitys(this.monitorPoints, other.getMonitorPoints());
	}

}

/**
 * An Expression is a logical boolean expression where the variables are {@link MonitorPoint}s.
 * Each Expression in a {@link Rule} is separated by the "THEN" operator.
 *
 * An Expression contains a set of {@link Clause}s. Only one {@link Clause} needs to evaluate to true
 * for an Expression to evaluate to true.
 *
 * For example:
 * 		In the Rule: "MP1 AND MP2 THEN MP3 OR mP4"
 *
 * 		"MP1 AND MP2" would be the first Expression with a single Clause
 * 		and "MP3 OR MP4" would a second Expression with two Clauses.
 */
 class Expression extends AppsensorEntity {

	/** The window of time a Clause must be triggered within */
	private window: Interval | null = null;

	/** The Clauses that build up the Expression. **/
	private clauses: Clause[] = [];

	public constructor(window: Interval | null = null, clauses: Clause[] = []) {
		super();
		this.setWindow(window);
		this.setClauses(clauses);
	}

	public getWindow(): Interval | null {
		return this.window;
	}

	public setWindow(window: Interval | null): Expression {
		this.window = window;
		return this;
	}

	public getClauses(): Clause[] {
		return this.clauses;
	}

	public setClauses(clauses: Clause[]): Expression {
		this.clauses = clauses;
		return this;
	}

	public getDetectionPoints(): DetectionPoint[] {
		const detectionPoints: DetectionPoint[] = [];

		for (const clause of this.clauses) {
			for (const detectionPoint of clause.getMonitorPoints()) {
				detectionPoints.push(detectionPoint);
			}
		}

		return detectionPoints;
	}

	public override equals(obj: Object | null): boolean {
		if (!super.equals(obj))
			return false;
		if (this === obj)
			return true;

		const other: Expression = obj as Expression;

		return Utils.equalsEntitys(this.window, other.getWindow()) &&
		       Utils.equalsArrayEntitys(this.clauses, other.getClauses());
	}

}

/**
 * A Rule defines a logical aggregation of {@link MonitorPoint}s to determine if an
 * {@link Attack} is occurring. A Rule uses the boolean operators "AND" and "OR" as well
 * as the temporal operator "THEN" in joining {@link MonitorPoint}s into a Rule.
 *
 * For example:
 * 		A rule could be as simple as: "MP1 AND MP2"
 * 		Where the Rule will generate an attack if both MonitorPoint 1 and 2
 * 		are violated within the Rule's window.
 *
 * 		More complex: "MP1 AND MP2 THEN MP3 OR MP4"
 *
 * 		Even more complex: "MP1 AND MP2 THEN MP3 OR MP4 THEN MP5 AND MP6 OR MP7"
 */
 class Rule extends AppsensorEntity {

	/**
	 * Unique identifier
	 */
	private guid: string = '';

	/** An optional human-friendly name for the Rule */
	private name: string = '';

	/**
	 * The window is the time all {@link Expression}s must be triggered within.
	 * A Rule's window must be greater than or equal to the total of it's Expressions' windows.
	 */
	private window: Interval | null = null;

	/** The {@link Expression}s that build up a Rule
	 * 	The order of the list corresponds to the temporal order of the expressions.
	 */
	private expressions: Expression[] = [];

	/**
	 * Set of {@link Response}s associated with given Rule.
	 */
	private responses: Response[] = [];

	public constructor(guid: string = '', 
	                   window: Interval | null = null, 
					   expressions: Expression[] = [], 
					   responses: Response[] = [], 
					   name: string = '') {
		super();
		this.setGuid(guid);
		this.setWindow(window);
		this.setExpressions(expressions);
		this.setResponses(responses);
		this.setName(name);
	}

	public getGuid(): string {
		return this.guid;
	}

	public setGuid(guid: string): Rule {
		this.guid = guid;
		return this;
	}

	public getName(): string {
		return this.name;
	}

	public setName(name: string): Rule {
		this.name = name;
		return this;
	}

	public getWindow(): Interval | null {
		return this.window;
	}

	public setWindow(window: Interval | null): Rule {
		this.window = window;
		return this;
	}

	public getExpressions(): Expression[] {
		return this.expressions;
	}

	public setExpressions(expression: Expression[]): Rule {
		this.expressions = expression;
		return this;
	}

	public getResponses(): Response[] {
		return this.responses;
	}

	public setResponses(responses: Response[]): Rule {
		this.responses = responses;
		return this;
	}

	/* returns the last expression in expressions */
	public getLastExpression(): Expression {
		return this.expressions[this.expressions.length - 1];
	}

	/* checks whether the last expression contains a DetectionPoint
	 * matching the type of triggerDetectionPoint */
	public checkLastExpressionForDetectionPoint (triggerDetectionPoint: DetectionPoint): boolean {
		for (const detectionPoint of this.getLastExpression().getDetectionPoints()) {
			if (detectionPoint.typeMatches(triggerDetectionPoint)) {
				return true;
			}
		}

		return false;
	}

	/* returns all DetectionPoints contained within the Rule as a set*/
	public getAllDetectionPoints (): DetectionPoint[] {
		const detectionPoints: DetectionPoint[] = [];

		for (const expression of this.expressions) {

			const expDetP: DetectionPoint[] = expression.getDetectionPoints();

			expDetP.forEach(el => {

				let found: boolean = false;

				for (let i = 0; i < detectionPoints.length; i++) {
					if (detectionPoints[i].equals(el)) {
						found = true;
						break;
					};
				}
	
				if (!found) {
					detectionPoints.push(el);
				}
			});
			
		}

		return detectionPoints;
	}

	/* checks whether the Rule contains a detection point of the same type and threshold
	 * as the detectionPoint parameter */
	public typeAndThresholdContainsDetectionPoint(detectionPoint: DetectionPoint): boolean {
		for (const myPoint of this.getAllDetectionPoints()) {
			if (detectionPoint.typeAndThresholdMatches(myPoint)) {
				return true;
			}
		}
		return false;
	}

	/* checks whether other rule has same guid, i.e. is the same rule */
	public guidMatches(other: Rule): boolean {
		if (other === null) {
			throw new Error("other must be non-null");
		}

		let matches: boolean = true;

		matches &&= (this.guid !== null) ? this.guid === other.getGuid() : true;

		return matches;
	}

	public override equals(obj: Object | null): boolean {
		if (!super.equals(obj))
			return false;
		if (this === obj)
			return true;

		const other: Rule = obj as Rule;

		return this.name === other.getName() &&
		       Utils.equalsEntitys(this.window, other.getWindow()) &&
			   Utils.equalsArrayEntitys(this.responses, other.getResponses()) &&
			   Utils.equalsArrayEntitys(this.expressions, other.getExpressions()) &&
			   this.guid === other.getGuid();
	}

	public override checkValidInitialize(): void {
		if (this.guid.trim().length === 0) {
			throw new ObjectValidationError('guid cannot be empty string!', this);
		}

		if (this.window) {
			this.window.checkValidInitialize();
		}
	}

}

export {Rule, Expression, Clause, Notification, MonitorPoint};