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
**Authentication** of the reporting engine client by the reporting engine server is based on the client IP. It has to match the IP sepecified in appsensor-server-config.json under clientApplications.ipAddress.address. You can specify the address in IPv4 or IPv6 format. For 127.0.0.1 in particular you can write "localhost" instead.

**Authorization** - after the reporting engine client has successfully been authenticated, its authorizations are checked accoring to sepecified in appsensor-server-config.json under clientApplications.roles where the IP has been matched in authentication process. Role EXECUTE_REPORT is required.


Configuration
---
The reporting engine server can be configured via *appsensor-reporting-websocket-server-config.json* file in your working directory. You can copy the default configuration from the module's dist/reporting-engines/appsensor-reporting-websocket/server. Corresponding schem file *appsensor-websocket-server-config_schema.json* is in the same directory. For more information on the configuration fields check class WebSocketServerConfig of @appsensorlike/appsensorlike_websocket/dist/websocket/server/appsensor-websocket-server.d.ts.

The reporting engine client can be configured thru *appsensor-reporting-websocket-client-config.json* file in your working directory. You can copy the default configuration from the module's dist/reporting-engines/appsensor-reporting-websocket/client. Corresponding schem file *appsensor-websocket-client-config_schema.json* is in the same directory. For more information on the configuration fields check class WebSocketClientConfig of @appsensorlike/appsensorlike_websocket/dist/websocket/client/appsensor-websocket-client.d.ts.


TypeScript support
---
You need TypeScript version >= 4.7 in order the paths exported by the module to be resolved.
