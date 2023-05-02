import { AppSensorEvent, Attack, KeyValuePair, Response } from "../core.js";
import { SystemListener } from "../listener/listener.js";

interface ReportingEngine extends SystemListener {

	/**
	 * Find {@link Event}s starting from specified time (unix timestamp)
	 * 
	 * @param earliest String representing start time to use to find {@link Event}s (RFC-3339)
	 * @return Collection of {@link Event}s from starting time
	 * @throws NotAuthorizedException thrown if {@link ClientApplication} is not authorized for reporting
	 */
	findEvents(earliest: string): Promise<AppSensorEvent[]>;
	
	/**
	 * Find {@link Attack}s starting from specified time (unix timestamp)
	 * 
	 * @param earliest String representing start time to use to find {@link Attack}s (RFC-3339)
	 * @return Collection of {@link Attack}s from starting time
	 * @throws NotAuthorizedException thrown if {@link ClientApplication} is not authorized for reporting
	 */
	findAttacks(earliest: string): Promise<Attack[]>;
	
	/**
	 * Find {@link Response}s starting from specified time (unix timestamp)
	 * 
	 * @param earliest String representing start time to use to find {@link Response}s (RFC-3339)
	 * @return Collection of {@link Response}s from starting time
	 * @throws NotAuthorizedException thrown if {@link ClientApplication} is not authorized for reporting
	 */
	findResponses(earliest: string): Promise<Response[]>;
	
	/**
	 * Find {@link Event}s starting from specified time (unix timestamp)
	 * 
	 * @param earliest String representing start time to use to find {@link Event}s (RFC-3339)
	 * @return count of Collection of {@link Event}s from starting time
	 * @throws NotAuthorizedException thrown if {@link ClientApplication} is not authorized for reporting
	 */
	countEvents(earliest: string): Promise<number>;
	
	/**
	 * Find {@link Attack}s starting from specified time (unix timestamp)
	 * 
	 * @param earliest String representing start time to use to find {@link Attack}s (RFC-3339)
	 * @return count of Collection of {@link Attack}s from starting time
	 * @throws NotAuthorizedException thrown if {@link ClientApplication} is not authorized for reporting
	 */
	countAttacks(earliest: string): Promise<number>;
	
	/**
	 * Find {@link Response}s starting from specified time (unix timestamp)
	 * 
	 * @param earliest String representing start time to use to find {@link Response}s (RFC-3339)
	 * @return count of Collection of {@link Response}s from starting time
	 * @throws NotAuthorizedException thrown if {@link ClientApplication} is not authorized for reporting
	 */
	countResponses(earliest: string): Promise<number>;
	
	/**
	 * Find {@link Event}s starting from specified time (unix timestamp) matching label
	 * 
	 * @param earliest String representing start time to use to find {@link Event}s (RFC-3339)
	 * @param label String representing detection point label
	 * @return count of Collection of {@link Event}s from starting time matching label
	 * @throws NotAuthorizedException thrown if {@link ClientApplication} is not authorized for reporting
	 */
	countEventsByLabel(earliest: string, label: string): Promise<number>;
	
	/**
	 * Find {@link Attack}s starting from specified time (unix timestamp) matching label
	 * 
	 * @param earliest String representing start time to use to find {@link Event}s (RFC-3339)
	 * @param label String representing detection point label
	 * @return count of Collection of {@link Event}s from starting time matching label
	 * @throws NotAuthorizedException thrown if {@link ClientApplication} is not authorized for reporting
	 */
	countAttacksByLabel(earliest: string, label: string): Promise<number>;
	
	/**
	 * Find {@link Response}s starting from specified time (unix timestamp) matching label
	 * 
	 * @param earliest String representing start time to use to find {@link Event}s (RFC-3339)
	 * @param label String representing detection point label
	 * @return count of Collection of {@link Event}s from starting time matching label
	 * @throws NotAuthorizedException thrown if {@link ClientApplication} is not authorized for reporting
	 */
	countResponsesByLabel(earliest: string, label: string): Promise<number>;
	
	/**
	 * Find {@link Event}s starting from specified time (unix timestamp) matching user
	 * 
	 * @param earliest String representing start time to use to find {@link Event}s (RFC-3339)
	 * @param user String representing user
	 * @return count of Collection of {@link Event}s from starting time matching user
	 * @throws NotAuthorizedException thrown if {@link ClientApplication} is not authorized for reporting
	 */
	countEventsByUser(earliest: string, user: string): Promise<number>;
	
	/**
	 * Find {@link Attack}s starting from specified time (unix timestamp) matching user
	 * 
	 * @param earliest String representing start time to use to find {@link Event}s (RFC-3339)
	 * @param user String representing user
	 * @return count of Collection of {@link Event}s from starting time matching user
	 * @throws NotAuthorizedException thrown if {@link ClientApplication} is not authorized for reporting
	 */
	countAttacksByUser(earliest: string, user: string): Promise<number>;
	
	/**
	 * Find {@link Response}s starting from specified time (unix timestamp) matching user
	 * 
	 * @param earliest String representing start time to use to find {@link Event}s (RFC-3339)
	 * @param user String representing user
	 * @return count of Collection of {@link Event}s from starting time matching user
	 * @throws NotAuthorizedException thrown if {@link ClientApplication} is not authorized for reporting
	 */
	countResponsesByUser(earliest: string, user: string): Promise<number>;
	
	/**
	 * Return the {@link ServerConfiguration} as JSON
	 * 
	 * @return the {@link ServerConfiguration} as JSON
	 * @throws NotAuthorizedException thrown if {@link ClientApplication} is not authorized for reporting
	 */
	getServerConfigurationAsJson(): Promise<string>;
	
	/**
	 * Return a base-64 encoded version of the appsensor-server-config.xml
	 * 
	 * @return a base-64 encoded version of the appsensor-server-config.xml
	 * @throws NotAuthorizedException thrown if {@link ClientApplication} is not authorized for reporting
	 */
	getBase64EncodedServerConfigurationFileContent(): KeyValuePair;
	
}

export {ReportingEngine};