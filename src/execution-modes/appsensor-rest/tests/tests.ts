import assert from 'assert';

import * as readline from 'readline';

import { AppSensorRestClient } from '../client-node/appsensor_rest_client.js';
import { AppSensorRestServer } from '../server/appsensor-rest-server.js';
import { NoopUserManager } from "@appsensorlike/appsensorlike/core/response/response.js";
import { runTests as test, loggedUnexpectedErrors } from '@appsensorlike/appsensorlike/execution-modes/tests/tests.js';
import { TestResponseAnalysisEngine, TestResponseHandler } from '@appsensorlike/appsensorlike/execution-modes/tests/analysis/TestResponseHandler.js';
import { Utils } from '@appsensorlike/appsensorlike/utils/Utils.js';
import { Logger } from "@appsensorlike/appsensorlike/logging/logging.js";
import { AppSensorEvent, Category, DetectionPoint, DetectionSystem, Interval, INTERVAL_UNITS, Threshold, User } from "@appsensorlike/appsensorlike/core/core.js";

import { FetchError } from 'node-fetch';

function createAppSensorRestServer(configLocation: string): AppSensorRestServer  {
    const configAbsolutPath = Utils.resolvePath('', configLocation);

	const responseAnalysisEngine = new TestResponseAnalysisEngine();

    return new AppSensorRestServer(configAbsolutPath,
                                   "",
                                   undefined,
                                   undefined,
                                   undefined,
                                   responseAnalysisEngine);
}

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

    const expectedErrors = [new FetchError("request to http://localhost:8008/events failed, reason: connect ECONNREFUSED 127.0.0.1:8008", 'system'),
                            new Error("Server responded with status: 401"),
                            new Error("Server responded with status: 403"),
                            new TypeError("Cannot read properties of undefined (reading 'getDetectionSystemId')"),
                            new Error("Server responded with status: 500"),
                            "ReferenceEventAnalysisEngine.analyze: Could not find detection point configured for this type: IE4"];
    if (loggedUnexpectedErrors(expectedErrors)) {
        exitCode = 1;
    }

    await Logger.shutdownAsync();

    process.exit(exitCode);
}

async function testScenarios(readInf: readline.Interface | null = null) {
    const configLocation = "./appsensor-analysis-tests-server-config.json";

    const appSensorRestServer = createAppSensorRestServer(configLocation);

    const responseHandler = new TestResponseHandler(new NoopUserManager());

    const appSensorRestClient = new AppSensorRestClient('', 
                                                        'appsensor-rest-request-event-config.json', 
                                                        '',
                                                        '',
                                                        responseHandler);

    await appSensorRestServer.initStartServer();
    
    await test(appSensorRestServer.getAppSensorServer(), 
               appSensorRestClient.getAppSensorClient(), 
               configLocation,
               readInf);

    await appSensorRestServer.stopServer();
}

async function testWithWrongURL() {
    Logger.getTestsLogger().info("----- Run Wrong URL Test -----");
    const configLocation = "./appsensor-analysis-tests-server-config.json";

    const appSensorRestServer = createAppSensorRestServer(configLocation);

    const responseHandler = new TestResponseHandler(new NoopUserManager());

    const appSensorRestClient = new AppSensorRestClient('http://localhost:8008', 
                                                        '',
                                                        '', 
                                                        'myclientapp',
                                                        responseHandler);

    await appSensorRestServer.initStartServer();
    
    const event = new AppSensorEvent(new User("test"), 
                                     new DetectionPoint(Category.INPUT_VALIDATION, "IE1", new Threshold(3, new Interval(5, INTERVAL_UNITS.MINUTES))), 
                                     new DetectionSystem("localhostme"), 
                                     new Date())

    await assert.rejects(appSensorRestClient.getAppSensorClient().getEventManager()!.addEvent(event),
                         {
                             name: 'FetchError',
                             message: 'request to http://localhost:8008/events failed, reason: connect ECONNREFUSED 127.0.0.1:8008'
                         });

    await appSensorRestServer.stopServer();
}

