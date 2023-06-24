import { AppSensorEvent, Attack, Response } from "../core.js";

/**
 * The EventManager is the key interface that the {@link ClientApplication} accesses to 
 * interact with AppSensor.
 * 
 * In contrast to the ORIGINAL code here methods are asynchronous returning Promise<T>.
 */
 interface EventManager {
	
	/**
	 * Add an {@link AppSensorEvent}.
	 * 
	 * @param event {@link AppSensorEvent} to add
	 */
	addEvent(event: AppSensorEvent): Promise<void>;
	
	/**
	 * Add an {@link Attack}
	 * @param attack {@link Attack} to add
	 */
	addAttack(attack: Attack): Promise<void>;

	/**
	 * Retrieve any {@link Response}s generated that apply to this 
	 * client since the last time the client called this method.
	 *  
	 * @return a Collection of {@link Response} objects 
	 */
	getResponses(earliest: Date): Promise<Response[]>;
}

export {EventManager};