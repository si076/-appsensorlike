[@appsensorlike/appsensorlike](https://www.npmjs.com/package/@appsensorlike/appsensorlike)  http/s client consuming the web service as defined in https://owasp.org/www-pdf-archive/Owasp-appsensor-guide-v2.pdf under Chapter 20. 
*Please note that this code runs on node only.*


Installation
 ---
 `````
 npm i @appsensorlike/appsensorlike_exec_mode_rest_client_node
 `````


Usage
---
Please mind, that for this example your module has to install also [@appsensorlike/appsensorlike_exec_mode_rest_server](https://www.npmjs.com/package/@appsensorlike/appsensorlike_exec_mode_rest_server).

Please consider how the client is authenticated and authorized in [@appsensorlike/appsensorlike_exec_mode_rest_server](https://www.npmjs.com/package/@appsensorlike/appsensorlike_exec_mode_rest_server).
`````javascript
import { AppSensorRestClient } from '@appsensorlike/appsensorlike_exec_mode_rest_client_node';
import { AppSensorRestServer } from '@appsensorlike/appsensorlike_exec_mode_rest_server';
import { AppSensorEvent, Category, DetectionPoint, DetectionSystem, User } from "@appsensorlike/appsensorlike/core/core.js";

const appSensorRestServer = 
        new AppSensorRestServer('appsensor-server-config.json',
                                'appsensor-rest-request-handler-config.json');
await appSensorRestServer.initStartServer();

const appSensorRestClient = 
        new AppSensorRestClient('',
                                'appsensor-rest-request-event-config.json');
//you are now able to get instance of AppSensorClient respectivly EventManager and to send events to the server
const eventManager = appSensorRestClient.getAppSensorClient().getEventManager();

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

Please consider how the client is authenticated and authorized in [@appsensorlike/appsensorlike_exec_mode_rest_server](https://www.npmjs.com/package/@appsensorlike/appsensorlike_exec_mode_rest_server).
`````javascript
import { AppSensorRestClient } from '@appsensorlike/appsensorlike_exec_mode_rest_client_node';
import { AppSensorEvent, Category, DetectionPoint, DetectionSystem, User } from "@appsensorlike/appsensorlike/core/core.js";

const appSensorRestClient = 
        new AppSensorRestClient('',
                                'appsensor-rest-request-event-config.json');
//you are now able to get instance of AppSensorClient respectivly EventManager and to send events to the server
const eventManager = appSensorRestClient.getAppSensorClient().getEventManager();

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
You can pass the *url* to send request to in the AppSensorRestClient constructor or configure it in appsensor-rest-request-event-config.json file in the working directory. You can copy the default configuration from this module's dist/execution-modes/appsensor-rest/client-node/event.


TypeScript support
---
You need TypeScript version >= 4.7 in order the paths exported by the module to be resolved.