import { AppSensorEvent, Attack, Response, Utils } from "../../core/core.js";
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
	public override async addAttack(attack: Attack): Promise<void> {
        let userName = Utils.getUserName(attack.getUser());;
        
		console.warn("Security attack " + attack.getName() + " triggered by user: " + userName);

		InMemoryAttackStore.attacks.push(attack);

		await super.notifyListeners(attack);
	}

	public clearAll(): void {
		InMemoryAttackStore.attacks = [];
	}

	/**
	 * {@inheritDoc}
	 */
	// @Override
	public override findAttacks(criteria: SearchCriteria): Promise<Attack[]> {
		return Promise.resolve(super._findAttacks(criteria, InMemoryAttackStore.attacks));
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
	public override async addEvent(event: AppSensorEvent): Promise<void> {
        const detPointLabel = Utils.getDetectionPointLabel(event.getDetectionPoint());

        const userName = Utils.getUserName(event.getUser());

		console.warn("Security event " + detPointLabel + " triggered by user: " + userName);
		
		InMemoryEventStore.events.push(event);
		
		await super.notifyListeners(event);
	}
	
	public clearAll(): void {
		InMemoryEventStore.events = [];
	}
	
	/**
	 * {@inheritDoc}
	 */
	// @Override
	public findEvents(criteria: SearchCriteria): Promise<AppSensorEvent[]> {
		return Promise.resolve(super._findEvents(criteria, InMemoryEventStore.events));
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
	public override async addResponse(response: Response): Promise<void> {
        let userName = Utils.getUserName(response.getUser());

		console.warn("Security response " + response.getAction() + " triggered for user: " + userName);

		InMemoryResponseStore.responses.push(response);
		
		await super.notifyListeners(response);
	}
	
	public clearAll(): void {
		InMemoryResponseStore.responses = [];
	}

	/**
	 * {@inheritDoc}
	 */
	// @Override
	public findResponses(criteria: SearchCriteria): Promise<Response[]> {
		return Promise.resolve(super._findResponses(criteria, InMemoryResponseStore.responses));
	}
	
}

export {InMemoryAttackStore, InMemoryEventStore, InMemoryResponseStore};