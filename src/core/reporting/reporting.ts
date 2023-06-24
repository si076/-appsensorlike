import { AppSensorEvent, Attack, KeyValuePair, Response } from "../core.js";
import { SystemListener } from "../listener/listener.js";

/**
 * A reporting engine is an implementation of the observer pattern and 
 * extends the *Listener interfaces. 
 * 
 * In this case the reporting engines watch the *Store interfaces of AppSensor.
 * 
 * The reporting engines are meant to provide simple access to get notified 
 * when the different components are added to the *Store's for reporting.
 * 
 * In contrast to the ORIGINAL code here methods are asynchronous returning Promise<T>.
 */
 interface ReportingEngine extends SystemListener {

	/**
	 * Find {@link AppSensorEvent}s starting from specified time (unix timestamp)
	 * 
	 * @param earliest String representing start time to use to find {@link AppSensorEvent}s (RFC-3339)
	 * @return a Promise resolving to found {@link AppSensorEvent}s from starting time
	 */
	findEvents(earliest: string): Promise<AppSensorEvent[]>;
	
	/**
	 * Find {@link Attack}s starting from specified time (unix timestamp)
	 * 
	 * @param earliest String representing start time to use to find {@link Attack}s (RFC-3339)
	 * @return a Promise resolving to found {@link Attack}s from starting time
	 */
	findAttacks(earliest: string): Promise<Attack[]>;
	
	/**
	 * Find {@link Response}s starting from specified time (unix timestamp)
	 * 
	 * @param earliest String representing start time to use to find {@link Response}s (RFC-3339)
	 * @return a Promise resolving to found {@link Response}s from starting time
	 * 
	 */
	findResponses(earliest: string): Promise<Response[]>;
	
	/**
	 * Find {@link AppSensorEvent}s starting from specified time (unix timestamp)
	 * 
	 * @param earliest String representing start time to use to find {@link AppSensorEvent}s (RFC-3339)
	 * @return a Promise resolving to number of {@link AppSensorEvent}s from starting time
	 * 
	 */
	countEvents(earliest: string): Promise<number>;
	
	/**
	 * Find {@link Attack}s starting from specified time (unix timestamp)
	 * 
	 * @param earliest String representing start time to use to find {@link Attack}s (RFC-3339)
	 * @return a Promise resolving to number of {@link Attack}s from starting time
	 * 
	 */
	countAttacks(earliest: string): Promise<number>;
	
	/**
	 * Find {@link Response}s starting from specified time (unix timestamp)
	 * 
	 * @param earliest String representing start time to use to find {@link Response}s (RFC-3339)
	 * @return a Promise resolving to number of {@link Response}s from starting time
	 * 
	 */
	countResponses(earliest: string): Promise<number>;
	
	/**
	 * Find {@link AppSensorEvent}s starting from specified time (unix timestamp) matching label
	 * 
	 * @param earliest String representing start time to use to find {@link AppSensorEvent}s (RFC-3339)
	 * @param label String representing detection point label
	 * @return a Promise resolving to number of {@link AppSensorEvent}s from starting time matching label
	 * 
	 */
	countEventsByLabel(earliest: string, label: string): Promise<number>;
	
	/**
	 * Find {@link Attack}s starting from specified time (unix timestamp) matching label
	 * 
	 * @param earliest String representing start time to use to find {@link Attack}s (RFC-3339)
	 * @param label String representing detection point label
	 * @return a Promise resolving to number of {@link Attack}s from starting time matching label
	 * 
	 */
	countAttacksByLabel(earliest: string, label: string): Promise<number>;
	
	/**
	 * Find {@link Response}s starting from specified time (unix timestamp) matching label
	 * 
	 * @param earliest String representing start time to use to find {@link Response}s (RFC-3339)
	 * @param label String representing detection point label
	 * @return a Promise resolving to number of {@link Response}s from starting time matching label
	 * 
	 */
	countResponsesByLabel(earliest: string, label: string): Promise<number>;
	
	/**
	 * Find {@link AppSensorEvent}s starting from specified time (unix timestamp) matching user
	 * 
	 * @param earliest String representing start time to use to find {@link AppSensorEvent}s (RFC-3339)
	 * @param user String representing user
	 * @return a Promise resolving to number of {@link AppSensorEvent}s from starting time matching user
	 * 
	 */
	countEventsByUser(earliest: string, user: string): Promise<number>;
	
	/**
	 * Find {@link Attack}s starting from specified time (unix timestamp) matching user
	 * 
	 * @param earliest String representing start time to use to find {@link Attack}s (RFC-3339)
	 * @param user String representing user
	 * @return a Promise resolving to number of {@link Attack}s from starting time matching user
	 * 
	 */
	countAttacksByUser(earliest: string, user: string): Promise<number>;
	
	/**
	 * Find {@link Response}s starting from specified time (unix timestamp) matching user
	 * 
	 * @param earliest String representing start time to use to find {@link Response}s (RFC-3339)
	 * @param user String representing user
	 * @return a Promise resolving to number of {@link Response}s from starting time matching user
	 * 
	 */
	countResponsesByUser(earliest: string, user: string): Promise<number>;
	
	/**
	 * Return the {@link ServerConfiguration} as JSON
	 * 
	 * @return a Promise resolving to {@link ServerConfiguration} as JSON
	 * 
	 */
	getServerConfigurationAsJson(): Promise<string>;
	
	/**
	 * Return a base-64 encoded version of the appsensor-server-config.xml
	 * 
	 * @return a base-64 encoded version of the appsensor-server-config.xml
	 * 
	 */
	getBase64EncodedServerConfigurationFileContent(): KeyValuePair;
	
}

export {ReportingEngine};