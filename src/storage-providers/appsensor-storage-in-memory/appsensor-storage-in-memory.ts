import { AppSensorEvent, Attack, Response, Utils } from "../../core/core.js";
import { SearchCriteria } from "../../core/criteria/criteria.js";
import { AttackStore, EventStore, ResponseStore } from "../../core/storage/storage.js";
import { Logger } from "../../logging/logging.js";

class InMemoryAttackStore extends AttackStore {

	/** maintain a collection of {@link Attack}s as an in-memory list */
	private static attacks: Attack[] = [];

	/**
	 * {@inheritDoc}
	 */
	public override async addAttack(attack: Attack): Promise<void> {
        let userName = Utils.getUserName(attack.getUser());;
        
		Logger.getServerLogger().warn("InMemoryAttackStore.addAttack: ", 
									  `Security attack ${attack.getName()} triggered by user: ${userName}`);

		InMemoryAttackStore.attacks.push(attack);

		await super.notifyListeners(attack);
	}

	public clearAll(): void {
		InMemoryAttackStore.attacks = [];
	}

	/**
	 * {@inheritDoc}
	 */
	public override findAttacks(criteria: SearchCriteria): Promise<Attack[]> {
		return Promise.resolve(super._findAttacks(criteria, InMemoryAttackStore.attacks));
	}

	public override countAttacks(criteria: SearchCriteria): Promise<number> {
		return Promise.resolve(super._countAttacks(criteria, InMemoryAttackStore.attacks));
	}
}

class InMemoryEventStore extends EventStore {
	
	/** maintain a collection of {@link Event}s as an in-memory list */
	private static events: AppSensorEvent[] = [];
	
	/**
	 * {@inheritDoc}
	 */
	public override async addEvent(event: AppSensorEvent): Promise<void> {
        const detPointLabel = Utils.getDetectionPointLabel(event.getDetectionPoint());

        const userName = Utils.getUserName(event.getUser());

		Logger.getServerLogger().warn("InMemoryEventStore.addEvent: ", 
									  `Security event ${detPointLabel} triggered by user: ${userName}`);
		
		InMemoryEventStore.events.push(event);
		
		await super.notifyListeners(event);
	}
	
	public clearAll(): void {
		InMemoryEventStore.events = [];
	}
	
	/**
	 * {@inheritDoc}
	 */
	public override findEvents(criteria: SearchCriteria): Promise<AppSensorEvent[]> {
		return Promise.resolve(super._findEvents(criteria, InMemoryEventStore.events));
	}
	
	public override countEvents(criteria: SearchCriteria): Promise<number> {
		return Promise.resolve(super._countEvents(criteria, InMemoryEventStore.events));
	}
}

class InMemoryResponseStore extends ResponseStore {

	/** maintain a collection of {@link Response}s as an in-memory list */
	private static responses: Response[] = [];
	
	/**
	 * {@inheritDoc}
	 */
	public override async addResponse(response: Response): Promise<void> {
        let userName = Utils.getUserName(response.getUser());

		Logger.getServerLogger().warn("InMemoryResponseStore.addResponse: ",
									  `Security response ${response.getAction()} triggered for user: ${userName}`);

		InMemoryResponseStore.responses.push(response);
		
		await super.notifyListeners(response);
	}
	
	public clearAll(): void {
		InMemoryResponseStore.responses = [];
	}

	/**
	 * {@inheritDoc}
	 */
	public override findResponses(criteria: SearchCriteria): Promise<Response[]> {
		return Promise.resolve(super._findResponses(criteria, InMemoryResponseStore.responses));
	}
	
	public override countResponses(criteria: SearchCriteria): Promise<number> {
		return Promise.resolve(super._countResponses(criteria, InMemoryResponseStore.responses));
	}
}

export {InMemoryAttackStore, InMemoryEventStore, InMemoryResponseStore};