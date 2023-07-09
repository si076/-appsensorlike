[@appsensorlike/appsensorlike](https://www.npmjs.com/package/@appsensorlike/appsensorlike) server exposed as a http/s web service as defined in https://owasp.org/www-pdf-archive/Owasp-appsensor-guide-v2.pdf under Chapter 20


Installation
 ---
 `````
 npm i @appsensorlike/appsensorlike_exec_mode_rest_server
 `````


Usage
---
`````javascript
import { AppSensorRestServer } from '@appsensorlike/appsensorlike_exec_mode_rest_server';

const appSensorRestServer = 
        new AppSensorRestServer('appsensor-server-config.json',
                                'appsensor-rest-request-handler-config.json');
await appSensorRestServer.initStartServer();
//the service now can accept requests as defined in https://owasp.org/www-pdf-archive/Owasp-appsensor-guide-v2.pdf under Chapter 20
//check corresponding client module @appsensorlike/appsensorlike_exec_mode_rest_client to see how events can be sent
`````


Authentication and authorization of clients
---
**Authentication** of the client is based on the client IP. It has to match the IP sepecified in appsensor-server-config.json under clientApplications.ipAddress.address. You can specify the address in IPv4 or IPv6 format. For 127.0.0.1 in particular you can write "localhost" instead.

**Authorization** - after the client has successfully been authenticated, its authorizations are checked accoring to sepecified in appsensor-server-config.json under clientApplications.roles where the IP has been matched in authentication process.


Configuration
---
You can configure AppSensorLike detection points, responses, etc. via *appsensor-server-config.json* in your working directory. You can copy a demonstration appsensor-server-config.json from @appsensorlike/appsensorlike/dist/configuration-modes/appsensor-configuration-json/server and modify it accordingly. Corresponding schem file *appsensor-server-config_schema.json* is in the same directory. The configuration is reloaded on change.

You can configure http/s server thru *appsensor-rest-request-handler-config.json* file in your working directory. You can copy the default configuration from this module's dist/execution-modes/appsensor-rest/server/handler. Corresponding schem file *appsensor-rest-server-config_schema.json* is in the same directory. For more information of the configuration fields check class @appsensorlike/appsensorlike/dist/http/HttpS2ServerConfig.


TypeScript support
---
You need TypeScript version >= 4.7 in order the paths exported by the module to be resolved.
