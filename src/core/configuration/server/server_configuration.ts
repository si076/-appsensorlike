import { AppSensorEvent, ClientApplication, DetectionPoint, DetectionSystem, IEquals, Utils } from "../../core.js";
import { CorrelationSet } from "../../correlation/correlation.js";
import { Rule } from "../../rule/rule.js";

abstract class ServerConfiguration {

	private configurationFile: string = '';

	private rules: Rule[] = [];

	private detectionPoints: DetectionPoint[] = [];

	private correlationSets: CorrelationSet[] = [];

	private clientApplicationIdentificationHeaderName: string = '';

	private clientApplications: ClientApplication[] = [];

	private serverHostName: string = '';

	private serverPort: number = 0;

	private serverSocketTimeout: number = 0;

	private geolocateIpAddresses: boolean = false;

	private geolocationDatabasePath: string = '';

	//Change for adding new custom client specific detection points
	private customDetectionPoints: Map<string, DetectionPoint[]> = new Map<string, DetectionPoint[]>();

	private static clientApplicationCache: Map<string, ClientApplication> = new Map<string, ClientApplication>();


	public getCustomDetectionPoints(): Map<string, DetectionPoint[]> {
		return this.customDetectionPoints;
	}

	public setCustomDetectionPoints(customPoints: Map<string, DetectionPoint[]>): ServerConfiguration {
		this.customDetectionPoints = customPoints;
		return this;
	}

	public getConfigurationFile(): string {
		return this.configurationFile;
	}

	public setConfigurationFile(configurationFile: string): ServerConfiguration {
		this.configurationFile = configurationFile;
		return this;
	}

	public getRules(): Rule[] {
		return this.rules;
	}

	public setRules(rules: Rule[]): ServerConfiguration {
		this.rules = rules;
		return this;
	}

	public getDetectionPoints(): DetectionPoint[] {
		return this.detectionPoints;
	}

	public setDetectionPoints(detectionPoints: DetectionPoint[]): ServerConfiguration {
		this.detectionPoints = detectionPoints;
		return this;
	}

	public getCorrelationSets(): CorrelationSet[] {
		return this.correlationSets;
	}

	public setCorrelationSets(correlationSets: CorrelationSet[]): ServerConfiguration {
		this.correlationSets = correlationSets;
		return this;
	}

	public getClientApplicationIdentificationHeaderName(): string {
		return this.clientApplicationIdentificationHeaderName;
	}

	public setClientApplicationIdentificationHeaderName(
			clientApplicationIdentificationHeaderName: string): ServerConfiguration {
		this.clientApplicationIdentificationHeaderName = clientApplicationIdentificationHeaderName;
		return this;
	}

	public getClientApplications(): ClientApplication[] {
		return this.clientApplications;
	}

	public setClientApplications(clientApplications: ClientApplication[]): ServerConfiguration {
		this.clientApplications = clientApplications;
		return this;
	}

	public getServerHostName(): string {
		return this.serverHostName;
	}

	public setServerHostName(serverHostName: string): ServerConfiguration {
		this.serverHostName = serverHostName;

		return this;
	}

	public getServerPort(): number {
		return this.serverPort;
	}

	public setServerPort(serverPort: number): ServerConfiguration {
		this.serverPort = serverPort;

		return this;
	}

	public getServerSocketTimeout(): number {
		return this.serverSocketTimeout;
	}

	public setServerSocketTimeout(serverSocketTimeout: number): ServerConfiguration {
		this.serverSocketTimeout = serverSocketTimeout;

		return this;
	}

	public isGeolocateIpAddresses(): boolean {
		return this.geolocateIpAddresses;
	}

	public setGeolocateIpAddresses(geolocateIpAddresses: boolean): ServerConfiguration {
		this.geolocateIpAddresses = geolocateIpAddresses;

		return this;
	}

	public getGeolocationDatabasePath(): string {
		return this.geolocationDatabasePath;
	}

	public setGeolocationDatabasePath(geolocationDatabasePath: string): ServerConfiguration {
		this.geolocationDatabasePath = geolocationDatabasePath;

		return this;
	}

	/**
	 * Find related detection systems based on a given detection system.
	 * This simply means those systems that have been configured along with the
	 * specified system id as part of a correlation set.
	 *
	 * @param detectionSystemId system ID to evaluate and find correlated systems
	 * @return collection of strings representing correlation set, INCLUDING specified system ID
	 */
	public getRelatedDetectionSystems(detectionSystem: DetectionSystem | null): string[] {
		let relatedDetectionSystems: string[] = [];

		if (detectionSystem !== null) {
			relatedDetectionSystems.push(detectionSystem.getDetectionSystemId());

			if(this.correlationSets !== null) {
				for(const correlationSet of this.correlationSets) {
					if(correlationSet.getClientApplications() !== null) {
						if(correlationSet.getClientApplications().indexOf(detectionSystem.getDetectionSystemId()) > -1) {
							relatedDetectionSystems = relatedDetectionSystems.concat(correlationSet.getClientApplications());
						}
					}
				}
			}
		}

		return relatedDetectionSystems;
	}

