import e from 'express';
import * as serveStatic from 'serve-static';

import morgan from 'morgan';

import http from 'http';
import path from 'path';

import { ServerConfiguration } from '../../core/configuration/server/server_configuration.js';
import { IPAddress } from '../../core/core.js';
import { AccessController, Action, Context } from '../../core/accesscontrol/accesscontrol.js';
import { Logger } from '../../logging/logging.js';
import { HttpS2Server, HttpS2ServerConfig } from '../../http/HttpS2Server.js';

class RestServerConfig extends HttpS2ServerConfig {
    
    basePath?: string | undefined;
    langs?: string[] | undefined;
    appPaths?: string[] | undefined;
}

class RestServer extends HttpS2Server {

    protected expressApp: e.Express;

    protected config: RestServerConfig;

    constructor(config: RestServerConfig) {
        super();
        this.config = config;

        this.expressApp  = e(); 
    }

    protected override getConfiguration(): HttpS2ServerConfig {
        return this.config;
    }
    
    async init() {
        //Set middlewares

        await this.setBase();

        await this.setSession();

        await this.setAuthentication();

        await this.setAuthorization();
        
        await this.setRequestLogging();

        await this.setRenderPages();

        await this.setEndpoints();
    
        await this.setStaticContent();

        this.setOnNotFoundResource();

        this.setErrorHandler();
    }

    async initStartServer() {
        await this.init();
        await this.startServer();
    }
    
    protected async setBase(): Promise<void> {
        // this.expressApp.use(cors());
        this.expressApp.use(e.json());
    }

    protected async setSession(): Promise<void> {
        //your code in a subclass goes here
    }

    protected async setAuthentication(): Promise<void> {
        //your code in a subclass goes here
    }

    protected async setAuthorization(): Promise<void> {
        //your code in a subclass goes here
    }

    protected async setRequestLogging(): Promise<void> {
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

    protected async setRenderPages(): Promise<void> {
        //your code in a subclass goes here
    }

    protected async setEndpoints(): Promise<void> {
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
    
    protected async setStaticContent(): Promise<void> {
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

    protected setErrorHandler() {
        this.expressApp.use(this.errorHandler.bind(this));
    }

    protected errorHandler(err: any, req: e.Request, res: e.Response, next: e.NextFunction) {
        next(err)
    }

    protected async attachToServer() {
        if (this.server) {
            this.server.addListener('request', this.expressApp);
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