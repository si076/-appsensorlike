import { AppSensorEvent, ClientApplication, DetectionPoint, DetectionSystem, IPAddress, IValidateInitialize, Utils } from "../../core.js";
import { CorrelationSet } from "../../correlation/correlation.js";
import { Rule } from "../../rule/rule.js";

interface IClient {
	clientName: string;
	detectionPoints: DetectionPoint[];
}

interface IDetectionPoints {
	clients?: IClient[]; 
	detectionPoints: DetectionPoint[];
} 

interface IServerConfiguration extends IValidateInitialize {

	configurationFile?: string;

	rules?: Rule[];

	detectionPoints: IDetectionPoints;

	correlationSets?: CorrelationSet[];

	clientApplicationIdentificationHeaderName?: string;

	clientApplications?: ClientApplication[];

	serverHostName?: string;

	serverPort?: number;

	serverSocketTimeout?: number;

	geolocateIpAddresses?: boolean;

	geolocationDatabasePath?: string;

}

abstract class ServerConfiguration implements IServerConfiguration {

	configurationFile: string | undefined;

	rules: Rule[] = [];

	detectionPoints: IDetectionPoints = {detectionPoints: []};

	correlationSets: CorrelationSet[] = [];

	clientApplicationIdentificationHeaderName: string = '';

	clientApplications: ClientApplication[] = [];

	serverHostName: string = '';

	serverPort: number = 0;

	serverSocketTimeout: number = 0;

	//Change for adding new custom client specific detection points
	customDetectionPoints: Map<string, DetectionPoint[]> = new Map<string, DetectionPoint[]>();

	static clientApplicationCache: Map<string, ClientApplication> = new Map<string, ClientApplication>();

	public checkValidInitialize(): void {
		//when loaded from a config file
		
		if (!this.rules) {
			this.rules = [];	
		}
		
		if (!this.correlationSets) {
			this.correlationSets = [];	
		}
		
		if (!this.clientApplications) {
			this.clientApplications = [];	
		}
	}

	public getCustomDetectionPoints(): Map<string, DetectionPoint[]> {
		return this.customDetectionPoints;
	}

	public setCustomDetectionPoints(customPoints: Map<string, DetectionPoint[]>): ServerConfiguration {
		this.customDetectionPoints = customPoints;
		return this;
	}

	public getConfigurationFile(): string | undefined {
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
		return this.detectionPoints.detectionPoints;
	}

	public setDetectionPoints(detectionPoints: DetectionPoint[]): ServerConfiguration {
		this.detectionPoints.detectionPoints = detectionPoints;
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
			if(clientApplicationName !== null && 
			   customDetPoints && customDetPoints.size > 0) {
	
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

		if (this.rules) {
			for (const rule of this.rules) {
				const detPoint = triggerEvent.getDetectionPoint();
				if (detPoint !== null && rule.checkLastExpressionForDetectionPoint(detPoint)) {
					matches.push(rule);
				}
			}
		}

		return matches;
	}

	public findClientApplication(clientApplicationNameOrIP: string | IPAddress): ClientApplication | undefined {
		let clientApplication: ClientApplication | undefined = undefined;

		const clientApplicationId = (clientApplicationNameOrIP instanceof IPAddress) ? clientApplicationNameOrIP.getAddress(): clientApplicationNameOrIP;

		clientApplication = ServerConfiguration.clientApplicationCache.get(clientApplicationId);

		if (!clientApplication && this.clientApplications) {
			for (const configuredClientApplication of this.clientApplications) {

				const configClientAppIPAddress = configuredClientApplication.getIPAddress();

				let found = false;
				if (typeof clientApplicationNameOrIP === 'string') {
					found = configuredClientApplication.getName() === clientApplicationNameOrIP;
				} else if (configClientAppIPAddress) {
					found = configClientAppIPAddress.equals(clientApplicationNameOrIP);
				}

				if (found) {
					clientApplication = configuredClientApplication;

					//cache
					ServerConfiguration.clientApplicationCache.set(clientApplicationId, clientApplication);

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

		return Utils.equalsArrayEntitys(this.detectionPoints.detectionPoints, other.getDetectionPoints()) &&
               Utils.equalsArrayEntitys(this.correlationSets, other.getCorrelationSets()) &&
			   this.clientApplicationIdentificationHeaderName === other.getClientApplicationIdentificationHeaderName() &&
               Utils.equalsArrayEntitys(this.clientApplications, other.getClientApplications()) &&
			   this.serverHostName === other.getServerHostName() &&
			   this.serverPort === other.getServerPort() &&
			   this.serverSocketTimeout === other.getServerSocketTimeout();
			//     &&
			//    this.geolocateIpAddresses === other.isGeolocateIpAddresses() &&
			//    this.geolocationDatabasePath === other.getGeolocationDatabasePath();
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
	read(): ServerConfiguration | null;
	
	/**
	 * 
	 * @param configurationLocation specify configuration location (ie. file location of XML file)
	 * @param validatorLocation specify validator location (ie. file location of XSD file)
	 * @return populated configuration object
	 * @throws ConfigurationException
	 */
	read(configurationLocation: string, validatorLocation: string | null, reload: boolean): ServerConfiguration | null;
}

export {IClient, IServerConfiguration, ServerConfiguration, ServerConfigurationReader};