import { ServerConfiguration, ServerConfigurationReader } from "../../../../core/configuration/server/server_configuration.js";

class ServerConfigurationImpl extends ServerConfiguration {
    constructor() {
        super();
    }
}

class ServerConfigurationReaderImpl implements ServerConfigurationReader {

    read(configurationLocation: string = '', validatorLocation: string = ''): ServerConfiguration {
        return new ServerConfigurationImpl();
    }

}

export {ServerConfigurationReaderImpl};