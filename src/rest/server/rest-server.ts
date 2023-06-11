import e from 'express';
import * as serveStatic from 'serve-static';
import cors from 'cors';

import morgan from 'morgan';

import net from 'net';
import tls from 'tls';
import http from 'http';
import https from 'https';
import http2 from 'http2';
import fs from 'fs';
import path from 'path';

import { ServerConfiguration } from '../../core/configuration/server/server_configuration.js';
import { IPAddress } from '../../core/core.js';
import { AccessController, Action, Context } from '../../core/accesscontrol/accesscontrol.js';
import { Logger } from '../../logging/logging.js';

enum PROTOCOLS {
    HTTP  = 'http',
    HTTPS = 'https',
    HTTP2 = 'http2'
}

class RestServerConfig {
    protocol: PROTOCOLS = PROTOCOLS.HTTP;
    
    basePath?: string | undefined;
    langs?: string[] | undefined;
    appPaths?: string[] | undefined;

    // http: {
    //     requestTimeout?: number | undefined;
    //     keepAliveTimeout?: number | undefined;
    //     connectionsCheckingInterval?: number | undefined;
    //     insecureHTTPParser?: boolean | undefined;
    //     maxHeaderSize?: number | undefined;
    //     noDelay?: boolean | undefined;
    //     keepAlive?: boolean | undefined;
    //     keepAliveInitialDelay?: number | undefined;
    //     uniqueHeaders?: Array<string | string[]> | undefined;
    // } = {};

    // https: {
    //     requestTimeout?: number | undefined;
    //     keepAliveTimeout?: number | undefined;
    //     connectionsCheckingInterval?: number | undefined;
    //     insecureHTTPParser?: boolean | undefined;
    //     maxHeaderSize?: number | undefined;
    //     noDelay?: boolean | undefined;
    //     keepAlive?: boolean | undefined;
    //     keepAliveInitialDelay?: number | undefined;
    //     uniqueHeaders?: Array<string | string[]> | undefined;

    //     key: string,
    //     cert: string
    // } = {key: '', cert: ''};

    http?: http.ServerOptions | undefined;

    https?: https.ServerOptions | undefined;

    http2?: http2.ServerOptions | undefined;

    listenOptions?: net.ListenOptions | undefined;
}

class RestServer {

    protected expressApp: e.Express;

    protected server: http.Server | https.Server | http2.Http2Server | null = null;

    protected config: RestServerConfig;

    constructor(config: RestServerConfig) {
        this.config = config;

        this.expressApp  = e(); 
    }
    
    init() {
        this.expressApp.use(cors());
        this.expressApp.use(e.json());
        
        this.setRequestLogging();

        this.setEndpoints();
    
        this.setStaticContent();

        this.setOnNotFoundResource();
    }

    protected setRequestLogging() {
        this.expressApp.use(
            morgan('dev', 
                    {
                        stream: { 
                            write(str: string) {
                                Logger.getServerLogger().trace(str);
                            }
                        }
                    }));
    }

    protected setEndpoints() {

        //your code in a subclass goes here
    }
    
    protected getStaticContentDir(): string {
        return '';
    }

    protected getStaticOption<R extends http.ServerResponse>(): serveStatic.ServeStaticOptions<R> {
        return  {
            // fallthrough: false,
            redirect: false
        };
    }
    
    protected setStaticContent() {
        const staticOptions = this.getStaticOption();

        let basePath = this.config.basePath ? this.config.basePath : '';

        if (basePath.trim().length > 0) {
            let staticContentDir = path.join(basePath, this.getStaticContentDir());

            if (!this.config.langs || this.config.langs.length === 0) {
                this.expressApp.use(e.static(staticContentDir, staticOptions));
            } else {
                for (let i = 0; i < this.config.langs.length; i++) {
                    const lang = this.config.langs[i];
                    this.expressApp.use(e.static(path.join(staticContentDir, lang), staticOptions));
                }
            }        
        }
    }

    protected setOnNotFoundResource() {
        this.expressApp.use((req, res, next) => {
            res.status(404).send();
        });
    }

