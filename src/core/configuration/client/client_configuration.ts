import { IEquals } from "../../core.js";

interface ClientConfigurationReader {
	
	/**
	 * Read content using default locations of: 
	 * 
	 * XML: /appsensor-client-config.xml
	 * XSD: /appsensor_client_config_2.0.xsd
	 * 
	 * @return populated configuration object
	 * @throws ConfigurationException
	 */
	read(): ClientConfiguration;
	
	/**
	 * 
	 * @param configurationLocation specify configuration location (ie. file location of XML file)
	 * @param validatorLocation specify validator location (ie. file location of XSD file)
	 * @return populated configuration object
	 * @throws ConfigurationException
	 */
	read(configurationLocation: string, validatorLocation: string): ClientConfiguration;
}

class ServerConnection implements IEquals {
	
	private static DEFAULT_HEADER_NAME = "X-Appsensor-Client-Application-Name";
	
	/** type of server connection: rest/soap */
	private type: string = '';
	
	/** The url to connect to  */
	private url: string = '';
	
	/** The client application identifier header name, optionally overridden */
	private clientApplicationIdentificationHeaderName: string = '';
	
	/** The client application identifier header value */
	private clientApplicationIdentificationHeaderValue: string = '';
	
	/** The port to connect to - optional and used only in certain protocols (ie. thrift) */
	private port: number = 0;
	
	/** The socket timeout for the connection (in milliseconds) - optional and used only in certain protocols (ie. thrift) */
	private socketTimeout: number = 0;
	
	public getType(): string {
		return this.type;
	}
	
	public setType(type: string): ServerConnection {
		this.type = type;
		return this;
	}
	
	public getUrl(): string {
		return this.url;
	}

	public setUrl(url: string): ServerConnection {
		this.url = url;
		
		return this;
	}
	
	public getClientApplicationIdentificationHeaderName(): string {
		return this.clientApplicationIdentificationHeaderName;
	}
	
	public getClientApplicationIdentificationHeaderNameOrDefault(): string {
		return (this.clientApplicationIdentificationHeaderName != null) ? 
                    this.clientApplicationIdentificationHeaderName : ServerConnection.DEFAULT_HEADER_NAME;
	}

	public setClientApplicationIdentificationHeaderName(
			clientApplicationIdentificationHeaderName: string): ServerConnection {
		this.clientApplicationIdentificationHeaderName = clientApplicationIdentificationHeaderName;
		
		return this;
	}

	public getClientApplicationIdentificationHeaderValue(): string {
		return this.clientApplicationIdentificationHeaderValue;
	}
	
	public setClientApplicationIdentificationHeaderValue(
			clientApplicationIdentificationHeaderValue: string): ServerConnection {
		this.clientApplicationIdentificationHeaderValue = clientApplicationIdentificationHeaderValue;
		
		return this;
	}
	
	public getPort(): number {
		return this.port;
	}

	public setPort(port: number): ServerConnection {
		this.port = port;
		
		return this;
	}

	public getSocketTimeout(): number {
		return this.socketTimeout;
	}

	public setSocketTimeout(socketTimeout: number): ServerConnection {
		this.socketTimeout = socketTimeout;
		
		return this;
	}

	// @Override
	// public int hashCode() {
	// 	return new HashCodeBuilder(17,31).
	// 			append(type).
	// 			append(url).
	// 			append(clientApplicationIdentificationHeaderName).
	// 			append(clientApplicationIdentificationHeaderValue).
	// 			append(port).
	// 			append(socketTimeout).
	// 			toHashCode();
	// }
	
	// @Override
	public equals(obj: Object | null): boolean {
		if (this === obj)
			return true;
		if (obj === null)
			return false;
		if (this.constructor.name !== obj.constructor.name)
			return false;
		
		const other: ServerConnection = obj as ServerConnection;
		
		return this.type === other.getType() &&
			   this.url === other.getUrl() &&
			   this.clientApplicationIdentificationHeaderName === other.getClientApplicationIdentificationHeaderName() &&
			   this.clientApplicationIdentificationHeaderValue === other.getClientApplicationIdentificationHeaderValue() &&
			   this.port === other.getPort() &&
			   this.socketTimeout === other.getSocketTimeout();
	}
	
	// @Override
	// public String toString() {
	// 	return new ToStringBuilder(this).
	// 			append("type", type).
	// 			append("url", url).
	// 			append("clientApplicationIdentificationHeaderName", clientApplicationIdentificationHeaderName).
	// 			append("clientApplicationIdentificationHeaderValue", clientApplicationIdentificationHeaderValue).
	// 			append("port", port).
	// 			append("socketTimeout", socketTimeout).
	// 		    toString();
	// }
	
}

class ClientConfiguration implements IEquals {

	private configurationFile: string = '';
	
	/** Server connection with configuration info for rest/soap connections */
	private serverConnection: ServerConnection | null = null;
	
	public getConfigurationFile(): string {
		return this.configurationFile;
	}

	public setConfigurationFile(configurationFile: string): ClientConfiguration {
		this.configurationFile = configurationFile;
		return this;
	}
	
	public getServerConnection(): ServerConnection | null {
		return this.serverConnection;
	}

	public setServerConnection(serverConnection: ServerConnection): ClientConfiguration {
		this.serverConnection = serverConnection;
		return this;
	}

	// @Override
	// public int hashCode() {
	// 	return new HashCodeBuilder(17,31).
	// 			append(serverConnection).
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
		
		const other: ClientConfiguration = obj as ClientConfiguration;
		
		return (this.serverConnection !== null) ? this.serverConnection.equals(other.getServerConnection()): false;
	}
	
	// @Override
	// public String toString() {
	// 	return new ToStringBuilder(this).
	// 			append("serverConnection", serverConnection).
	// 		    toString();
	// }

}

export {ClientConfiguration, ServerConnection, ClientConfigurationReader};