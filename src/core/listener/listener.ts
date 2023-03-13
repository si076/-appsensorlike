import { AppSensorEvent, Attack, Response } from "../core.js";

// @AttackStoreListener
interface AttackListener {
	
	/**
	 * Listener method to handle when a new 
	 * {@link Attack} is added to the {@link AttackStore}
	 * 
	 * @param attack {@link Attack} that is added to the {@link AttackStore}
	 */
	onAdd(attack: Attack): void;
	
}

// @EventStoreListener
interface EventListener {
	
	/**
	 * Listener method to handle when a new 
	 * {@link Event} is added to the {@link EventStore}
	 * 
	 * @param event {@link Event} that is added to the {@link EventStore}
	 */
	onAdd(event: AppSensorEvent): void;
}

// @ResponseStoreListener
interface ResponseListener {
	
	/**
	 * Listener method to handle when a new 
	 * {@link Response} is added to the {@link ResponseStore}
	 * 
	 * @param attack {@link Response} that is added to the {@link ResponseStore}
	 */
	onAdd(response: Response): void;
}

// @EventStoreListener
// @AttackStoreListener
// @ResponseStoreListener
interface SystemListener extends EventListener, AttackListener, ResponseListener {

    onAdd(event: AppSensorEvent | Attack | Response): void;
}

export {AttackListener, EventListener, ResponseListener, SystemListener};