import { ServerConnection } from "../../../../core/configuration/client/client_configuration.js";
import { JSONClientConfiguration, JSONClientConfigurationReader } from "../JSONClientConfig.js";
import { JSONConfigReadValidate } from "../../../../utils/Utils.js";

import assert from "assert";

class JSONClientConfigurationTest {

    private testConfigurationReadOfAllElements(): void {
        console.log('--> testConfigurationReadOfAllElements');

        const configExpected = new JSONClientConfiguration();

        const serverConnection = new ServerConnection();
        serverConnection.setType("ws");
        serverConnection.setUrl("http://localhost:9000/myapp/");
        serverConnection.setClientApplicationIdentificationHeaderName(ServerConnection.DEFAULT_HEADER_NAME);
        serverConnection.setClientApplicationIdentificationHeaderValue("something");
        serverConnection.setPort(9000);
        serverConnection.setSocketTimeout(1000);

        configExpected.setServerConnection(serverConnection);

        const testConfigFile = JSONConfigReadValidate.resolvePath(import.meta.url,'appsensor-client-config.json');

        const configActual = new JSONClientConfigurationReader().read(testConfigFile);

        assert.deepStrictEqual(configActual, configExpected);

        //just tests some methods to ensure that the config object has got proper prototype
        assert.strictEqual(configActual.getServerConnection()!.getUrl(), serverConnection.getUrl());
        assert.strictEqual(configActual.getServerConnection()!.getPort(), serverConnection.getPort());

        console.log('<-- testConfigurationReadOfAllElements');
    }

    public static runTests() {
        console.log('');
        console.log('----- JSONClientConfigurationTest -----');
        new JSONClientConfigurationTest().testConfigurationReadOfAllElements();
    }

}

export {JSONClientConfigurationTest};