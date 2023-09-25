[@appsensorlike/appsensorlike](https://www.npmjs.com/package/@appsensorlike/appsensorlike) server exposed via websocket.


Installation
 ---
 `````
 npm i @appsensorlike/appsensorlike_exec_mode_websocket_server
 `````


Usage
---
`````javascript
import { AppSensorWebsocketExecServer } from '@appsensorlike/appsensorlike_exec_mode_websocket_server';

const appSensorWebsocketServer = 
        new AppSensorWebsocketExecServer('appsensor-server-config.json',
                                'appsensor-websocket-request-handler-config.json');
await appSensorWebsocketServer.startWebSocketServer();
//check corresponding client module @appsensorlike/appsensorlike_exec_mode_websocket_client_node to see how events can be sent
`````


Authentication and authorization of clients
---
**Authentication** of the client is based on the client IP. It has to match the IP sepecified in appsensor-server-config.json under clientApplications.ipAddress.address. You can specify the address in IPv4 or IPv6 format. For 127.0.0.1 in particular you can write "localhost" instead.

**Authorization** - after the client has successfully been authenticated, its authorizations are checked accoring to sepecified in appsensor-server-config.json under clientApplications.roles where the IP has been matched in authentication process.


Configuration
---
You can configure AppSensorLike detection points, responses, etc. via *appsensor-server-config.json* in your working directory. You can copy a demonstration appsensor-server-config.json from @appsensorlike/appsensorlike/dist/configuration-modes/appsensor-configuration-json/server and modify it accordingly. Corresponding schem file *appsensor-server-config_schema.json* is in the same directory. The configuration is reloaded on change.

You can configure http/s server and websocket thru *appsensor-websocket-request-handler-config.json* file in your working directory. You can copy the default configuration from this module's dist/execution-modes/appsensor-websocket/server/handler. Corresponding schem file *appsensor-websocket-server-config_schema.json* is in the same directory. For more information of the configuration fields check class @appsensorlike/appsensorlike/dist/http/HttpS2ServerConfig. This implementation utilizes Node's http/s server so you could refer to Node's documentation about the options (e.g. https://nodejs.org/dist/v14.15.0/docs/api/http.html#http_http_createserver_options_requestlistener). By default the server listens on port 4500. The implementation also takes advantage of WS websocket module so you could check https://github.com/websockets/ws/blob/HEAD/doc/ws.md#new-websocketserveroptions-callback especially the fields exposed via this configuration.


TypeScript support
---
You need TypeScript version >= 4.7 in order the paths exported by the module to be resolved.
