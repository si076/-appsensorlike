import { IEquals } from "../core.js";

class CorrelationSet implements IEquals {

	/** {@link ClientApplication}s that are represented in this correlation set */
	private clientApplications: string[] = [];
	
	constructor(clientApplications: string[] = []) {
		this.clientApplications = clientApplications;
	}

	public getClientApplications(): string[] {
		return this.clientApplications;
	}

	public setClientApplications(clientApplications: string[]): CorrelationSet {
		this.clientApplications = clientApplications;
		return this;
	}

	// @Override
	// public int hashCode() {
	// 	return new HashCodeBuilder(17,31).
	// 			append(clientApplications).
	// 			toHashCode();
	// }
	
	// @Override
	public equals(obj: Object): boolean {
		if (this === obj)
			return true;
		if (obj === null)
			return false;
		if (this.constructor.name !== obj.constructor.name)
			return false;
		
		const other: CorrelationSet = obj as CorrelationSet;

		const clientAppArray = this.clientApplications;
        clientAppArray.sort();

        const otherClientAppArray = other.getClientApplications();
        otherClientAppArray.sort();

        if (clientAppArray.length === otherClientAppArray.length) {
            for (let i = 0; i < clientAppArray.length; i++) {
                if (clientAppArray[i] !== otherClientAppArray[i]) {
                    return false;
                }
            }
            return true;
        } else {
            return false;
        }

	}
	
	// @Override
	// public String toString() {
	// 	return new ToStringBuilder(this).
	// 		       append("clientApplications", clientApplications).
	// 		       toString();
	// }

}

export {CorrelationSet};