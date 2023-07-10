[@appsensorlike/appsensorlike](https://www.npmjs.com/package/@appsensorlike/appsensorlike) Dashboard


 Installation
 ---
 `````
 npm i @appsensorlike/appsensorlike_ui_web
 `````


Preparation
---
You have to create db tables, which hold users, user groups, and corresponding authorizations.
Use MySQL script located in dependent module @appsensorlike/appsensorlike_ui under dist/appsensor-ui/security/mysql/sql.

Copy from the dependent module @appsensorlike/appsensorlike_ui dist/appsensor-ui/security/mysql/appsensor-ui-session-storage-mysql-config.json in your working directory and set "database", "user" and "password" under "poolOptions".


Usage
---
`````javascript
import { AppsensorUIRestServer } from "@appsensorlike/appsensorlike_ui_web"

const inst = new AppsensorUIRestServer();
await inst.initStartServer();
//now the dashboard app is up and running expecting requests on configured url
//e.g. http://localhost:8080
`````


Authentication and authorization of clients
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