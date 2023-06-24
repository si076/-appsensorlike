import { DetectionPoint, User } from "../core.js";
import { Rule } from "../rule/rule.js";

/**
 * Search criteria, AppSensorEvents, Attacks and Responses, are searched according to in *Store. 
 */
class SearchCriteria {
	/** The User triggered AppSensorEvent(corresponding Attack / Response) */
	private user: User | null = null;
	/** Rule to match some properties on. Rule or DetectionPoint has to be specified in the criteria!*/
	private rule: Rule | null = null;
	/** DetectionPoint to match some properties on. Rule or DetectionPoint has to be specified in the criteria!*/
	private detectionPoint: DetectionPoint | null = null;
	/** Detection system ids*/
	private detectionSystemIds: string[] = [];

	/** The earliest time to start search for*/
	private earliest: Date | null = null;

	public getUser(): User | null {
		return this.user;
	}

	public setUser(user: User | null): SearchCriteria {
		this.user = user;

		return this;
	}

	public getDetectionPoint(): DetectionPoint | null {
		return this.detectionPoint;
	}

	public setDetectionPoint(detectionPoint: DetectionPoint | null): SearchCriteria {
		this.detectionPoint = detectionPoint;

		return this;
	}

	public getDetectionSystemIds(): string[] {
		return this.detectionSystemIds;
	}

	public setDetectionSystemIds(detectionSystemIds: string[]): SearchCriteria {
		this.detectionSystemIds = detectionSystemIds;

		return this;
	}

	public getEarliest(): Date | null {
		return this.earliest;
	}

	public getRule(): Rule | null {
		return this.rule;
	}

	public setRule(rule: Rule | null): SearchCriteria {
		this.rule = rule;
		return this.setEarliest(this.earliest, true);
	}

	public setEarliest(earliest: Date | null, inclusive: boolean = true): SearchCriteria {
		if(inclusive) {
			this.earliest = earliest;
		} else if (earliest !== null) {
            // add one second if exclusive
			this.earliest = new Date(earliest.getTime() + 1000);
		}

		return this;
	}

}

export {SearchCriteria};