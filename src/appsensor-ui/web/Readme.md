[@appsensorlike/appsensorlike](https://www.npmjs.com/package/@appsensorlike/appsensorlike) Dashboard

![alt text](https://github.com/si076/-appsensorlike/blob/main/src/appsensor-ui/web/images/Dashboard1.png "Dashboard")  ![alt text](https://github.com/si076/-appsensorlike/blob/main/src/appsensor-ui/web/images/Dashboard2.png "Trends")


 Installation
 ---
 `````
 npm i @appsensorlike/appsensorlike_ui_web
 `````


Preparation
---
You have to create db tables, which hold users, user groups, and corresponding authorizations.
Use MySQL script located in dependent module @appsensorlike/appsensorlike_ui under dist/appsensor-ui/security/mysql/sql.

Copy from the dependent module @appsensorlike/appsensorlike_ui dist/appsensor-ui/security/mysql/appsensor-ui-session-storage-mysql-config.json in your working directory and set "database", "user" and "password" under "poolOptions". This user is used to connect to db in order to check logging users credentials.


Usage
---
You have to have running websocket reporting engine server connected to running AppSensorLike server.

For example:
`````javascript
import { AppSensorLocal } from '@appsensorlike/appsensorlike/execution-modes/appsensor-local/appsensor_local.js';
import { AppSensorEvent, Category, DetectionPoint, DetectionSystem, User } from "@appsensorlike/appsensorlike/core/core.js";
import { AppSensorReportingWebSocketServer } from "@appsensorlike/appsensorlike_reporting_engines_websocket/server";

const appSensorLocal = new AppSensorLocal();
const eventManager = appSensorLocal.getAppSensorClient().getEventManager();

//following lines are added just for purpose of demonstration
//
const user1 = new User("user1");
const detectionPoint = new DetectionPoint(Category.REQUEST, "RE7");
const detectionSystem = new DetectionSystem("localhostme");

if (eventManager) {
    //simulate some user malicious events
    //
    await eventManager.addEvent(new AppSensorEvent(user1, detectionPoint, detectionSystem)); 
    await eventManager.addEvent(new AppSensorEvent(user1, detectionPoint, detectionSystem)); //new instance every time to set timestamp
}

//simulate some user malicious events on interval
//see how Dashboard gets updated
setInterval(async () => {
    if (eventManager) {
        await eventManager.addEvent(new AppSensorEvent(user1, detectionPoint, detectionSystem));
    }
}, 10000);

//create and start the reporting engine server
const wsServer = new AppSensorReportingWebSocketServer(appSensorLocal.getAppSensorServer());
await wsServer.startServer();
`````

If you have installed the [geo locator module](https://www.npmjs.com/package/@appsensorlike/appsensorlike_geolocators_fast_geoip), you could also add geolocation along with the user's IP address. This will give you a visualization of user's location on GEO map. 

For example:
`````javascript
import { AppSensorLocal } from '@appsensorlike/appsensorlike/execution-modes/appsensor-local/appsensor_local.js';
import { AppSensorEvent, Category, DetectionPoint, DetectionSystem, User, IPAddress } from "@appsensorlike/appsensorlike/core/core.js";
import { AppSensorReportingWebSocketServer } from "@appsensorlike/appsensorlike_reporting_engines_websocket/server";
import { FastGeoIPLocator } from "@appsensorlike/appsensorlike_geolocators_fast_geoip";

const appSensorLocal = new AppSensorLocal();
const eventManager = appSensorLocal.getAppSensorClient().getEventManager();

//following lines are added just for purpose of demonstration
//

const geoLocator = new FastGeoIPLocator();

const ipAddressUser = await IPAddress.fromString("83.228.0.0", geoLocator);
const user1 = new User("user1", ipAddressUser);

const ipAddressDetSystem = await IPAddress.fromString("80.80.128.0", geoLocator);
const detectionSystem = new DetectionSystem("localhostme", ipAddressDetSystem);

const detectionPoint = new DetectionPoint(Category.REQUEST, "RE7");


if (eventManager) {
    //simulate some user malicious events
    //
    await eventManager.addEvent(new AppSensorEvent(user1, detectionPoint, detectionSystem)); 
    await eventManager.addEvent(new AppSensorEvent(user1, detectionPoint, detectionSystem)); //new instance every time to set timestamp
}

//simulate some user malicious events on interval
//see how Dashboard and Geo map get updated
setInterval(async () => {
    if (eventManager) {
        await eventManager.addEvent(new AppSensorEvent(user1, detectionPoint, detectionSystem));
    }
}, 10000);

//create and start the reporting engine server
const wsServer = new AppSensorReportingWebSocketServer(appSensorLocal.getAppSensorServer());
await wsServer.startServer();
`````


Dashboard app creates a websocket reporting engine client, which by default tries to connect to ws://localhost:3000. By default it will try to reconnect on connection lost. You can change configuration as pointed in [@appsensorlike/appsensorlike_reporting_engines_websocket](https://www.npmjs.com/package/@appsensorlike/appsensorlike_reporting_engines_websocket) under Configuration section.


**Running the Dashboard app on the configured server**

1) Run locally to installation of the module:

    npx @appsensorlike/appsensorlike_ui_web

2) If you install the module globally (-g flag), you can run it with

    AppSensorLikeWeb

If you see any errors related to database, please refer to [known issues section](#known-issues)!


**Open the Dashboard in a web browser**

Default URL is http://localhost:8080/
If you see any errors related to database, please refer to [known issues section](#known-issues)!


Authentication and authorization of Dashboard's clients
---
**Authentication** of the users is based on user name and password, which have to be set in advance by the administrator in ui_users table.

**Authorization** - authenticated users have to possess authorizations to access specific pages.
They can be set for user or group.
* VIEW_DATA - to access all pages but configuration
* VIEW_CONFIGURATION - to access configuration

The authorizations are set by the administrator in ui_authorities table and link to a user or a group in corresponding ui_user_authorities and ui_groups, ui_group_authorities, ui_group_users.


Configuration
---
You can configure protocol http/s, port, etc via *appsensor-ui-rest-server-config.json* file in your working directory. You can copy the default configuration from the module's dist/appsensor-ui/web. Corresponding schem file *appsensor-rest-server-config_schema.json* is in the same directory.


Known Issues
---
*  Database problems like (Encoding not recognized: 'undefined'...):
This module dpends on express-mysql-session, which on its own depends on mysql2 for storing user's session. There is an open issue https://github.com/sidorares/node-mysql2/issues/1398 related to the problem. For the time being, you could manually patch your mysql2 module by adding 'utf8mb3: 45,' in mysql2/lib/constants/encoding_charset.js. Please update your mysql2 as soon as the problem is officially fixed!