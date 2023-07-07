This is [@appsensorlike/appsensorlike](https://www.npmjs.com/package/@appsensorlike/appsensorlike) MySQL storage implementation.

 Installation
 ---
 `````
 npm i @appsensorlike/appsensorlike_storage_mysql
 `````

 Preparation
 ---
Create tables in the db using module's dist/storage-providers/appsensor-storage-mysql/sql/tables.sql script.

Copy from the module's dist/storage-providers/appsensor-storage-mysql/appsensor-storage-mysql-config.json in your working directory and set "database", "user" and "password" under "poolConfig".

Usage
---
Considering example under [@appsensorlike/appsensorlike](https://www.npmjs.com/package/@appsensorlike/appsensorlike), now you just have to pass instances of MySQLAttackStore, MySQLEventStore, MySQLResponseStore to AppSensorLocal constructor
 `````javascript
import { AppSensorLocal } from '@appsensorlike/appsensorlike/execution-modes/appsensor-local/appsensor_local.js';
import { AppSensorEvent, Category, DetectionPoint, DetectionSystem, User } from "@appsensorlike/appsensorlike/core/core.js";
import { MySQLAttackStore, MySQLEventStore, MySQLResponseStore } from "@appsensorlike/appsensorlike_storage_mysql";


const appSensorLocal = new AppSensorLocal('appsensor-server-config.json',
                                          new MySQLAttackStore(),
                                          new MySQLEventStore(),
                                          new MySQLResponseStore());
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
`````
Check your db tables.


TypeScript support
---
You need TypeScript version >= 4.7 in order the paths exported by the module to be resolved.
