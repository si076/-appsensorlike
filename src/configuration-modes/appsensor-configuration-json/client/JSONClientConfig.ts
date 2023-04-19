import fs from 'fs';

import { ClientConfiguration, ClientConfigurationReader, ServerConnection } from "../../../core/configuration/client/client_configuration.js";
import { JSONConfigReadValidate } from '../../../utils/Utils.js';

class JSONClientConfiguration extends ClientConfiguration {
}

class JSONClientConfigurationReader extends JSONConfigReadValidate implements ClientConfigurationReader {

    private configFile: string = 'appsensor-client-config.json';
    private configSchemaFile: string = 'appsensor-client-config_schema.json'; 

    private static configPrototypesSample: JSONClientConfiguration;

    static {
        JSONClientConfigurationReader.configPrototypesSample = new JSONClientConfiguration();

        JSONClientConfigurationReader.configPrototypesSample.setServerConnection(new ServerConnection());
    }

    public override read(configurationLocation: string = '', validatorLocation: string | null = '', reload: boolean = false): ClientConfiguration | null {
        let config: JSONClientConfiguration | null = null;

        if (configurationLocation === '') {
            configurationLocation = this.configFile;
        };

        if (validatorLocation === '') {
            validatorLocation = this.configSchemaFile;
        };

        config = super.read(configurationLocation, validatorLocation, reload);

        if (config) {
            this.setPrototypeInDepth(config, JSONClientConfigurationReader.configPrototypesSample);
        }
        
        return config;
    }

}

export {JSONClientConfiguration, JSONClientConfigurationReader}