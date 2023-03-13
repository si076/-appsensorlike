import { DetectionPoint, User } from "../core.js";
import { Rule } from "../rule/rule.js";

class SearchCriteria {

	private user: User | null = null;

	private rule: Rule | null = null;

	private detectionPoint: DetectionPoint | null = null;

	private detectionSystemIds: string[] = [];

	private earliest: string = '';

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

	public getEarliest(): string {
		return this.earliest;
	}

	public getRule(): Rule | null {
		return this.rule;
	}

	public setRule(rule: Rule | null): SearchCriteria {
		this.rule = rule;
		return this.setEarliest(this.earliest, true);
	}

	public setEarliest(earliest: string, inclusive: boolean = true): SearchCriteria {
		if(inclusive) {
			this.earliest = earliest;
		} else {
            // add one second if exclusive
			this.earliest = new Date(Date.parse(earliest) + 1000).toISOString();
		}

		return this;
	}

}

export {SearchCriteria};