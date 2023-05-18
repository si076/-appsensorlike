import { ClientRequestArgs } from "http";
import WebSocket from "ws";
import { ReferenceAccessController } from "../../access-controllers/appsensor-access-control-reference/ReferenceAccessController.js";

import { ReferenceAttackAnalysisEngine, ReferenceEventAnalysisEngine } from "../../analysis-engines/appsensor-analysis-reference/appsensor-analysis-reference.js";
import { AggregateAttackAnalysisEngine, AggregateEventAnalysisEngine } from "../../analysis-engines/appsensor-analysis-rules/appsensor-analysis-rules.js";
import { JSONServerConfiguration, JSONServerConfigurationReader } from "../../configuration-modes/appsensor-configuration-json/server/JSONServerConfig.js";
import { AppSensorClient, AppSensorServer, RequestHandler } from "../../core/core.js";
import { NoopUserManager, ResponseHandler, UserManager } from "../../core/response/response.js";
import { AttackStore, EventStore, ResponseStore } from "../../core/storage/storage.js";
import { InMemoryAttackStore, InMemoryEventStore, InMemoryResponseStore } from "../../storage-providers/appsensor-storage-in-memory/appsensor-storage-in-memory.js";
import { LocalResponseHandler } from "../appsensor-local/response/response.js";
import { WebSocketEventManager } from "./event/event.js";
import { WebSocketRequestHandler } from "./handler/handler.js";

class AppSensorWebsocketExecClient {

	private appSensorClient = new AppSensorClient();

    private userManager: UserManager = new NoopUserManager();
    private responseHandler: ResponseHandler = new LocalResponseHandler(this.userManager);

    constructor(address: string | URL = '', 
                configLocation: string = '',
                options?: WebSocket.ClientOptions | ClientRequestArgs, 
                responseHandler?: ResponseHandler) {

        if (responseHandler) {
            this.responseHandler = responseHandler;
        }

        const eventManager = new WebSocketEventManager(address, configLocation, options);

        this.appSensorClient = new AppSensorClient();
        this.appSensorClient.setEventManager(eventManager);
        this.appSensorClient.setResponseHandler(this.responseHandler);
        this.appSensorClient.setUserManager(this.userManager);
    }

    getAppSensorClient() {
        return this.appSensorClient;
    }

    closeWebSocket() {
        (this.appSensorClient.getEventManager() as WebSocketEventManager).closeSocket();
    }
}

class AppSensorWebsocketExecServer {

	private appSensorServer = new AppSensorServer();

	private aggrEventEngine = new AggregateEventAnalysisEngine();
	private aggrAttackEngine = new AggregateAttackAnalysisEngine();

	private refEventEngine = new ReferenceEventAnalysisEngine();
	private refAttackEngine = new ReferenceAttackAnalysisEngine();

    private attackStore: AttackStore = new InMemoryAttackStore();
    private eventStore: EventStore = new InMemoryEventStore();
    private responseStore: ResponseStore = new InMemoryResponseStore();

    private requestHandler: RequestHandler;

    constructor(appServerConfigFile: string = '',
                webSocketServerConfigFile: string = '',
				serverOptions? :WebSocket.ServerOptions,
                attackStore?: AttackStore,
                eventStore?: EventStore,
                responseStore?: ResponseStore) {
        if (attackStore) {
            this.attackStore = attackStore;
        }

        if (eventStore) {
            this.eventStore = eventStore;
        }

        if (responseStore) {
            this.responseStore = responseStore;
        }


        this.appSensorServer.setConfiguration(new JSONServerConfiguration());
        if (appServerConfigFile.trim().length > 0) {
            this.appSensorServer.setConfiguration(
                new JSONServerConfigurationReader().read(appServerConfigFile.trim()));
        }

        this.appSensorServer.setAttackStore(this.attackStore);
        this.appSensorServer.setEventStore(this.eventStore);
        this.appSensorServer.setResponseStore(this.responseStore);

        const attackAnalysisEngines = [this.aggrAttackEngine, this.refAttackEngine];
        this.appSensorServer.setAttackAnalysisEngines(attackAnalysisEngines);
		for (let i = 0; i < attackAnalysisEngines.length; i++) {
			this.attackStore.registerListener(attackAnalysisEngines[i]);
		}

        const eventAnalysisEngines = [this.aggrEventEngine, this.refEventEngine];
        this.appSensorServer.setEventAnalysisEngines(eventAnalysisEngines);
		for (let i = 0; i < eventAnalysisEngines.length; i++) {
			this.eventStore.registerListener(eventAnalysisEngines[i]);
		}

		this.aggrAttackEngine.setAppSensorServer(this.appSensorServer);
        this.aggrEventEngine.setAppSensorServer(this.appSensorServer);

		this.refAttackEngine.setAppSensorServer(this.appSensorServer);
        this.refEventEngine.setAppSensorServer(this.appSensorServer);

        this.appSensorServer.setAccessController(new ReferenceAccessController());

        this.requestHandler = new WebSocketRequestHandler(this.appSensorServer, webSocketServerConfigFile, serverOptions);
    }

    getAppSensorServer() {
        return this.appSensorServer;
    }

    closeWebSocketServer() {
        (this.requestHandler as WebSocketRequestHandler).closeServer();
    }
}

export {AppSensorWebsocketExecClient, AppSensorWebsocketExecServer}