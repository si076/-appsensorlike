import { AppSensorEvent, Attack, Response } from "../core.js";

/**
 * This interface is implemented by classes that want to be notified
 * when a new {@link Attack} is created and stored in the AppSensor system. 
 * 
 * In contrast to the ORIGINAL code here methods are asynchronous returning Promise<T>.
 */
 interface AttackListener {
	
	/**
	 * Listener method to handle when a new 
	 * {@link Attack} is added to the AttackStore
	 * 
	 * @param attack {@link Attack} that is added to the AttackStore
	 */
	onAdd(attack: Attack): Promise<void>;
	
}

/**
 * This interface is implemented by classes that want to be notified
 * when a new {@link AppSensorEvent} is created and stored in the AppSensor system. 
 * 
 * In contrast to the ORIGINAL code here methods are asynchronous returning Promise<T>.
 */
 interface EventListener {
	
	/**
	 * Listener method to handle when a new 
	 * {@link AppSensorEvent} is added to the EventStore
	 * 
	 * @param event {@link AppSensorEvent} that is added to the EventStore
	 */
	onAdd(event: AppSensorEvent): Promise<void>;
}

/**
 * This interface is implemented by classes that want to be notified
 * when a new {@link Response} is created and stored in the AppSensor system. 
 * 
 * In contrast to the ORIGINAL code here methods are asynchronous returning Promise<T>.
 */
 interface ResponseListener {
	
	/**
	 * Listener method to handle when a new 
	 * {@link Response} is added to the ResponseStore
	 * 
	 * @param response {@link Response} that is added to the ResponseStore
	 */
	onAdd(response: Response): Promise<void>;
}

/**
 * This is a base class extended by classes that want to be notified
 * when a new {@link AppSensorEvent}, {@link Attack}, or {@link Response} is 
 * created and stored in the AppSensor system.
 * 
 * It is a convenience class that simplifies the notification mechanism, 
 * and will be used by classes such as emitters to external systems 
 * for integration.
 * 
 * In contrast to the ORIGINAL code here methods are asynchronous returning Promise<T>.
 */
 interface SystemListener extends EventListener, AttackListener, ResponseListener {

    onAdd(event: AppSensorEvent | Attack | Response): Promise<void>;
}

export {AttackListener, EventListener, ResponseListener, SystemListener};