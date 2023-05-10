import { ClientConfiguration, ClientConfigurationReader, ServerConnection } from "../../../core/configuration/client/client_configuration.js";
import { JSONConfigReadValidate, Utils } from '../../../utils/Utils.js';

class JSONClientConfiguration extends ClientConfiguration {
}

class JSONClientConfigurationReader extends JSONConfigReadValidate implements ClientConfigurationReader {

    private static configPrototypesSample: JSONClientConfiguration;

    static {
        JSONClientConfigurationReader.configPrototypesSample = new JSONClientConfiguration();

        JSONClientConfigurationReader.configPrototypesSample.setServerConnection(new ServerConnection());
    }

    constructor() {
        super('appsensor-client-config.json', 'appsensor-client-config_schema.json');
    }

    public override read(configurationLocation: string = '', validatorLocation: string | null = '', reload: boolean = false): ClientConfiguration | null {
        let config: JSONClientConfiguration | null = null;

        config = super.read(configurationLocation, validatorLocation, reload);

        if (config) {
            Utils.setPrototypeInDepth(config, JSONClientConfigurationReader.configPrototypesSample);
        }
        
        return config;
    }

}

export {JSONClientConfiguration, JSONClientConfigurationReader}