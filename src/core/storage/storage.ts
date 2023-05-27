import { AppSensorEvent, Attack, DetectionPoint, Response, User, Utils } from "../core.js";
import { SearchCriteria } from "../criteria/criteria.js";
import { AttackListener, EventListener, ResponseListener } from "../listener/listener.js";
import { Rule } from "../rule/rule.js";

interface AttackStoreListener {
}

interface EventStoreListener {
}

interface ResponseStoreListener {
}

abstract class AttackStore {

	private listeners: AttackListener[] = [];

	/**
	 * Add an attack to the AttackStore
	 *
	 * @param attack the {@link org.owasp.appsensor.core.Attack} object to add to the AttackStore
	 */
	public abstract addAttack(attack: Attack): Promise<void>;

	/**
	 * Finder for attacks in the AttackStore.
	 *
	 * @param criteria the {@link org.owasp.appsensor.core.criteria.SearchCriteria} object to search by
	 * @return a {@link java.util.Collection} of {@link org.owasp.appsensor.core.Attack} objects matching the search criteria.
	 */
	public abstract findAttacks(criteria: SearchCriteria): Promise<Attack[]>;


	public abstract countAttacks(criteria: SearchCriteria): Promise<number>;

	/**
	 * Register an {@link AttackListener} to notify when {@link Attack}s are added
	 *
	 * @param listener the {@link AttackListener} to register
	 */
	public registerListener(listener: AttackListener, atBeginning: boolean = false): void {
		if (this.listeners.indexOf(listener) === -1) {
			let unique: boolean = true;

			for (const existing of this.listeners) {
				if (existing.constructor.name === listener.constructor.name) {
					unique = false;
					break;
				}
			}

			if (unique) {
				if (atBeginning) {
					this.listeners.splice(0, 0, listener);
				} else {
					this.listeners.push(listener);
				}
			}
		}
	}

	/**
	 * Notify each {@link AttackListener} of the specified {@link Attack}
	 *
	 * @param response the {@link Attack} to notify each {@link AttackListener} about
	 */
	public async notifyListeners(attack: Attack) {
		for (const listener of this.listeners) {
			await listener.onAdd(attack);
		}
	}

	/**
	 * Automatically inject any {@link AttackStoreListener}s, which are implementations of
	 * {@link AttackListener} so they can be notified of changes.
	 *
	 * @param collection of {@link AttackListener}s that are injected to be
	 * 			listeners on the {@link @AttackStore}
	 */
	public setListeners(listeners: AttackListener[], atBeginning: boolean = false): void {
		for (const listener of listeners) {
			this.registerListener(listener, atBeginning);
		}
	}

	/**
	 * Finder for attacks in the AttackStore.
	 *
	 * @param criteria the {@link org.owasp.appsensor.core.criteria.SearchCriteria} object to search by
	 * @param attacks the {@link Attack} objects to match on - supplied by subclasses
	 * @return a {@link java.util.Collection} of {@link org.owasp.appsensor.core.Attack} objects matching the search criteria.
	 */
	protected _findAttacks(criteria: SearchCriteria, attacks: Attack[]): Attack[] {
		if (criteria == null) {
			throw new Error("criteria must be non-null");
		}

		const matches: Attack[] = [];

		for (const attack of attacks) {

			if (this.isMatchingAttack(criteria, attack)) {
				matches.push(attack);
			}
		}

		return matches;
	}

	protected _countAttacks(criteria: SearchCriteria, attacks: Attack[]): number {
		if (criteria == null) {
			throw new Error("criteria must be non-null");
		}

		let counter = 0;

		for (const attack of attacks) {

			if (this.isMatchingAttack(criteria, attack)) {
				counter++;
			}
		}

		return counter;
	}


