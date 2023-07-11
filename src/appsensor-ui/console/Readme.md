[@appsensorlike/appsensorlike](https://www.npmjs.com/package/@appsensorlike/appsensorlike) Console is utilized to monitor and/or export report(s) to an excel file.


Installation
---
`````
npm i @appsensorlike/appsensorlike_ui_console
`````


Run
---
1) Run locally to installation of the module:

    npx @appsensorlike/appsensorlike_ui_console [options]

2) If you install the module globally (-g flag), you can run it with

    AppSensorLikeConsole [options]


Command line options
---

 option | value     | description 
--- | --- | --- |
 r | reportName     | Report to be displayed/exported, one of: All,AllActivities, MostActiveDetPoints, MostActiveUsers, Trends, DetPointConfig, DetPointCategorization
 e | earliestDate   | Report earliest date (server UTC) in format YYYY-MM-DDTHH:mm:ss.sss (fraction part .sss is optional)
 x |                | Export report(s) to an excel file in the working directory. If this option is set, report(s) are not displayed!
 a |                | Set on auto reload
 t | interval       | Auto reload interval in milliseconds
 i | maxItemsAtOnce | Maximum displayed items at once
 h |                | Prints this usage guide

For example:
AppSensorLikeConsole -a -t 5000 -r AllActivities -e 2023-07-11T13:34:37.181 -i 2


Monitoring
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
    await eventManager.addEvent(new AppSensorEvent(user1, detectionPoint, detectionSystem)); 
    await eventManager.addEvent(new AppSensorEvent(user1, detectionPoint, detectionSystem)); //new instance every time to set timestamp
}

//create and start the reporting engine server
const wsServer = new AppSensorReportingWebSocketServer(appSensorLocal.getAppSensorServer());
await wsServer.startServer();
`````
Please mind that console utilizes a websocket reporting engine client, which by default tries to connect to ws://localhost:3000. By default it will try to reconnect on connection lost. You can change configuration as pointed in [@appsensorlike/appsensorlike_reporting_engines_websocket](https://www.npmjs.com/package/@appsensorlike/appsensorlike_reporting_engines_websocket) under Configuration section.


With each start are shown the new items since you last closed the console.

If this is your *first time* running the console, the items since epoch (midnight at the beginning of 1 January 1970 UTC) are shown.

You can manually set the *earliest* date of report(s) within the console or with -e options.

By default new items are displayed as soon as "emerge" from the server. 
If you instead, prefer report to be reloaded on specified interval of tile, you can run with -a and set interval in milliseconds with -t option. By default auto reload is off. Default interval is 30000 ms.. 




Export
---
You have two options to export report(s) data:

1) In background with command line options -x

2) From within the console 

Exported file is in the working directory with name AppSensorLike_Reports_{fromDateStr}-{toDateStr}.xlsx. {fromDateStr} and {toDateStr} are replaced with actual dates.


Configuration
---
You can configure auto reload, reload interval and maximum displayed items at once in *appsensor-console-ui-settings.json* file in your working directory. You can copy the default configuration from the module's dist/appsensor-ui/console. Please mind that command line options take precedence.