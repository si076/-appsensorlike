import { AppSensorEvent, Attack, Response } from "../core.js";

interface EventManager {
	
	/**
	 * Add an {@link Event}.
	 * 
	 * @param event {@link Event} to add
	 */
	addEvent(event: AppSensorEvent): void;
	
	/**
	 * Add an {@link Attack}
	 * @param attack {@link Attack} to add
	 */
	addAttack(attack: Attack): void;

	/**
	 * Retrieve any {@link Response}s generated that apply to this 
	 * client since the last time the client called this method.
	 *  
	 * @return a Collection of {@link Response} objects 
	 */
	getResponses(earliest: Date): Response[];
}

export {EventManager};