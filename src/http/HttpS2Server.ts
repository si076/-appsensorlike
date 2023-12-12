import net from 'net';
import tls from 'tls';
import http from 'http';
import https from 'https';
import http2 from 'http2';
import fs from 'fs';

import { Logger } from '../logging/logging.js';

enum HTTP_PROTOCOLS {
    HTTP  = 'http',
    HTTPS = 'https',
    HTTP2 = 'http2'
}

/**
 * Http/s/2 server and listen configuration
 */
class HttpS2ServerConfig {
    protocol: HTTP_PROTOCOLS = HTTP_PROTOCOLS.HTTP;
    
    http?: http.ServerOptions | undefined;

    https?: https.ServerOptions | undefined;

    http2?: http2.ServerOptions | undefined;

    listenOptions?: net.ListenOptions | undefined;
}

/**
 * Creates Http/s/2 server and listen for connection according to
 * provided HttpS2ServerConfig configuration
 */
class HttpS2Server {

    protected server: http.Server | https.Server | http2.Http2Server | null = null;

    protected getConfiguration(): HttpS2ServerConfig {
        return new HttpS2ServerConfig();
    }

    public async startServer() {
        const config = this.getConfiguration();

        switch (config.protocol) {
            case HTTP_PROTOCOLS.HTTP: {
                const options = config.http ? config.http : {};
                this.server = http.createServer(options);
                break;
            }
            case HTTP_PROTOCOLS.HTTPS: {
                const options = config.https ? config.https : {};
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
            case HTTP_PROTOCOLS.HTTP2: {
                const options = config.http2 ? config.http2 : {};
                this.server = http2.createServer(options);
                break;
            }
        }

        if (this.server) {

            this.server.on('error', (err: Error) => {
                Logger.getServerLogger().error('HttpS2Server.startServer:', 'error:', err);
            }).on('tlsClientError', (err: Error, tlsSocket: tls.TLSSocket) => {
                Logger.getServerLogger().error('HttpS2Server.startServer:', 'tlsClientError:', err);
            });

            await this.attachToServer();

            const listenOptions = config.listenOptions ? config.listenOptions: {};
            const self = this;

            const listenPromise = new Promise((resolve, reject) => {
                if (this.server) {
                    this.server.listen(listenOptions, () => {
                        Logger.getServerLogger().info('HttpS2Server.startServer: ', `Listening on: ${self.getAddress()}`);
                        resolve(null);
                    });
                }
            });
            const timeOutInMillis = 10000;
            const timeoutPromise = new Promise((resolve, reject) => {
                    setTimeout(() => {
                        reject(new Error(`Server didn't start in ${timeOutInMillis} milliseconds!`));
                    }, timeOutInMillis);
                });
            await Promise.race([listenPromise, timeoutPromise]);
        }

    }

    protected getAddress(): string {
        let address: string | net.AddressInfo | null = '';
        if (this.server) {
            address = this.server.address();
            if (address && this.instanceofAddressInfo(address)) {
                address = address.address + ':' + address.port;
            }
            if (!address) {
                address = '';
            }
        }
        return address;
    }

    protected async attachToServer() {
        //allow sharing of the same http server
    }

    private instanceofAddressInfo(obj: any): obj is net.AddressInfo {
        return 'address' in obj && 'family' in obj && 'port' in obj;
    }

    public async stopServer() {
        await new Promise((resolve, reject) => {
            if (this.server) {
                const address = this.getAddress();
                this.server.close((err?: Error) => {
                    if (err) {
                        Logger.getServerLogger().error('HttpS2Server.stopServer: ', err);
                        
                        reject(err);

                        return;

                    } else {
                        Logger.getServerLogger().info('HttpS2Server.stopServer: ', `Server listening on ${address} stopped.`);
                    }

                    resolve(0);
                });
            } else {
                resolve(0);
            }
        });
    }
}

export {HTTP_PROTOCOLS, HttpS2ServerConfig, HttpS2Server};