async function testNotAllowedIP() {
    Logger.getTestsLogger().info("----- Run Not Allowed IP Test -----");
    const configLocation = "./appsensor-analysis-tests-server-config.json";

    const appSensorRestServer = createAppSensorRestServer(configLocation);

    const responseHandler = new TestResponseHandler(new NoopUserManager());

    const appSensorRestClient = new AppSensorRestClient('http://localhost:8080', 
                                                        '',
                                                        '', 
                                                        'myclientapp1',
                                                        responseHandler);

    await appSensorRestServer.initStartServer();
    
    const event = new AppSensorEvent(new User("test"), 
                                     new DetectionPoint(Category.INPUT_VALIDATION, "IE1", new Threshold(3, new Interval(5, INTERVAL_UNITS.MINUTES))), 
                                     new DetectionSystem("localhostme"), 
                                     new Date())

    await assert.rejects(appSensorRestClient.getAppSensorClient().getEventManager()!.addEvent(event),
                         {
                             name: 'Error',
                             message: 'Server responded with status: 401'
                         });

    await appSensorRestServer.stopServer();
}

async function testWithoutIPSpecifiedInConfig() {
    Logger.getTestsLogger().info("----- Run Without IP Specified In Config Test -----");
    const configLocation = "./appsensor-analysis-tests-server-config.json";

    const appSensorRestServer = createAppSensorRestServer(configLocation);

    const responseHandler = new TestResponseHandler(new NoopUserManager());

    const appSensorRestClient = new AppSensorRestClient('http://localhost:8080', 
                                                        '',
                                                        '', 
                                                        'myclientapp2',
                                                        responseHandler);

    await appSensorRestServer.initStartServer();
    
    const event = new AppSensorEvent(new User("test"), 
                                     new DetectionPoint(Category.INPUT_VALIDATION, "IE1", new Threshold(3, new Interval(5, INTERVAL_UNITS.MINUTES))), 
                                     new DetectionSystem("localhostme"), 
                                     new Date())

    await appSensorRestClient.getAppSensorClient().getEventManager()!.addEvent(event);

    await appSensorRestServer.stopServer();
}

async function testUnauthorizedAction() {
    Logger.getTestsLogger().info("----- Run Unauthorized Action Test -----");
    const configLocation = "./appsensor-analysis-tests-server-config.json";

    const appSensorRestServer = createAppSensorRestServer(configLocation);

    const responseHandler = new TestResponseHandler(new NoopUserManager());

    const appSensorRestClient = new AppSensorRestClient('http://localhost:8080', 
                                                        '',
                                                        '', 
                                                        'myclientapp3',
                                                        responseHandler);

    await appSensorRestServer.initStartServer();
    
    const event = new AppSensorEvent(new User("test"), 
                                     new DetectionPoint(Category.INPUT_VALIDATION, "IE1", new Threshold(3, new Interval(5, INTERVAL_UNITS.MINUTES))), 
                                     new DetectionSystem("localhostme"), 
                                     new Date())

    await assert.rejects(appSensorRestClient.getAppSensorClient().getEventManager()!.addEvent(event),
                         {
                             name: 'Error',
                             message: 'Server responded with status: 403'
                         });

    await appSensorRestServer.stopServer();
}

async function testErrorHandling() {
    Logger.getTestsLogger().info("----- Run Error Handling Test -----");
    const configLocation = "./appsensor-analysis-tests-server-config.json";

    const appSensorRestServer = createAppSensorRestServer(configLocation);

    const responseHandler = new TestResponseHandler(new NoopUserManager());

    const appSensorRestClient = new AppSensorRestClient('http://localhost:8080', 
                                                        '',
                                                        '', 
                                                        'myclientapp',
                                                        responseHandler);

    await appSensorRestServer.initStartServer();
    
    const event: AppSensorEvent = JSON.parse("{}");

    await assert.rejects(appSensorRestClient.getAppSensorClient().getEventManager()!.addEvent(event),
                         {
                             name: 'Error',
                             message: 'Server responded with status: 500'
                         });

    await appSensorRestServer.stopServer();
}


export {runTests};