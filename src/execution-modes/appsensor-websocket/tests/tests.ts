
import * as readline from 'readline';

import { NoopUserManager } from "@appsensorlike/appsensorlike/core/response/response.js";
import { Utils } from '@appsensorlike/appsensorlike/utils/Utils.js';
import { Logger } from "@appsensorlike/appsensorlike/logging/logging.js";
import { runTests as test, loggedUnexpectedErrors } from '@appsensorlike/appsensorlike/execution-modes/tests/tests.js';
import { TestResponseAnalysisEngine, TestResponseHandler } from '@appsensorlike/appsensorlike/execution-modes/tests/analysis/TestResponseHandler.js';
import { AppSensorWebsocketExecClient } from '../client-node/appsensor_websocket_client.js';
import { AppSensorWebsocketExecServer } from '../server/appsensor_websocket_server.js';
import { WebSocketClientConfig } from "@appsensorlike/appsensorlike_websocket/client";
import { AppSensorEvent, Category, DetectionPoint, DetectionSystem, Interval, INTERVAL_UNITS, Threshold, User } from "@appsensorlike/appsensorlike/core/core.js";
import assert from 'assert';


async function runTests(readInf: readline.Interface | null = null) {
    let exitCode = 0;

    try {
        await testWithWrongURL();

        await testNotAllowedIP();

        await testWithoutIPSpecifiedInConfig();

        await testUnauthorizedAction();

        await testErrorHandling();

        await testScenarios();
    } catch (error) {
        exitCode = 1;
        Logger.getTestsLogger().error(error);
    }

    const expectedErrors = [new Error("connect ECONNREFUSED 127.0.0.1:4005"),
                            new Error("WebSocket in CLOSING state!"),
                            new Error("Unauthorized action addEvent"),
                            new TypeError("Cannot read properties of undefined (reading 'getDetectionSystemId')"),
                            new Error("TypeError: Cannot read properties of undefined (reading 'getDetectionSystemId')"),
                            "ReferenceEventAnalysisEngine.analyze: Could not find detection point configured for this type: IE4"];
    if (loggedUnexpectedErrors(expectedErrors)) {
        exitCode = 1;
    }

    await Logger.shutdownAsync();

    process.exit(exitCode);
}

async function testScenarios(readInf: readline.Interface | null = null) {
    const configLocation = "./appsensor-analysis-tests-server-config.json";
    const configAbsolutPath = Utils.resolvePath('', configLocation);

	const responseAnalysisEngine = new TestResponseAnalysisEngine();

    const appSensorWebSocketServer = 
            new AppSensorWebsocketExecServer(configAbsolutPath,
                                             "",
                                             undefined,
                                             undefined,
                                             undefined,
                                             undefined,
                                             responseAnalysisEngine);

    const responseHandler = new TestResponseHandler(new NoopUserManager());

    await appSensorWebSocketServer.startWebSocketServer();

    const appSensorWebSocketClient = 
            new AppSensorWebsocketExecClient(null,
                                             'appsensor-websocket-event-manager-config.json',
                                             responseHandler);

    const connected = await appSensorWebSocketClient.connectWebSocket();
    
    if (connected) {
        await test(appSensorWebSocketServer.getAppSensorServer(), 
                   appSensorWebSocketClient.getAppSensorClient(), 
                   configLocation,
                   readInf); 
    }
    
    await appSensorWebSocketClient.closeWebSocket();
    await appSensorWebSocketServer.closeWebSocketServer();
}

async function testWithWrongURL() {
    Logger.getTestsLogger().info("----- Run Wrong URL Test -----");

    const responseHandler = new TestResponseHandler(new NoopUserManager());

    const config = new WebSocketClientConfig();
    config.address = "ws://localhost:4005";

    const appSensorWebSocketClient = 
            new AppSensorWebsocketExecClient(config,
                                             '',
                                             responseHandler);

    const connected = await appSensorWebSocketClient.connectWebSocket();

    assert.equal(connected, false);
}

async function testNotAllowedIP() {
    Logger.getTestsLogger().info("----- Run Not Allowed IP Test -----");
    const configLocation = "./appsensor-analysis-tests-server-config.json";
    const configAbsolutPath = Utils.resolvePath('', configLocation);

	const responseAnalysisEngine = new TestResponseAnalysisEngine();

    const appSensorWebSocketServer = 
            new AppSensorWebsocketExecServer(configAbsolutPath,
                                             "",
                                             undefined,
                                             undefined,
                                             undefined,
                                             undefined,
                                             responseAnalysisEngine);

    const responseHandler = new TestResponseHandler(new NoopUserManager());

    await appSensorWebSocketServer.startWebSocketServer();

    const config = new WebSocketClientConfig();
    config.address = "ws://localhost:4500";
    config.options = {};
    config.options.headers = {};
    config.options.headers['X-Appsensor-Client-Application-Name'] = "myclientapp1";

    const appSensorWebSocketClient = 
            new AppSensorWebsocketExecClient(config,
                                             '',
                                             responseHandler);

    const connected = await appSensorWebSocketClient.connectWebSocket();
    
    assert.equal(connected, false);

    await appSensorWebSocketClient.closeWebSocket();

    await appSensorWebSocketServer.closeWebSocketServer();
} 

