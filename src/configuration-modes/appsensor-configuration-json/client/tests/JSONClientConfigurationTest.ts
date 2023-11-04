import { ServerConnection } from "../../../../core/configuration/client/client_configuration.js";
import { JSONClientConfiguration, JSONClientConfigurationReader } from "../JSONClientConfig.js";
import { Utils } from "../../../../utils/Utils.js";

import assert from "assert";
import { Logger } from "../../../../logging/logging.js";

class JSONClientConfigurationTest {

    private testConfigurationReadOfAllElements(): void {
        Logger.getTestsLogger().info('--> testConfigurationReadOfAllElements');

        const configExpected = new JSONClientConfiguration();

        const serverConnection = new ServerConnection();
        serverConnection.setType("ws");
        serverConnection.setUrl("http://localhost:9000/myapp/");
        serverConnection.setClientApplicationIdentificationHeaderName(ServerConnection.DEFAULT_HEADER_NAME);
        serverConnection.setClientApplicationIdentificationHeaderValue("something");
        serverConnection.setPort(9000);
        serverConnection.setSocketTimeout(1000);

        configExpected.setServerConnection(serverConnection);

        const testConfigFile = Utils.resolvePath(import.meta.url,'appsensor-client-config.json');

        const configActual = new JSONClientConfigurationReader().read(testConfigFile);

        assert.deepStrictEqual(configActual, configExpected);

        //just tests some methods to ensure that the config object has got proper prototype
        assert.strictEqual(configActual.getServerConnection()!.getUrl(), serverConnection.getUrl());
        assert.strictEqual(configActual.getServerConnection()!.getPort(), serverConnection.getPort());

        Logger.getTestsLogger().info('<-- testConfigurationReadOfAllElements');
    }

    public static runTests() {
        Logger.getTestsLogger().info('----- JSONClientConfigurationTest -----');
        new JSONClientConfigurationTest().testConfigurationReadOfAllElements();
    }

}

export {JSONClientConfigurationTest};