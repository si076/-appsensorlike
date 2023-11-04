import { ClientConfiguration, ClientConfigurationReader, ServerConnection } from "../../../core/configuration/client/client_configuration.js";
import { JSONConfigReadValidate, Utils } from '../../../utils/Utils.js';

class JSONClientConfiguration extends ClientConfiguration {
}

class JSONClientConfigurationReader extends JSONConfigReadValidate implements ClientConfigurationReader {

    private static configPrototypesSample: JSONClientConfiguration;

    public static DEFAULT_CONFIG_FILE        = 'appsensor-client-config.json';
    public static DEFAULT_CONFIG_SCHEMA_FILE = 'appsensor-client-config_schema.json';

    static {
        JSONClientConfigurationReader.configPrototypesSample = new JSONClientConfiguration();

        JSONClientConfigurationReader.configPrototypesSample.setServerConnection(new ServerConnection());
    }

    constructor(relativeTo: string = import.meta.url,
                configFile: string = JSONClientConfigurationReader.DEFAULT_CONFIG_FILE, 
                configSchemaFile: string | null = JSONClientConfigurationReader.DEFAULT_CONFIG_SCHEMA_FILE) {
        super(relativeTo, 
              configFile,
              configSchemaFile);
    }

    public override read(configurationLocation: string = '', 
                         validatorLocation: string | null = '', 
                         reload: boolean = false): ClientConfiguration | null {
        let config: JSONClientConfiguration | null = null;

        config = super.read(configurationLocation, validatorLocation, reload);

        if (config) {
            Utils.setPrototypeInDepth(config, JSONClientConfigurationReader.configPrototypesSample);
        }
        
        return config;
    }

}

export {JSONClientConfiguration, JSONClientConfigurationReader}