async function testWithoutIPSpecifiedInConfig() {
    Logger.getTestsLogger().info("----- Run Without IP Specified In Config Test -----");
    const configLocation = "./appsensor-analysis-tests-server-config.json";
    const configAbsolutPath = Utils.resolvePath('', configLocation);

	const responseAnalysisEngine = new TestResponseAnalysisEngine();

    const appSensorWebSocketServer = 
            new AppSensorWebsocketExecServer(configAbsolutPath,
                                             "",
                                             undefined,
                                             undefined,
                                             undefined,
                                             undefined,
                                             responseAnalysisEngine);

    const responseHandler = new TestResponseHandler(new NoopUserManager());

    await appSensorWebSocketServer.startWebSocketServer();

    const config = new WebSocketClientConfig();
    config.address = "ws://localhost:4500";
    config.options = {};
    config.options.headers = {};
    config.options.headers['X-Appsensor-Client-Application-Name'] = "myclientapp2";

    const appSensorWebSocketClient = 
            new AppSensorWebsocketExecClient(config,
                                             '',
                                             responseHandler);

    const connected = await appSensorWebSocketClient.connectWebSocket();
    
    if (connected) {
        const event = new AppSensorEvent(new User("test"), 
                                         new DetectionPoint(Category.INPUT_VALIDATION, "IE1", new Threshold(3, new Interval(5, INTERVAL_UNITS.MINUTES))), 
                                         new DetectionSystem("localhostme"), 
                                         new Date());

        await appSensorWebSocketClient.getAppSensorClient().getEventManager()!.addEvent(event);
    }

    await appSensorWebSocketClient.closeWebSocket();

    await appSensorWebSocketServer.closeWebSocketServer();

}

async function testUnauthorizedAction() {
    Logger.getTestsLogger().info("----- Run Unauthorized Action Test -----");
    const configLocation = "./appsensor-analysis-tests-server-config.json";
    const configAbsolutPath = Utils.resolvePath('', configLocation);

	const responseAnalysisEngine = new TestResponseAnalysisEngine();

    const appSensorWebSocketServer = 
            new AppSensorWebsocketExecServer(configAbsolutPath,
                                             "",
                                             undefined,
                                             undefined,
                                             undefined,
                                             undefined,
                                             responseAnalysisEngine);

    const responseHandler = new TestResponseHandler(new NoopUserManager());

    await appSensorWebSocketServer.startWebSocketServer();

    const config = new WebSocketClientConfig();
    config.address = "ws://localhost:4500";
    config.options = {};
    config.options.headers = {};
    config.options.headers['X-Appsensor-Client-Application-Name'] = "myclientapp3";

    const appSensorWebSocketClient = 
            new AppSensorWebsocketExecClient(config,
                                             '',
                                             responseHandler);

    const connected = await appSensorWebSocketClient.connectWebSocket();
    
    if (connected) {
        const event = new AppSensorEvent(new User("test"), 
                                         new DetectionPoint(Category.INPUT_VALIDATION, "IE1", new Threshold(3, new Interval(5, INTERVAL_UNITS.MINUTES))), 
                                         new DetectionSystem("localhostme"), 
                                         new Date());

        await assert.rejects(appSensorWebSocketClient.getAppSensorClient().getEventManager()!.addEvent(event),
                             new Error("Unauthorized action addEvent"));
    }

    await appSensorWebSocketClient.closeWebSocket();

    await appSensorWebSocketServer.closeWebSocketServer();

}

async function testErrorHandling() {
    Logger.getTestsLogger().info("----- Run Error Handling Test -----");
    const configLocation = "./appsensor-analysis-tests-server-config.json";
    const configAbsolutPath = Utils.resolvePath('', configLocation);

	const responseAnalysisEngine = new TestResponseAnalysisEngine();

    const appSensorWebSocketServer = 
            new AppSensorWebsocketExecServer(configAbsolutPath,
                                             "",
                                             undefined,
                                             undefined,
                                             undefined,
                                             undefined,
                                             responseAnalysisEngine);

    const responseHandler = new TestResponseHandler(new NoopUserManager());

    await appSensorWebSocketServer.startWebSocketServer();

    const config = new WebSocketClientConfig();
    config.address = "ws://localhost:4500";
    config.options = {};
    config.options.headers = {};
    config.options.headers['X-Appsensor-Client-Application-Name'] = "myclientapp";

    const appSensorWebSocketClient = 
            new AppSensorWebsocketExecClient(config,
                                             '',
                                             responseHandler);

    const connected = await appSensorWebSocketClient.connectWebSocket();
    
    if (connected) {
        const event: AppSensorEvent = JSON.parse("{}");

        await assert.rejects(appSensorWebSocketClient.getAppSensorClient().getEventManager()!.addEvent(event),
                             new Error("TypeError: Cannot read properties of undefined (reading 'getDetectionSystemId')"));
    }

    await appSensorWebSocketClient.closeWebSocket();

    await appSensorWebSocketServer.closeWebSocketServer();

}

export {runTests};