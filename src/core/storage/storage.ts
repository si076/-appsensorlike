// @Qualifier
// @Retention(RUNTIME)
// @Target({TYPE, METHOD, FIELD, PARAMETER})

import { AppSensorEvent, Attack, DetectionPoint, Response, User } from "../core.js";
import { SearchCriteria } from "../criteria/criteria.js";
import { AttackListener, EventListener, ResponseListener } from "../listener/listener.js";
import { Rule } from "../rule/rule.js";

// @Inherited
interface AttackStoreListener {
}

// @Qualifier
// @Retention(RUNTIME)
// @Target({TYPE, METHOD, FIELD, PARAMETER})
// @Inherited
interface EventStoreListener {
}

// @Qualifier
// @Retention(RUNTIME)
// @Target({TYPE, METHOD, FIELD, PARAMETER})
// @Inherited
interface ResponseStoreListener {
}

abstract class AttackStore {

	private static listeners: AttackListener[] = [];

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

	/**
	 * Register an {@link AttackListener} to notify when {@link Attack}s are added
	 *
	 * @param listener the {@link AttackListener} to register
	 */
	public registerListener(listener: AttackListener): void {
		if (AttackStore.listeners.indexOf(listener) === -1) {
			let unique: boolean = true;

			for (const existing of AttackStore.listeners) {
				if (existing.constructor.name === listener.constructor.name) {
					unique = false;
					break;
				}
			}

			if (unique) {
				AttackStore.listeners.push(listener);
			}
		}
	}

