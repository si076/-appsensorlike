import { AppSensorEvent, Attack, Response, Utils } from "../core.js";
import { SearchCriteria } from "../criteria/criteria.js";
import { AttackListener, EventListener, ResponseListener } from "../listener/listener.js";


/**
 * A store is an observable object.
 *
 * It is watched by implementations of the {@link AttackListener} interfaces.
 *
 * In this case the analysis engines watch the *Store interfaces of AppSensor.
 * 
 * In contrast to the ORIGINAL code here methods add/find/notify are asynchronous returning Promise<T>.
 */
 abstract class AttackStore {

	private listeners: AttackListener[] = [];

	/**
	 * Add an attack to the AttackStore
	 *
	 * @param attack the {@link Attack} object to add to the AttackStore
	 */
	public abstract addAttack(attack: Attack): Promise<void>;

	/**
	 * Finder for attacks in the AttackStore.
	 *
	 * @param criteria the {@link SearchCriteria} object to search by
	 * @return a Promise which resolves to {@link Attack}[] objects matching the search criteria.
	 */
	public abstract findAttacks(criteria: SearchCriteria): Promise<Attack[]>;


	/**
	 * Count how many attacks in the AttackStore match the search criteria.
	 * 
	 * ADDITION TO THE ORIGINAL CODE
	 * 
	 * @param criteria the {@link SearchCriteria} object to search by
	 * @return count of {@link Attack}s matching the search criteria.
	 */
	public abstract countAttacks(criteria: SearchCriteria): Promise<number>;

	/**
	 * Register an {@link AttackListener} to notify when Attacks are added
	 *
	 * @param listener the {@link AttackListener} to register
	 * @param atBeginning if the listener has to be added at the first position, i.e. to be notified first
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
	 * Notify each {@link AttackListener} of the specified Attack
	 *
	 * @param attack the {@link Attack} to notify each AttackListener about
	 */
	public async notifyListeners(attack: Attack) {
		for (const listener of this.listeners) {
			await listener.onAdd(attack);
		}
	}

	/**
	 * Set {@link AttackListener}s so they can be notified of changes.
	 *
	 * @param listeners of {@link AttackListener}s that are set to be listeners on the AttackStore
	 * @param atBeginning if the listener has to be added at the first position, i.e. to be notified first
	 */
	public setListeners(listeners: AttackListener[], atBeginning: boolean = false): void {
		for (const listener of listeners) {
			this.registerListener(listener, atBeginning);
		}
	}

	/**
	 * Finder for attacks in the AttackStore.
	 * 
	 * @param criteria the {@link SearchCriteria} object to search by
	 * @param attacks the {@link Attack} objects to match on - supplied by subclasses
	 * @return Attack[] objects matching the search criteria.
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

	/**
	 * Count how many attacks in the AttackStore match the search criteria.
	 * 
	 * ADDITION TO THE ORIGINAL CODE
	 * 
	 * @param criteria the {@link SearchCriteria} object to search by
	 * @param attacks the {@link Attack} objects to match on - supplied by subclasses
	 * @return count of {@link Attack}s matching the search criteria.
	 */
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
	 * The code was moved to {@link Utils} in order the same logic to be
	 * utilized in other places as well
	 * 
	 * @param criteria the {@link SearchCriteria} object to search by
	 * @param attack the {@link Attack} object to match on
	 * @return true or false depending on the matching of the search criteria to the {@link Attack}
	 */
	protected isMatchingAttack(criteria: SearchCriteria, attack: Attack ): boolean {
		return Utils.isMatchingAttack(criteria, attack);
	}

}