	/**
	 * Finder for attacks in the AttackStore.
	 *
	 * @param criteria the {@link org.owasp.appsensor.core.criteria.SearchCriteria} object to search by
	 * @param attack the {@link Attack} object to match on
	 * @return true or false depending on the matching of the search criteria to the {@link Attack}
	 */
	protected isMatchingAttack(criteria: SearchCriteria, attack: Attack ): boolean {
		// let match: boolean = false;

		// const user: User | null = criteria.getUser();
		// const detectionPoint: DetectionPoint | null = criteria.getDetectionPoint();
		// const detectionSystemIds: string[] = criteria.getDetectionSystemIds();
		// const earliest: Date | null = criteria.getEarliest();
		// const rule: Rule | null = criteria.getRule();

		// // check user match if user specified
		// const userMatch: boolean = (user != null) ? user.equals(attack.getUser()) : true;

		// //check detection system match if detection systems specified
		// let detectionSystemMatch: boolean = true;
		// const attDetSystemId = attack.getDetectionSystem();
		// if (detectionSystemIds != null && detectionSystemIds.length > 0 && attDetSystemId !== null) {
		// 	detectionSystemMatch = detectionSystemIds.indexOf(attDetSystemId.getDetectionSystemId()) > -1 ;
		// }

		// //check detection point match if detection point specified
		// let detectionPointMatch: boolean = true;
		// if (detectionPoint !== null) {
		// 	const attDetoint = attack.getDetectionPoint();

		// 	detectionPointMatch = (attDetoint !== null) ?
		// 			detectionPoint.typeAndThresholdMatches(attDetoint) : false;
		// }

		// //check rule match if rule specified
		// let ruleMatch: boolean = true;
		// if (rule !== null) {
		// 	const attRule = attack.getRule();
		// 	ruleMatch = (attRule !== null) ? rule.guidMatches(attRule) : false;
		// }

		// let earliestMatch: boolean = true; 
		// if (earliest !== null) {

		// 	const attackTimestampMillis = attack.getTimestamp().getTime();
		// 	const earliestMillis = earliest.getTime();

		// 	earliestMatch = (earliestMillis < attackTimestampMillis || earliestMillis === attackTimestampMillis)
		// }

		// if (userMatch && detectionSystemMatch && detectionPointMatch && ruleMatch && earliestMatch) {
		// 	match = true;
		// }

		// return match;
		return Utils.isMatchingAttack(criteria, attack);
	}

}

abstract class EventStore {

	private listeners: EventListener[] = [];

	/**
	 * Add an {@link org.owasp.appsensor.core.Event} to the EventStore
	 *
	 * @param event the {@link org.owasp.appsensor.core.Event} to add to the EventStore
	 */
	public abstract addEvent(event: AppSensorEvent): Promise<void>;

	/**
	 * A finder for Event objects in the EventStore
	 *
	 * @param criteria the {@link org.owasp.appsensor.core.criteria.SearchCriteria} object to search by
	 * @return a {@link java.util.Collection} of {@link org.owasp.appsensor.core.Event} objects matching the search criteria.
	 */
	public abstract findEvents(criteria: SearchCriteria): Promise<AppSensorEvent[]>;


	public abstract countEvents(criteria: SearchCriteria): Promise<number>;

	/**
	 * Register an {@link EventListener} to notify when {@link Event}s are added
	 *
	 * @param listener the {@link EventListener} to register
	 */
	public registerListener(listener: EventListener, atBeginning: boolean = false): void {
		if (this.listeners.indexOf(listener) === -1) {
			let unique: boolean = true;

			for (const existing of this.listeners) {
				if (existing.constructor.name === listener.constructor.name) {
					unique = false;
					break;
				}
			}

			if (unique) {
				if (atBeginning) {
					this.listeners.splice(0, 0, listener);
				} else {
					this.listeners.push(listener);
				}
			}
		}
	}

	/**
	 * Notify each {@link EventListener} of the specified {@link Event}
	 *
	 * @param response the {@link Event} to notify each {@link EventListener} about
	 */
	public async notifyListeners(event: AppSensorEvent) {
		for (const listener of this.listeners) {
			await listener.onAdd(event);
		}
	}

	/**
	 * Automatically inject any {@link EventStoreListener}s, which are implementations of
	 * {@link EventListener} so they can be notified of changes.
	 *
	 * @param collection of {@link EventListener}s that are injected to be
	 * 			listeners on the {@link @EventStore}
	 */
	public setListeners(listeners: EventListener[], atBeginning: boolean = false) {
		for (const listener of listeners) {
			this.registerListener(listener, atBeginning);
		}
	}

	/**
	 * A finder for Event objects in the EventStore
	 *
	 * @param criteria the {@link org.owasp.appsensor.core.criteria.SearchCriteria} object to search by
	 * @param events the {@link Event} objects to match on - supplied by subclasses
	 * @return a {@link java.util.Collection} of {@link org.owasp.appsensor.core.Event} objects matching the search criteria.
	 */
	public _findEvents(criteria: SearchCriteria, events: AppSensorEvent[]): AppSensorEvent[] {
		if (criteria == null) {
			throw new Error("criteria must be non-null");
		}

		const matches: AppSensorEvent[] = [];

		for (const event of events) {
			if (this.isMatchingEvent(criteria, event)) {
				matches.push(event);
			}
		}

		return matches;
	}

