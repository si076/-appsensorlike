import { AppSensorEvent, Attack, Response } from "../../core/core.js";
import { SearchCriteria } from "../../core/criteria/criteria.js";
import { AttackStore, EventStore, ResponseStore } from "../../core/storage/storage.js";

class InMemoryAttackStore extends AttackStore {

	// private Logger logger;

	/** maintain a collection of {@link Attack}s as an in-memory list */
	private static attacks: Attack[] = [];

	/**
	 * {@inheritDoc}
	 */
	// @Override
	public override addAttack(attack: Attack): void {
        let userName = '';
        const user = attack.getUser();
        if (user) {
            userName = user.getUsername();
        }
        
		console.warn("Security attack " + attack.getName() + " triggered by user: " + userName);

		InMemoryAttackStore.attacks.push(attack);

		super.notifyListeners(attack);
	}

	public clearAll(): void {
		InMemoryAttackStore.attacks = [];
	}

	/**
	 * {@inheritDoc}
	 */
	// @Override
	public override findAttacks(criteria: SearchCriteria): Attack[] {
		return super._findAttacks(criteria, InMemoryAttackStore.attacks);
	}

}

class InMemoryEventStore extends EventStore {
	
	// private Logger logger;
	
	/** maintain a collection of {@link Event}s as an in-memory list */
	private static events: AppSensorEvent[] = [];
	
	/**
	 * {@inheritDoc}
	 */
	// @Override
	public override addEvent(event: AppSensorEvent): void {
        let detPointLabel = ''
        const eventDetPoint = event.getDetectionPoint();
        if (eventDetPoint) {
            detPointLabel = eventDetPoint.getLabel()
        }

        let userName = '';
        const user = event.getUser();
        if (user) {
            userName = user.getUsername();
        }

		console.warn("Security event " + detPointLabel + " triggered by user: " + userName);
		
		InMemoryEventStore.events.push(event);
		
		super.notifyListeners(event);
	}
	
	public clearAll(): void {
		InMemoryEventStore.events = [];
	}
	
	/**
	 * {@inheritDoc}
	 */
	// @Override
	public findEvents(criteria: SearchCriteria): AppSensorEvent[] {
		return super._findEvents(criteria, InMemoryEventStore.events);
	}
	
}

class InMemoryResponseStore extends ResponseStore {

	// private Logger logger;

	/** maintain a collection of {@link Response}s as an in-memory list */
	private static responses: Response[] = [];
	
	/**
	 * {@inheritDoc}
	 */
	// @Override
	public override addResponse(response: Response): void {
        let userName = '';
        const user = response.getUser();
        if (user) {
            userName = user.getUsername();
        }

		console.warn("Security response " + response.getAction() + " triggered for user: " + userName);

		InMemoryResponseStore.responses.push(response);
		
		super.notifyListeners(response);
	}
	
	/**
	 * {@inheritDoc}
	 */
	// @Override
	public findResponses(criteria: SearchCriteria): Response[] {
		return super._findResponses(criteria, InMemoryResponseStore.responses);
	}
	
}

export {InMemoryAttackStore, InMemoryEventStore, InMemoryResponseStore};