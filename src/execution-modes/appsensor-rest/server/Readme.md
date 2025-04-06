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


Authentication and authorization of the clients
---
**Authentication** of the clients is based on custom header field and its value, sent with the request. The field name is specified with clientApplicationIdentificationHeaderName of appsensor-server-config.json configuration file. The value of the field has to match one of ClientApplication.name enumerated under clientApplications of appsensor-server-config.json config file. If in the matched ClientApplication is present ipAddresses, this narrows down further the clients. These are allowed IPs only. The IPs can be specified in IPv4 or IPv6 format. For 127.0.0.1 in particular you can write "localhost" instead.

**Authorization** - after the client has successfully been authenticated, its authorizations are checked against the roles found in the matched ClientApplication during the authentication phase.

For example in appsensor-server-config.json:
`````json
    ...
    "clientApplicationIdentificationHeaderName": "X-Appsensor-Client-Application-Name",
    ...
    "clientApplications": [
        {
            "name": "myclientapp",
            "roles": [
                "ADD_EVENT",
                "ADD_ATTACK",
                "GET_RESPONSES",
                "GET_EVENTS",
                "GET_ATTACKS",
                "EXECUTE_REPORT"
            ],
            "ipAddresses": [{
                "address": "localhost",
                "geoLocation": null
            }]
        }]
    ...
`````

Configuration
---
You can configure AppSensorLike detection points, responses, etc. via *appsensor-server-config.json* file . You can copy to your *working directory* a demonstration appsensor-server-config.json from @appsensorlike/appsensorlike/dist/configuration-modes/appsensor-configuration-json/server and modify it accordingly. Corresponding schem file *appsensor-server-config_schema.json* file is in the same directory. *The configuration is reloaded on change.*

You can configure http/s server thru *appsensor-rest-request-handler-config.json* file. You can copy to your *working directory* the default configuration from this module's dist/execution-modes/appsensor-rest/server/handler. Corresponding schem file *appsensor-rest-server-config_schema.json* is in the same directory. For more information of the configuration fields check class @appsensorlike/appsensorlike/dist/http/HttpS2ServerConfig. This implementation utilizes Node's http/s server so you could refer to Node's documentation about the options (e.g. https://nodejs.org/dist/v14.15.0/docs/api/http.html#http_http_createserver_options_requestlistener). By default the server listens on port 8080.


TypeScript support
---
You need TypeScript version >= 4.7 in order the paths exported by the module to be resolved.