	public _countEvents(criteria: SearchCriteria, events: AppSensorEvent[]): number {
		if (criteria == null) {
			throw new Error("criteria must be non-null");
		}

		let counter = 0;

		for (const event of events) {
			if (this.isMatchingEvent(criteria, event)) {
				counter++;
			}
		}

		return counter;
	}

	/**
	 * A finder for Event objects in the EventStore
	 *
	 * @param criteria the {@link org.owasp.appsensor.core.criteria.SearchCriteria} object to search by
	 * @param event the {@link Event} object to match on
	 * @return true or false depending on the matching of the search criteria to the event
	 */
	protected isMatchingEvent(criteria: SearchCriteria, event: AppSensorEvent): boolean {
		// let match: boolean = false;

		// const user: User | null = criteria.getUser();
		// const detectionPoint: DetectionPoint | null = criteria.getDetectionPoint();
		// const detectionSystemIds: string[] = criteria.getDetectionSystemIds();
		// const earliest: Date | null = criteria.getEarliest();
		// const rule: Rule | null = criteria.getRule();

		// // check user match if user specified
		// const userMatch: boolean = (user != null) ? user.equals(event.getUser()) : true;

		// //check detection system match if detection systems specified
		// let detectionSystemMatch: boolean = true;
		// const eventDetSystemId = event.getDetectionSystem();
		// if (detectionSystemIds != null && detectionSystemIds.length > 0 && eventDetSystemId !== null) {
		// 	detectionSystemMatch = detectionSystemIds.indexOf(eventDetSystemId.getDetectionSystemId()) > -1 ;
		// }

		// //check detection point match if detection point specified
		// let detectionPointMatch: boolean = true;
		// if (detectionPoint !== null) {
		// 	const attDetoint = event.getDetectionPoint();

		// 	detectionPointMatch = (attDetoint !== null) ?
		// 			detectionPoint.typeAndThresholdMatches(attDetoint) : false;
		// }

		// // check rule match if rule specified
		// let ruleMatch: boolean = true;
		// if (rule !== null) {
		// 	const detPoint = event.getDetectionPoint();
		// 	ruleMatch = (detPoint !== null) ? rule.typeAndThresholdContainsDetectionPoint(detPoint) : false;
		// }

		// let earliestMatch: boolean = true; 
		// if (earliest !== null) {

		// 	const eventTimestampMillis = event.getTimestamp().getTime();
		// 	const earliestMillis = earliest.getTime();

		// 	earliestMatch =	(earliestMillis < eventTimestampMillis || earliestMillis === eventTimestampMillis)
		// }
		
		// if (userMatch && detectionSystemMatch && detectionPointMatch && ruleMatch && earliestMatch) {
		// 	match = true;
		// }

		// return match;
		return Utils.isMatchingEvent(criteria, event);
	}

}

abstract class ResponseStore {
	
	private listeners: ResponseListener[] = [];
	
	/**
	 * Add a response to the ResponseStore
	 * 
	 * @param response {@link org.owasp.appsensor.core.Response} to add to the ResponseStore
	 */
	public abstract addResponse(response: Response): Promise<void>;
	

	/**
	 * Finder for responses in the ResponseStore
	 * 
	 * @param criteria the {@link org.owasp.appsensor.core.criteria.SearchCriteria} object to search by
	 * @return a {@link java.util.Collection} of {@link org.owasp.appsensor.core.Response} objects matching the search criteria.
	 */
	public abstract findResponses(criteria: SearchCriteria): Promise<Response[]>;
	

	public abstract countResponses(criteria: SearchCriteria): Promise<number>;

	/**
	 * Finder for responses in the ResponseStore
	 * 
	 * @param criteria the {@link org.owasp.appsensor.core.criteria.SearchCriteria} object to search by
	 * @return a {@link java.util.Collection} of {@link org.owasp.appsensor.core.Response} objects matching the search criteria.
	 */
	public _findResponses(criteria: SearchCriteria, responses: Response[]): Response[] {
		if (criteria == null) {
			throw new Error("criteria must be non-null");
		}
		
		const matches: Response[] = [];
		
		for (const response of responses) {
			if (this.isMatchingResponse(criteria, response)) {
				matches.push(response);
			}
		}
		
		return matches;
	}

