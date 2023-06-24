import { IEquals } from "../core.js";

/**
 * The CorrelationSet represents a set of {@link ClientApplication}s that 
 * should be considered to share the same {@link User} base. 
 * 
 * For example if server1 and server2 are part of a correlation set, 
 * then client1/userA is considered the same {@link User} as client2/userA. 
 * 
 * This can be useful for simple tracking of {@link User} activity across multiple
 * {@link ClientApplication}s.
 */
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
	
}

export {CorrelationSet};