/**
 * A store is an observable object.
 *
 * It is watched by implementations of the {@link EventListener} interfaces.
 *
 * In this case the analysis engines watch the *Store interfaces of AppSensor.
 * 
 * In contrast to the ORIGINAL code here methods add/find/notify are asynchronous returning Promise<T>.
 */
 abstract class EventStore {

	private listeners: EventListener[] = [];

	/**
	 * Add an {@link AppSensorEvent} to the EventStore
	 *
	 * @param event the {@link AppSensorEvent} to add to the EventStore
	 */
	public abstract addEvent(event: AppSensorEvent): Promise<void>;

	/**
	 * A finder for {@link AppSensorEvent} objects in the EventStore
	 *
	 * @param criteria the {@link SearchCriteria} object to search by
	 * @return a Promise which resolves to {@link AppSensorEvent}[] objects matching the search criteria.
	 */
	public abstract findEvents(criteria: SearchCriteria): Promise<AppSensorEvent[]>;


	/**
	 * Count how many events in the EventStore match the search criteria.
	 * 
	 * ADDITION TO THE ORIGINAL CODE
	 * 
	 * @param criteria the {@link SearchCriteria} object to search by
	 * @return count of {@link AppSensorEvent}s matching the search criteria.
	 */
	 public abstract countEvents(criteria: SearchCriteria): Promise<number>;

	/**
	 * Register an {@link EventListener} to notify when {@link AppSensorEvent}s are added
	 *
	 * @param listener the {@link EventListener} to register
	 * @param atBeginning if the listener has to be added at the first position, i.e. to be notified first
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
	 * Notify each {@link EventListener} of the specified {@link AppSensorEvent}
	 *
	 * @param event the {@link AppSensorEvent} to notify each {@link EventListener} about
	 */
	public async notifyListeners(event: AppSensorEvent) {
		for (const listener of this.listeners) {
			await listener.onAdd(event);
		}
	}

	/**
	 * Set {@link EventListener}s so they can be notified of changes.
	 *
	 * @param listeners of {@link EventListener}s that are set to be listeners on the EventStore
	 * @param atBeginning if the listener has to be added at the first position, i.e. to be notified first
	 */
	public setListeners(listeners: EventListener[], atBeginning: boolean = false) {
		for (const listener of listeners) {
			this.registerListener(listener, atBeginning);
		}
	}

	/**
	 * A finder for Event objects in the EventStore
	 *
	 * @param criteria the {@link SearchCriteria} object to search by
	 * @param events the {@link AppSensorEvent} objects to match on - supplied by subclasses
	 * @return AppSensorEvent[] objects matching the search criteria.
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
	 * Count how many events in the EventStore match the search criteria.
	 * 
	 * ADDITION TO THE ORIGINAL CODE
	 * 
	 * @param criteria the {@link SearchCriteria} object to search by
	 * @param events the {@link AppSensorEvent} objects to match on - supplied by subclasses
	 * @return count of {@link AppSensorEvent}s matching the search criteria.
	 */
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
	 * The code was moved to {@link Utils} in order the same logic to be
	 * utilized in other places as well
	 * 
	 * @param criteria the {@link SearchCriteria} object to search by
	 * @param event the {@link AppSensorEvent} object to match on
	 * @return true or false depending on the matching of the search criteria to the event
	 */
	protected isMatchingEvent(criteria: SearchCriteria, event: AppSensorEvent): boolean {
		return Utils.isMatchingEvent(criteria, event);
	}

}

/**
 * A store is an observable object. 
 * 
 * It is watched by implementations of the {@link ResponseListener} interfaces. 
 * 
 * In this case the analysis engines watch the *Store interfaces of AppSensor.
 * 
 * In contrast to the ORIGINAL code here methods add/find/notify are asynchronous returning Promise<T>.
 * 
 */
 abstract class ResponseStore {
	
	private listeners: ResponseListener[] = [];
	
	/**
	 * Add a response to the ResponseStore
	 * 
	 * @param response {@link Response} to add to the ResponseStore
	 */
	public abstract addResponse(response: Response): Promise<void>;
	

	/**
	 * Finder for responses in the ResponseStore
	 * 
	 * @param criteria the {@link SearchCriteria} object to search by
	 * @return a Promise which resolves to {@link Response}[] objects matching the search criteria.
	 */
	public abstract findResponses(criteria: SearchCriteria): Promise<Response[]>;
	

	/**
	 * Count how many responses in the ResponseStore match the search criteria.
	 * 
	 * ADDITION TO THE ORIGINAL CODE
	 * 
	 * @param criteria the {@link SearchCriteria} object to search by
	 * @return count of {@link Response}s matching the search criteria.
	 */
	 public abstract countResponses(criteria: SearchCriteria): Promise<number>;

	/**
	 * Finder for responses in the ResponseStore
	 * 
	 * @param criteria the {@link SearchCriteria} object to search by
	 * @return Response[] objects matching the search criteria.
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

	/**
	 * Count how many responses in the ResponseStore match the search criteria.
	 * 
	 * ADDITION TO THE ORIGINAL CODE
	 * 
	 * @param criteria the {@link SearchCriteria} object to search by
	 * @param responses the {@link Response} objects to match on - supplied by subclasses
	 * @return count of {@link Response}s matching the search criteria.
	 */
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
	 * Set {@link ResponseListener}s so they can be notified of changes.
	 *
	 * @param listeners of {@link ResponseListener}s that are set to be listeners on the ResponseStore
	 * @param atBeginning if the listener has to be added at the first position, i.e. to be notified first
	 */
	public setListeners(listeners: ResponseListener[], atBeginning: boolean = false): void {
		for (const listener of listeners) {
			this.registerListener(listener, atBeginning);	
		}
	}

	/**
	 * A finder for Response objects in the ResponseStore
	 *
	 * The code was moved to {@link Utils} in order the same logic to be
	 * utilized in other places as well
	 * 
	 * @param criteria the {@link SearchCriteria} object to search by
	 * @param response the {@link Response} object to match on
	 * @return true or false depending on the matching of the search criteria to the event
	 */
	 protected isMatchingResponse(criteria: SearchCriteria, response: Response): boolean {
		return Utils.isMatchingResponse(criteria, response);
	}

}

export {AttackStore, EventStore, ResponseStore};