	public _countResponses(criteria: SearchCriteria, responses: Response[]): number {
		if (criteria == null) {
			throw new Error("criteria must be non-null");
		}
		
		let counter = 0;
		
		for (const response of responses) {
			if (this.isMatchingResponse(criteria, response)) {
				counter++;
			}
		}
		
		return counter;
	}

	/**
	 * Register an {@link ResponseListener} to notify when {@link Response}s are added
	 * 
	 * @param listener the {@link ResponseListener} to register
	 */
	public registerListener(listener: ResponseListener, atBeginning: boolean = false) {
		if (this.listeners.indexOf(listener) === -1) {
			let unique: boolean = true;
			
			for (const existing of this.listeners) {
				if (existing.constructor.name === listener.constructor.name) {
					unique = false;
					break;
				}
			}
			
			if (unique) {
				if (atBeginning) {
					this.listeners.splice(0, 0, listener);
				} else {
					this.listeners.push(listener);
				}
			}
		}
	}
	
	/**
	 * Notify each {@link ResponseListener} of the specified {@link Response}
	 * 
	 * @param response the {@link Response} to notify each {@link ResponseListener} about
	 */
	public async notifyListeners(response: Response) {
		for (const listener of this.listeners) {
			await listener.onAdd(response);
		}
	}
	
	/**
	 * Automatically inject any {@link ResponseStoreListener}s, which are implementations of 
	 * {@link ResponseListener} so they can be notified of changes.
	 * 
	 * @param collection of {@link ResponseListener}s that are injected to be 
	 * 			listeners on the {@link ResponseStore}
	 */
	public setListeners(listeners: ResponseListener[], atBeginning: boolean = false): void {
		for (const listener of listeners) {
			this.registerListener(listener, atBeginning);	
		}
	}

	protected isMatchingResponse(criteria: SearchCriteria, response: Response): boolean {
		// let match: boolean = false;

		// const user: User | null = criteria.getUser();
		// const detectionSystemIds: string[] = criteria.getDetectionSystemIds();
		// const earliest: Date | null = criteria.getEarliest();

		// const detectionPoint: DetectionPoint | null = criteria.getDetectionPoint();
		// const rule: Rule | null = criteria.getRule();

		// // check user match if user specified
		// const userMatch: boolean = (user != null) ? user.equals(response.getUser()) : true;

		// //check detection system match if detection systems specified
		// let detectionSystemMatch: boolean = true;
		// const respDetSystemId = response.getDetectionSystem();
		// if (detectionSystemIds && detectionSystemIds.length > 0 && 
		// 	respDetSystemId) {
		// 	detectionSystemMatch = detectionSystemIds.indexOf(respDetSystemId.getDetectionSystemId()) > -1 ;
		// }
		
		// const responseTimestamp = response.getTimestamp();

		// let earliestMatch: boolean = true; 
		// if (earliest !== null && responseTimestamp instanceof Date) {

		// 	const responseTimestampMillis = responseTimestamp.getTime();
		// 	const earliestMillis = earliest.getTime();

		// 	earliestMatch =	(earliestMillis < responseTimestampMillis || earliestMillis === responseTimestampMillis)
		// }
			
		// //ADDITION TO THE ORIGINAL CODE TO TRACE WHAT CAUSED THIS RESPONSE
		// //ESSENTIAL FOR REPORTING
		// //check detection point match if detection point specified
		// let detectionPointMatch: boolean = true;
		// if (detectionPoint !== null) {
		// 	const attDetoint = response.getDetectionPoint();

		// 	detectionPointMatch = (attDetoint !== null) ?
		// 			detectionPoint.typeAndThresholdMatches(attDetoint) : false;
		// }

		// //ADDITION TO THE ORIGINAL CODE TO TRACE WHAT CAUSED THIS RESPONSE
		// //ESSENTIAL FOR REPORTING
		// //check rule match if rule specified
		// let ruleMatch: boolean = true;
		// if (rule !== null) {
		// 	const attRule = response.getRule();
		// 	ruleMatch = (attRule !== null) ? rule.guidMatches(attRule) : false;
		// }

		// if (userMatch && detectionSystemMatch && earliestMatch && detectionPointMatch && ruleMatch) {
		// 	match = true;
		// }

		// return match;
		return Utils.isMatchingResponse(criteria, response);
	}

}

export {AttackStoreListener, AttackStore, EventStoreListener, EventStore, ResponseStoreListener, ResponseStore};