	/**
	 * Locate matching detection points configuration from server-side config file.
	 *
	 * @param search detection point that has been added to the system
	 * @return DetectionPoint populated with configuration information from server-side config
	 */
	public findDetectionPoints(search: DetectionPoint | null, clientApplicationName: string | null = null): DetectionPoint[] {
		const matches: DetectionPoint[] = [];

		if (search !== null) {
			const customDetPoints: Map<string, DetectionPoint[]> = this.getCustomDetectionPoints();
			if(clientApplicationName !== null && customDetPoints.size > 0) {
	
				for (const customDetectionPoint of customDetPoints) {
	
					if (clientApplicationName === customDetectionPoint[0]) {
	
						for(const customPoint of customDetectionPoint[1])
						{
							if (customPoint.typeMatches(search)) {
								matches.push(customPoint);
							}
						}
					}
				}
			}
	
			for (const configuredDetectionPoint of this.getDetectionPoints()) {
				if (configuredDetectionPoint.typeMatches(search)) {
					matches.push(configuredDetectionPoint);
				}
			}
		}

		return matches;
	}

	/**
	 * Finds all {@link Rule}s that could have been triggered by the {@link Event}. A
	 * trigger {@link Event} must be the final {@link Event} so if the corresponding
	 * {@link MonitorPoint} is in the {@link Rule}'s final {@link Expression} it should
	 * be evaluated.
	 *
	 * @param triggerEvent the {@link Event} that triggered the {@link Rule}
	 * @return a list of {@link Rule}s applicable to triggerEvent
	 */
	public findRules(triggerEvent: AppSensorEvent): Rule[] {
		const matches: Rule[] = [];

		for (const rule of this.rules) {
            const detPoint = triggerEvent.getDetectionPoint();
			if (detPoint !== null && rule.checkLastExpressionForDetectionPoint(detPoint)) {
				matches.push(rule);
			}
		}

		return matches;
	}

	public findClientApplication(clientApplicationName: string): ClientApplication | undefined {
		let clientApplication: ClientApplication | undefined = undefined;

		clientApplication = ServerConfiguration.clientApplicationCache.get(clientApplicationName);

		if (clientApplication === undefined) {
			for (const configuredClientApplication of this.getClientApplications()) {
				if (configuredClientApplication.getName() === clientApplicationName) {
					clientApplication = configuredClientApplication;

					//cache
					ServerConfiguration.clientApplicationCache.set(clientApplicationName, clientApplication);

					break;
				}
			}
		}

		return clientApplication;
	}

	// @Override
	// public int hashCode() {
	// 	return new HashCodeBuilder(17,31).
	// 			append(detectionPoints).
	// 			append(correlationSets).
	// 			append(clientApplicationIdentificationHeaderName).
	// 			append(clientApplications).
	// 			append(serverHostName).
	// 			append(serverPort).
	// 			append(serverSocketTimeout).
	// 			append(geolocateIpAddresses).
	// 			append(geolocationDatabasePath).
	// 			toHashCode();
	// }

	// @Override
	public equals(obj: Object): boolean {
		if (this === obj)
			return true;
		if (obj === null)
			return false;
		if (this.constructor.name !== obj.constructor.name)
			return false;

		const other: ServerConfiguration = obj as ServerConfiguration;

		return Utils.equalsArrayEntitys(this.detectionPoints, other.getDetectionPoints()) &&
               Utils.equalsArrayEntitys(this.correlationSets, other.getCorrelationSets()) &&
			   this.clientApplicationIdentificationHeaderName === other.getClientApplicationIdentificationHeaderName() &&
               Utils.equalsArrayEntitys(this.clientApplications, other.getClientApplications()) &&
			   this.serverHostName === other.getServerHostName() &&
			   this.serverPort === other.getServerPort() &&
			   this.serverSocketTimeout === other.getServerSocketTimeout() &&
			   this.geolocateIpAddresses === other.isGeolocateIpAddresses() &&
			   this.geolocationDatabasePath === other.getGeolocationDatabasePath();
	}

	// @Override
	// public String toString() {
	// 	return new ToStringBuilder(this).
	// 		    append("detectionPoints", detectionPoints).
	// 		    append("correlationSets", correlationSets).
	// 		    append("clientApplicationIdentificationHeaderName", clientApplicationIdentificationHeaderName).
	// 		    append("clientApplications", clientApplications).
	// 		    append("serverHostName", serverHostName).
	// 		    append("serverPort", serverPort).
	// 		    append("serverSocketTimeout", serverSocketTimeout).
	// 		    append("geolocateIpAddresses", geolocateIpAddresses).
	// 		    append("geolocationDatabasePath", geolocationDatabasePath).
	// 		    toString();
	// }

}

interface ServerConfigurationReader {
	
	/**
	 * Read content using default locations
	 * @return populated configuration object
	 * @throws ConfigurationException
	 */
	read(): ServerConfiguration;
	
	/**
	 * 
	 * @param configurationLocation specify configuration location (ie. file location of XML file)
	 * @param validatorLocation specify validator location (ie. file location of XSD file)
	 * @return populated configuration object
	 * @throws ConfigurationException
	 */
	read(configurationLocation: string, validatorLocation: string): ServerConfiguration;
}

export {ServerConfiguration, ServerConfigurationReader};