	/**
	 * Notify each {@link AttackListener} of the specified {@link Attack}
	 *
	 * @param response the {@link Attack} to notify each {@link AttackListener} about
	 */
	public async notifyListeners(attack: Attack) {
		for (const listener of AttackStore.listeners) {
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
	// @Inject @AttackStoreListener
	public setListeners(listeners: AttackListener[]): void {
		if (listeners.length === 0) {
			//clear already added listeners since this field is static and registerListeners
			//check for class uniqueness
			//this is essential when executing analysis tests en mass
			AttackStore.listeners = [];
		}

		for (const listener of listeners) {
			this.registerListener(listener);
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

		// Collection<Attack> matches = new HashSet<Attack>();
		const matches: Attack[] = [];

		for (const attack of attacks) {

			if (this.isMatchingAttack(criteria, attack)) {
				matches.push(attack);
			}
		}

		return matches;
	}

	/**
	 * Finder for attacks in the AttackStore.
	 *
	 * @param criteria the {@link org.owasp.appsensor.core.criteria.SearchCriteria} object to search by
	 * @param attack the {@link Attack} object to match on
	 * @return true or false depending on the matching of the search criteria to the {@link Attack}
	 */
	protected isMatchingAttack(criteria: SearchCriteria, attack: Attack ): boolean {
		let match: boolean = false;

		const user: User | null = criteria.getUser();
		const detectionPoint: DetectionPoint | null = criteria.getDetectionPoint();
		const detectionSystemIds: string[] = criteria.getDetectionSystemIds();
		const earliest: Date | null = criteria.getEarliest();
		const rule: Rule | null = criteria.getRule();

		// check user match if user specified
		const userMatch: boolean = (user != null) ? user.equals(attack.getUser()) : true;

		//check detection system match if detection systems specified
		let detectionSystemMatch: boolean = true;
		const attDetSystemId = attack.getDetectionSystem();
		if (detectionSystemIds != null && detectionSystemIds.length > 0 && attDetSystemId !== null) {
			detectionSystemMatch = detectionSystemIds.indexOf(attDetSystemId.getDetectionSystemId()) > -1 ;
		}

		//check detection point match if detection point specified
		let detectionPointMatch: boolean = true;
		if (detectionPoint !== null) {
			const attDetoint = attack.getDetectionPoint();

			detectionPointMatch = (attDetoint !== null) ?
					detectionPoint.typeAndThresholdMatches(attDetoint) : false;
		}

		//check rule match if rule specified
		let ruleMatch: boolean = true;
		if (rule !== null) {
			const attRule = attack.getRule();
			ruleMatch = (attRule !== null) ? rule.guidMatches(attRule) : false;
		}

		let earliestMatch: boolean = true; 
		if (earliest !== null) {

			const attackTimestampMillis = attack.getTimestamp().getTime();
			const earliestMillis = earliest.getTime();

			earliestMatch = (earliestMillis < attackTimestampMillis || earliestMillis === attackTimestampMillis)
		}

		if (userMatch && detectionSystemMatch && detectionPointMatch && ruleMatch && earliestMatch) {
			match = true;
		}

		return match;
	}

}

abstract class EventStore {

	private static listeners: EventListener[] = [];

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

	/**
	 * Register an {@link EventListener} to notify when {@link Event}s are added
	 *
	 * @param listener the {@link EventListener} to register
	 */
	public registerListener(listener: EventListener): void {
		if (EventStore.listeners.indexOf(listener) === -1) {
			let unique: boolean = true;

			for (const existing of EventStore.listeners) {
				if (existing.constructor.name === listener.constructor.name) {
					unique = false;
					break;
				}
			}

			if (unique) {
				EventStore.listeners.push(listener);
			}
		}
	}

	/**
	 * Notify each {@link EventListener} of the specified {@link Event}
	 *
	 * @param response the {@link Event} to notify each {@link EventListener} about
	 */
	public async notifyListeners(event: AppSensorEvent) {
		for (const listener of EventStore.listeners) {
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
	// @Inject @EventStoreListener
	public setListeners(listeners: EventListener[]) {
		if (listeners.length === 0) {
			//clear already added listeners since this field is static and registerListeners
			//check for class uniqueness
			//this is essential when executing analysis tests en mass
			EventStore.listeners = [];
		}

		for (const listener of listeners) {
			this.registerListener(listener);
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

	/**
	 * A finder for Event objects in the EventStore
	 *
	 * @param criteria the {@link org.owasp.appsensor.core.criteria.SearchCriteria} object to search by
	 * @param event the {@link Event} object to match on
	 * @return true or false depending on the matching of the search criteria to the event
	 */
	protected isMatchingEvent(criteria: SearchCriteria, event: AppSensorEvent): boolean {
		let match: boolean = false;

		const user: User | null = criteria.getUser();
		const detectionPoint: DetectionPoint | null = criteria.getDetectionPoint();
		const detectionSystemIds: string[] = criteria.getDetectionSystemIds();
		const earliest: Date | null = criteria.getEarliest();
		const rule: Rule | null = criteria.getRule();

		// check user match if user specified
		const userMatch: boolean = (user != null) ? user.equals(event.getUser()) : true;

		//check detection system match if detection systems specified
		let detectionSystemMatch: boolean = true;
		const eventDetSystemId = event.getDetectionSystem();
		if (detectionSystemIds != null && detectionSystemIds.length > 0 && eventDetSystemId !== null) {
			detectionSystemMatch = detectionSystemIds.indexOf(eventDetSystemId.getDetectionSystemId()) > -1 ;
		}

		//check detection point match if detection point specified
		let detectionPointMatch: boolean = true;
		if (detectionPoint !== null) {
			const attDetoint = event.getDetectionPoint();

			detectionPointMatch = (attDetoint !== null) ?
					detectionPoint.typeAndThresholdMatches(attDetoint) : false;
		}

		// check rule match if rule specified
		let ruleMatch: boolean = true;
		if (rule !== null) {
			const detPoint = event.getDetectionPoint();
			ruleMatch = (detPoint !== null) ? rule.typeAndThresholdContainsDetectionPoint(detPoint) : false;
		}

		let earliestMatch: boolean = true; 
		if (earliest !== null) {

			const eventTimestampMillis = event.getTimestamp().getTime();
			const earliestMillis = earliest.getTime();

			earliestMatch =	(earliestMillis < eventTimestampMillis || earliestMillis === eventTimestampMillis)
		}
		
		if (userMatch && detectionSystemMatch && detectionPointMatch && ruleMatch && earliestMatch) {
			match = true;
		}

		return match;
	}

}

abstract class ResponseStore {
	
	private static listeners: ResponseListener[] = [];
	
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
		
		const user: User | null = criteria.getUser();
		const detectionSystemIds: string[] = criteria.getDetectionSystemIds();
		const earliest: Date | null = criteria.getEarliest();
		
		for (const response of responses) {
			// check user match if user specified
			const userMatch: boolean = (user != null) ? user.equals(response.getUser()) : true;

			//check detection system match if detection systems specified
			let detectionSystemMatch: boolean = true;
			const respDetSystemId = response.getDetectionSystem();
			if (detectionSystemIds && detectionSystemIds.length > 0 && 
				respDetSystemId) {
				detectionSystemMatch = detectionSystemIds.indexOf(respDetSystemId.getDetectionSystemId()) > -1 ;
			}
			
			const responseTimestamp = response.getTimestamp();

			let earliestMatch: boolean = true; 
			if (earliest !== null && responseTimestamp instanceof Date) {

				const responseTimestampMillis = responseTimestamp.getTime();
				const earliestMillis = earliest.getTime();

				earliestMatch =	(earliestMillis < responseTimestampMillis || earliestMillis === responseTimestampMillis)
			}
				
			if (userMatch && detectionSystemMatch && earliestMatch) {
				matches.push(response);
			}
		}
		
		return matches;
	}

	/**
	 * Register an {@link ResponseListener} to notify when {@link Response}s are added
	 * 
	 * @param listener the {@link ResponseListener} to register
	 */
	public registerListener(listener: ResponseListener) {
		if (ResponseStore.listeners.indexOf(listener) === -1) {
			let unique: boolean = true;
			
			for (const existing of ResponseStore.listeners) {
				if (existing.constructor.name === listener.constructor.name) {
					unique = false;
					break;
				}
			}
			
			if (unique) {
				ResponseStore.listeners.push(listener);
			}
		}
	}
	
	/**
	 * Notify each {@link ResponseListener} of the specified {@link Response}
	 * 
	 * @param response the {@link Response} to notify each {@link ResponseListener} about
	 */
	public async notifyListeners(response: Response) {
		for (const listener of ResponseStore.listeners) {
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
	// @Inject @ResponseStoreListener
	public setListeners(listeners: ResponseListener[]): void {
		if (listeners.length === 0) {
			//clear already added listeners since this field is static and registerListeners
			//check for class uniqueness
			//this is essential when executing analysis tests en mass
			ResponseStore.listeners = [];
		}
		for (const listener of listeners) {
			this.registerListener(listener);	
		}
	}

}

export {AttackStoreListener, AttackStore, EventStoreListener, EventStore, ResponseStoreListener, ResponseStore};