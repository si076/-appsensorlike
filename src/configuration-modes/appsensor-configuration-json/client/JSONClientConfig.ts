import fs from 'fs';

import { ClientConfiguration, ClientConfigurationReader, ServerConnection } from "../../../core/configuration/client/client_configuration.js";
import { JSONConfig } from "../JSONConfig.js";

class JSONClientConfiguration extends ClientConfiguration {
}

class JSONClientConfigurationReader extends JSONConfig implements ClientConfigurationReader {

    private configFile: string = 'appsensor-client-config.json';
    private configSchemaFile: string = 'appsensor-client-config_schema.json'; 

    private static configPrototypesSample: JSONClientConfiguration;

    static {
        JSONClientConfigurationReader.configPrototypesSample = new JSONClientConfiguration();

        JSONClientConfigurationReader.configPrototypesSample.setServerConnection(new ServerConnection());
    }

    read(configurationLocation: string = '', validatorLocation: string | null = '', reload: boolean = false): ClientConfiguration | null {
        let config: JSONClientConfiguration | null = null;

        if (configurationLocation === '') {
            configurationLocation = this.configFile;
            // throw new Error('JSONServerConfigurationReader: configurationLocation cannot be null!');
        };

        if (validatorLocation === '') {
            validatorLocation = this.configSchemaFile;
            // throw new Error('JSONServerConfigurationReader: validatorLocation cannot be null!');
        };

        try {
            config = JSON.parse(fs.readFileSync(configurationLocation, 'utf8'));
            if (config) {
                this.setPrototypeInDepth(config, JSONClientConfigurationReader.configPrototypesSample);
            }
        } catch (error) {
            if (!reload) {
                throw error;
            } else {
                console.error(error);
            }
        }

        if (config && validatorLocation !== null) {
            // console.log('Validating config...');

            const valid = this.validateConfig(config, validatorLocation, reload);
            if (!valid) {
                //There is(are) validation error(s) reported by validateConfig
                config = null;
            }
        }
        
        return config;
    }

}

export {JSONClientConfiguration, JSONClientConfigurationReader}