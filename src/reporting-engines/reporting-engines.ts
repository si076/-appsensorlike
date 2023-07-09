import { AppSensorEvent, Attack, Response } from "../core/core.js";
import { ReportingEngine } from "../core/reporting/reporting.js";

/**
 * Extension to the original code 
 */
interface ReportingEngineExt extends ReportingEngine {

	/**
	 * Find {@link AppSensorEvent}s starting from specified time (unix timestamp) matching label
	 * 
	 * Use this method instead of countEventsByLabel since detection point category is mandatory when creating DetectionPoint
	 * 
	 * @param earliest String representing start time to use to find {@link AppSensorEvent}s (RFC-3339)
	 * @param category String representing detection point category
	 * @param label String representing detection point label
	 * @return a Promise resolving to number of {@link AppSensorEvent}s from starting time matching label
	 * 
	 */
	 countEventsByCategoryLabel(earliest: string, category: string, label: string): Promise<number>;
	
	/**
	 * Find {@link Attack}s starting from specified time (unix timestamp) matching label
	 * 
	 * Use this method instead of countAttacksByLabel since detection point category is mandatory when creating DetectionPoint
	 * 
	 * @param earliest String representing start time to use to find {@link Attack}s (RFC-3339)
	 * @param category String representing detection point category
	 * @param label String representing detection point label
	 * @return a Promise resolving to number of {@link Attack}s from starting time matching label
	 * 
	 */
	countAttacksByCategoryLabel(earliest: string, category: string, label: string): Promise<number>;
	
	/**
	 * Find {@link Response}s starting from specified time (unix timestamp) matching label
	 * 
	 * Use this method instead of countResponsesByLabel since detection point category is mandatory when creating DetectionPoint
	 * 
	 * @param earliest String representing start time to use to find {@link Response}s (RFC-3339)
	 * @param category String representing detection point category
	 * @param label String representing detection point label
	 * @return a Promise resolving to number of {@link Response}s from starting time matching label
	 * 
	 */
	countResponsesByCategoryLabel(earliest: string, category: string, label: string): Promise<number>;

	/** 
	 * Subscribe for AppSensorEvent, Attack, Response bubbling from the server.
	 * @param listener a listener function 
	 */
	addOnAddListener(listener: (event: AppSensorEvent | Attack | Response) => void): void;

	/** 
	 * Unsubscribe for AppSensorEvent, Attack, Response bubbling from the server.
	 * @param listener a listener function
	 */
	removeOnAddListener(listener: (event: AppSensorEvent | Attack | Response) => void): void;
}


export {ReportingEngineExt};