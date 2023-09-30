# -appsensorlike
A port of **OWASP AppSensor [jtmelton/appsensor](https://github.com/jtmelton/appsensor)** reference implementation.

One might ask why do we need another port as we have already got the Java implementation? And you
 will be right! 
 
 If you want to run this AppSensor port along with your app on the same node instance or on a separate node instance (client-server architecture) you are welcome!
 
 You can also just use the client part of this module to send/pull events/responses, generated in your app, to the server utilizing the reference implementation.
 
 With WebSocket execution mode implementation, which comes as a separate module under the same scope, you are able to send events and get notified when a response is generated by the AppSensor server.
 
 I have tried to port most of the essential components like **core, storage-providers, monitoring, reporting**. This module implements the core functionality and provides local execution mode with in-memory storage provider.
 The other components come as separate modules under the same scope @appsensorlike.
 
 Installation
 ---
 ```
 npm i @appsensorlike/appsensorlike
 ```
 Minimum Setup
 ---
 ```javascript
 import { AppSensorLocal } from '@appsensorlike/appsensorlike/execution-modes/appsensor-local/appsensor_local.js';
 import { AppSensorEvent, Category, DetectionPoint, DetectionSystem, User } from "@appsensorlike/appsensorlike/core/core.js";

const appSensorLocal = new AppSensorLocal();
//you are now able to get instance of AppSensorClient respectivly EventManager and to send events to the server
const eventManager = appSensorLocal.getAppSensorClient().getEventManager();

//following lines are added just for purpose of demonstration
//
//add some events to cause an attack and respectivly response
//in a real scenario it's up to your app needs to determine possible attempts for an attack and to configure accordingly 
//detection points, rules, detection systems, responses, etc. in the server configuration 

const user1 = new User("user1");
const detectionPoint = new DetectionPoint(Category.REQUEST, "RE7");
const detectionSystem = new DetectionSystem("localhostme");

if (eventManager) {
    await eventManager.addEvent(new AppSensorEvent(user1, detectionPoint, detectionSystem)); 
    await eventManager.addEvent(new AppSensorEvent(user1, detectionPoint, detectionSystem)); //new instance every time to set timestamp
}

//the response(in cese of an Attack) from the server will be available via
//ResponseHandler set in AppSensorLocal constructor
//default implementation just logs what actions expected to be performed by your app in response to the attack
```
Watch console for generated attacks and responses.


For a real scenario you have to:
---
1) Determine possible attempts for an attack. You can find guidens how to determine detection points and responses in https://owasp.org/www-pdf-archive/Owasp-appsensor-guide-v2.pdf. For your convenience a list of detection points is provided in module dist/appsensor-detection-point-descriptions.json and a list of responses in module dist/appsensor-responses-descriptions.json. Configure accordingly appsensor-server-config.json in your working directory. You can copy a demonstration appsensor-server-config.json from dist/configuration-modes/appsensor-configuration-json/server and modify it. Corresponding schem file appsensor-server-config_schema.json is in the same directory. *The configuration is reloaded on change.*
2) Choose or implement a storage provider, which holds AppSensorEvent, Attack, Response, etc., and pass it to AppSensorLocal constructor. This module comes with in-memory storage provider, which could be considered only for testing. As a separate module under the same scope [@appsensorlike/appsensorlike_storage_mysql](https://www.npmjs.com/package/@appsensorlike/appsensorlike_storage_mysql) is provided MySQL storage provider.
3) Implement ResponseHandler and pass it to the AppSensorLocal constructor. The ResponseHandler is responsible, on the app side, to modify behaviour of the app according to the response.


TypeScript support
---
You need TypeScript version >= 4.7 in order the paths exported by the module to be resolved.


Other modules
---
**Storage-providers**

[@appsensorlike/appsensorlike_storage_mysql](https://www.npmjs.com/package/@appsensorlike/appsensorlike_storage_mysql) - MySQL storage provider implementation

**Execution Modes**

[@appsensorlike/appsensorlike_exec_mode_rest_client_node](https://www.npmjs.com/package/@appsensorlike/appsensorlike_exec_mode_rest_client_node) - http/s client consuming the web service as defined in https://owasp.org/www-pdf-archive/Owasp-appsensor-guide-v2.pdf under Chapter 20

[@appsensorlike/appsensorlike_exec_mode_rest_server](https://www.npmjs.com/package/@appsensorlike/appsensorlike_exec_mode_rest_server) - http/s server exposed as a web service as defined in https://owasp.org/www-pdf-archive/Owasp-appsensor-guide-v2.pdf under Chapter 20

[@appsensorlike/appsensorlike_exec_mode_websocket_client_node](https://www.npmjs.com/package/@appsensorlike/appsensorlike_exec_mode_websocket_client_node) - client communicating with the server via WebSocket 

[@appsensorlike/appsensorlike_exec_mode_websocket_server](https://www.npmjs.com/package/@appsensorlike/appsensorlike_exec_mode_websocket_server) - server exposed via WebSocket.

**Reporting**

[@appsensorlike/appsensorlike_reporting_engines_websocket](https://www.npmjs.com/package/@appsensorlike/appsensorlike_reporting_engines_websocket) - provides classes for reporting engine:
* reporting client connecting to reporting server via WebSocket.
* reporting server exposed via WebSocket.

**Monitoring**

[@appsensorlike/appsensorlike_ui_web](https://www.npmjs.com/package/@appsensorlike/appsensorlike_ui_web) - Web Dashboard for monitoring recent activities, trends, geo map, etc.

[@appsensorlike/appsensorlike_ui_console](https://www.npmjs.com/package/@appsensorlike/appsensorlike_ui_console) - Console for monitoring and report exporting
