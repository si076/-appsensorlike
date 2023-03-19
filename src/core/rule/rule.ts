import {AppsensorEntity, Interval, Response, DetectionPoint, Utils} from '../core.js'

class Notification extends Interval {

	/** the start time of the interval */
	private startTime: Date  = new Date();

	/** the MonitorPoint that generated the Notification */
	private monitorPoint: DetectionPoint | null = null;

	public constructor(duration: number = 0, 
		               unit: string = Interval.MINUTES, 
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

	// public static Comparator<Notification> getStartTimeAscendingComparator() {
	// 	return new Comparator<Notification>() {
	// 		public int compare(Notification n1, Notification n2) {
	// 			if (n1.getStartTime().isBefore(n2.getStartTime())) {
	// 				return -1;
	// 			}
	// 			else if (n1.getStartTime().isAfter(n2.getStartTime())) {
	// 				return 1;
	// 			}
	// 			else {
	// 				return 0;
	// 			}
	// 		}
	// 	};
	// }
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

class MonitorPoint extends DetectionPoint {

	public constructor(detectionPoint: DetectionPoint, guid: string = '') {
		super(detectionPoint.getCategory(),
				detectionPoint.getLabel(),
				detectionPoint.getThreshold(),
				detectionPoint.getResponses(),
				guid);
	}
}

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

	// @Override
	// public String toString() {
	// 	return new ToStringBuilder(this).
	// 			   append("detectionPoints", monitorPoints).
	// 		       toString();
	// }
}

class Expression extends AppsensorEntity{

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

	// @Override
	// public String toString() {
	// 	return new ToStringBuilder(this).
	// 			   append("window", window).
	// 		       append("clauses", clauses).
	// 		       toString();
	// }
}

class Rule extends AppsensorEntity {

	/**
	 * Unique identifier
	 */
	// @Column
	private guid: string = '';

	/** An optional human-friendly name for the Rule */
	// @Column
	private name: string = '';

	/**
	 * The window is the time all {@link Expression}s must be triggered within.
	 * A Rule's window must be greater than or equal to the total of it's Expressions' windows.
	 */
	// @ManyToOne(cascade = CascadeType.ALL)
	// @JsonProperty("window")
	private window: Interval | null = null;

	/** The {@link Expression}s that build up a Rule
	 * 	The order of the list corresponds to the temporal order of the expressions.
	 */
	// @Transient
	// @JsonProperty("expressions")
	private expressions: Expression[] = [];

	/**
	 * Set of {@link Response}s associated with given Rule.
	 */
	// @Transient
	// @JsonProperty("responses")
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

	// @XmlTransient
	// @JsonProperty("window")
	public getWindow(): Interval | null {
		return this.window;
	}

	// @JsonProperty("window")
	public setWindow(window: Interval | null): Rule {
		this.window = window;
		return this;
	}

	// @XmlTransient
	// @JsonProperty("expressions")
	public getExpressions(): Expression[] {
		return this.expressions;
	}

	// @JsonProperty("expressions")
	public setExpressions(expression: Expression[]): Rule {
		this.expressions = expression;
		return this;
	}

	// @XmlTransient
	// @JsonProperty("responses")
	public getResponses(): Response[] {
		return this.responses;
	}

	// @JsonProperty("responses")
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

	// @Override
	// public String toString() {
	// 	return new ToStringBuilder(this).
	// 			   append("window", window).
	// 		       append("expressions", expressions).
	// 		       append("responses", responses).
	// 		       append("guid", guid).
	// 		       append("name", name).
	// 		       toString();
	// }
}

export {Rule, Expression, Clause, Notification, MonitorPoint};