[@appsensorlike/appsensorlike](https://www.npmjs.com/package/@appsensorlike/appsensorlike)  client over websocket. 
*Please note that this code runs on node only.*


Installation
 ---
 `````
 npm i @appsensorlike/appsensorlike_exec_mode_websocket_client_node
 `````


Usage
---
Please mind, that for this example your module has to install also [@appsensorlike/appsensorlike_exec_mode_websocket_server](https://www.npmjs.com/package/@appsensorlike/appsensorlike_exec_mode_websocket_server).

Please consider how the client is authenticated and authorized in [@appsensorlike/appsensorlike_exec_mode_websocket_server](https://www.npmjs.com/package/@appsensorlike/appsensorlike_exec_mode_websocket_server).
`````javascript
import { AppSensorWebsocketExecClient } from '@appsensorlike/appsensorlike_exec_mode_websocket_client_node';
import { AppSensorWebsocketExecServer } from '@appsensorlike/appsensorlike_exec_mode_websocket_server';
import { AppSensorEvent, Category, DetectionPoint, DetectionSystem, User } from "@appsensorlike/appsensorlike/core/core.js";

const appSensorWebsocketExecServer = 
        new AppSensorWebsocketExecServer('appsensor-server-config.json',
                                'appsensor-websocket-request-handler-config.json');
await appSensorWebsocketExecServer.startWebSocketServer();

const appSensorWebsocketExecClient = 
        new AppSensorWebsocketExecClient('appsensor-websocket-event-manager-config.json');
//you are now able to get instance of AppSensorClient respectivly EventManager and to send events to the server
const eventManager = appSensorWebsocketExecClient.getAppSensorClient().getEventManager();

//following lines are added just for purpose of demonstration
//
const user1 = new User("user1");
const detectionPoint = new DetectionPoint(Category.REQUEST, "RE7");
const detectionSystem = new DetectionSystem("localhostme");

if (eventManager) {
    await eventManager.addEvent(new AppSensorEvent(user1, detectionPoint, detectionSystem)); 
    await eventManager.addEvent(new AppSensorEvent(user1, detectionPoint, detectionSystem)); //new instance every time to set timestamp
}
`````

Here it is an example when your client runs along with your app on a separate node instance.
Before running the code you have to have running server, which will accept your requests.

Please consider how the client is authenticated and authorized in [@appsensorlike/appsensorlike_exec_mode_websocket_server](https://www.npmjs.com/package/@appsensorlike/appsensorlike_exec_mode_websocket_server).
`````javascript
import { AppSensorWebsocketExecClient } from '@appsensorlike/appsensorlike_exec_mode_websocket_client_node';
import { AppSensorEvent, Category, DetectionPoint, DetectionSystem, User } from "@appsensorlike/appsensorlike/core/core.js";

const appSensorWebsocketExecClient = 
        new AppSensorWebsocketExecClient('appsensor-websocket-event-manager-config.json');
//you are now able to get instance of AppSensorClient respectivly EventManager and to send events to the server
const eventManager = appSensorWebsocketExecClient.getAppSensorClient().getEventManager();

//following lines are added just for purpose of demonstration
//
const user1 = new User("user1");
const detectionPoint = new DetectionPoint(Category.REQUEST, "RE7");
const detectionSystem = new DetectionSystem("localhostme");

if (eventManager) {
    await eventManager.addEvent(new AppSensorEvent(user1, detectionPoint, detectionSystem)); 
    await eventManager.addEvent(new AppSensorEvent(user1, detectionPoint, detectionSystem)); //new instance every time to set timestamp
}
`````

Configuration
---
You can configure the *url* to send request to and websocket options via  AppSensorWebsocketExecClient constructor or configure it in appsensor-websocket-event-manager-config.json file in the working directory. You can copy the default configuration from this module's dist/execution-modes/appsensor-websocket/client-node/event. Corresponding schema file appsensor-websocket-client-config_schema.json is in the same directory.  
The default url is ws://localhost:4500 . The implementation takes advantage of WS websocket module so you could check for websocket options here  https://github.com/websockets/ws/blob/HEAD/doc/ws.md#new-websocketaddress-protocols-options .


TypeScript support
---
You need TypeScript version >= 4.7 in order the paths exported by the module to be resolved.