    startServer() {

        switch (this.config.protocol) {
            case PROTOCOLS.HTTP: {
                const options = this.config.http ? this.config.http : {};
                this.server = http.createServer(options);
                break;
            }
            case PROTOCOLS.HTTPS: {
                const options = this.config.https ? this.config.https : {};
                if (!options.key) {
                    throw new Error("For https server: You have to set the name of the key file under config https.key!");
                }
                if (!options.cert) {
                    throw new Error("For https server: You have to set the name of the cert file under config https.cert!");
                }
                const serviceKey = fs.readFileSync(options.key as string);
                const certificate = fs.readFileSync(options.cert as string);

                options.key = serviceKey;
                options.cert = certificate;

                this.server = https.createServer(options);
                break;
            }
            case PROTOCOLS.HTTP2: {
                //not supported yet in express
                throw new Error("Not supported yet in the current version of Express!");
                // const options = config.http2 ? config.http2 : {};
                // this.server = http2.createServer(options);
                break;
            }
        }

        if (this.server) {

            this.server.on('error', (err: Error) => {
                Logger.getServerLogger().error('RestServer.startServer: ', err);
            }).on('tlsClientError', (err: Error, tlsSocket: tls.TLSSocket) => {
                Logger.getServerLogger().error('RestServer.startServer: ', err);
            });

            this.attachToServer();

            this.server.addListener('request', this.expressApp);
        
            const listenOptions = this.config.listenOptions ? this.config.listenOptions: {};
            const serverSelf = this.server;
            this.server.listen(listenOptions, () => {
                let address: string | net.AddressInfo | null = serverSelf.address();
                if (this.instanceofAddressInfo(address)) {
                    address = address.address + ':' + address.port;
                }
                Logger.getServerLogger().info('RestServer.startServer: ', `Listening on: ${address}`);
            });
        }

    }

    protected attachToServer() {
        //allow sharing of the same http server
    }

    private instanceofAddressInfo(obj: any): obj is net.AddressInfo {
        return 'address' in obj && 'family' in obj && 'port' in obj;
    }

    protected stopServer() {
        if (this.server) {
            this.server.close((err?: Error) => {
                if (err) {
                    Logger.getServerLogger().error('RestServer.stopServer: ', err);
                } else {
                    Logger.getServerLogger().info('RestServer.stopServer: ', 'Server stopped.');
                }
            });
        }
    }

    protected isConnectionAllowed(ip: string, 
                                  appSensorServerConfig: ServerConfiguration | null): boolean {
        let allowed = false;

        if (ip && appSensorServerConfig) {
            const clientApp = appSensorServerConfig.findClientApplication(new IPAddress(ip));
            if (clientApp) {
                allowed = true;
            }
        }

        return allowed;
    }

    protected isActionAuthorized(ip: string, 
                                 appSensorServerConfig: ServerConfiguration | null,
                                 appSensorAccessController: AccessController | null,
                                 action: Action): boolean {
        let authorized = false;

        if (ip && appSensorServerConfig) {
            const clientApp = appSensorServerConfig.findClientApplication(new IPAddress(ip));
            if (clientApp && appSensorAccessController) {
                authorized = appSensorAccessController.isAuthorized(clientApp, 
                                                                    action, 
                                                                    new Context());
            }
        }

        return authorized;
    }

    protected reportError(res: e.Response, statusCode: number, title: string, message: string) {
        var doc = this.createHtmlDocument(title, message);

        res.statusCode = statusCode;
        res.setHeader('Content-Type', 'text/html; charset=UTF-8')
        res.setHeader('Content-Length', Buffer.byteLength(doc))
        res.setHeader('Content-Security-Policy', "default-src 'none'")
        res.setHeader('X-Content-Type-Options', 'nosniff')
        res.end(doc)
    }

    protected createHtmlDocument (title: string, body: string) {
        return '<!DOCTYPE html>\n' +
          '<html lang="en">\n' +
          '<head>\n' +
          '<meta charset="utf-8">\n' +
          '<title>' + title + '</title>\n' +
          '</head>\n' +
          '<body>\n' +
          '<pre>' + body + '</pre>\n' +
          '</body>\n' +
          '</html>\n';
    }    

}

export {RestServer, RestServerConfig}