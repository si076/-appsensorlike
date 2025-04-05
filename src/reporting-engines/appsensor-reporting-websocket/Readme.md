[@appsensorlike/appsensorlike](https://www.npmjs.com/package/@appsensorlike/appsensorlike) reporting engine over websocket implementation.


Installation
---
`````
npm i @appsensorlike/appsensorlike_reporting_engines_websocket
`````


Reporting engine
---
The reporting engine allows you to obtain some statistical data from AppSensorLike server. It could also monitor the server for new AppSensorEvents, Attacks, Responses. Whith this websocket implementation, the client part of the engine, get notified when a new AppSensorEvent, Attack, Response is generated on the server. 

Most notably, the *dashboard and console* take advantage of this module. 


Usage
---
`````javascript
import { AppSensorLocal } from '@appsensorlike/appsensorlike/execution-modes/appsensor-local/appsensor_local.js';
import { AppSensorEvent, Attack, Response, Category, DetectionPoint, DetectionSystem, User } from "@appsensorlike/appsensorlike/core/core.js";
import { AppSensorReportingWebSocketClient } from "@appsensorlike/appsensorlike_reporting_engines_websocket/client";
import { AppSensorReportingWebSocketServer } from "@appsensorlike/appsensorlike_reporting_engines_websocket/server";

const earliest = new Date().toISOString();

const appSensorLocal = new AppSensorLocal();
const eventManager = appSensorLocal.getAppSensorClient().getEventManager();

//following lines are added just for purpose of demonstration
//
const user1 = new User("user1");
const detectionPoint = new DetectionPoint(Category.REQUEST, "RE7");
const detectionSystem = new DetectionSystem("localhostme");

if (eventManager) {
    await eventManager.addEvent(new AppSensorEvent(user1, detectionPoint, detectionSystem)); 
    await eventManager.addEvent(new AppSensorEvent(user1, detectionPoint, detectionSystem)); //new instance every time to set timestamp
}

//create and start the reporting engine server
const wsServer = new AppSensorReportingWebSocketServer(appSensorLocal.getAppSensorServer());
await wsServer.startServer();

//after this point the reporting engine client can connect to the reporting engine server
const wsClient = new AppSensorReportingWebSocketClient();
//add a listener for "bubbling" AppSensorEvents, Attacks, Responses
wsClient.addOnAddListener((obj) => {//: AppSensorEvent | Attack | Response) => {
    console.log(obj);
});

const userName = user1.getUsername();
const eventCount = await wsClient.countEventsByUser(earliest, userName);
const attackCount = await wsClient.countAttacksByUser(earliest, userName);
const responseCount = await wsClient.countResponsesByUser(earliest, userName);
console.log(`Stats for user: ${userName} since: ${earliest}`);
console.log(`Event count: ${eventCount}`);
console.log(`Attack count: ${attackCount}`);
console.log(`Response count: ${responseCount}`);

const eventCountByCategoryLabel = await wsClient.countEventsByCategoryLabel(earliest, Category.REQUEST, "RE7");
console.log(`Events of "RE7"(${Category.REQUEST}): ${eventCountByCategoryLabel}`);

//add some new events to see "bubbling"
if (eventManager) {
    await eventManager.addEvent(new AppSensorEvent(user1, detectionPoint, detectionSystem)); 
    await eventManager.addEvent(new AppSensorEvent(user1, detectionPoint, detectionSystem)); //new instance every time to set timestamp
}

await wsClient.closeSocket();

await wsServer.closeServer();
await wsServer.stopServer();
`````

The upper example is just for a demonstration. You can run reporting engine server along with AppSensorLike server on a separate node instance from the reporting engine client.


Authentication and authorization of clients
---
**Authentication** of the reporting engine client by the reporting engine server is based on custom header field and its value, sent with the websocket request. The field name is specified with clientApplicationIdentificationHeaderName of appsensor-server-config.json configuration file. The value of the field has to match one of ClientApplication.name enumerated under clientApplications of appsensor-server-config.json config file. If in the matched ClientApplication is present ipAddresses, this narrows down further the clients. These are allowed IPs only. The IPs can be specified in IPv4 or IPv6 format. For 127.0.0.1 in particular you can write "localhost" instead.

**Authorization** - after the reporting engine client has successfully been authenticated, its authorizations are checked against the roles found in the matched ClientApplication during the authentication phase. Role EXECUTE_REPORT is required.


Configuration
---
The reporting engine server can be configured via *appsensor-reporting-websocket-server-config.json* file in your working directory. You can copy the default configuration from the module's dist/reporting-engines/appsensor-reporting-websocket/server. Corresponding schema file *appsensor-websocket-server-config_schema.json* is in the same directory. For more information on the configuration fields check class WebSocketServerConfig of @appsensorlike/appsensorlike_websocket/dist/websocket/server/appsensor-websocket-server.d.ts. This implementation utilizes Node's http/s server so you could refer to Node's documentation about the options (e.g. https://nodejs.org/dist/v14.15.0/docs/api/http.html#http_http_createserver_options_requestlistener). By default the server listens on port 3000. The implementation also takes advantage of WS websocket module so you could check for websocket server options under https://github.com/websockets/ws/blob/HEAD/doc/ws.md#new-websocketserveroptions-callback , especially the fields exposed via this configuration.

The reporting engine client can be configured thru *appsensor-reporting-websocket-client-config.json* file in your working directory. You can copy the default configuration from the module's dist/reporting-engines/appsensor-reporting-websocket/client. Corresponding schema file *appsensor-websocket-client-config_schema.json* is in the same directory. For more information on the configuration fields check class WebSocketClientConfig of @appsensorlike/appsensorlike_websocket/dist/websocket/client/appsensor-websocket-client.d.ts. The default url is ws://localhost:3000 . The implementation takes advantage of WS websocket module so you could check for websocket options here  https://github.com/websockets/ws/blob/HEAD/doc/ws.md#new-websocketaddress-protocols-options .


TypeScript support
---
You need TypeScript version >= 4.7 in order the paths exported by the module to be resolved.
