import fs from 'fs';
import EventEmitter from "events";
import assert from 'assert';

import log from "log4js";

import { JSONConfigManager, JSONConfigReadValidate } from '../utils/Utils.js';

class LoggingConfiguration {
    log4jsLoggers: log.Configuration = 
            {
                appenders: {
                    "out": { 
                        "type": "stdout" 
                    }
                }, 
                categories: {
                    "default": {
                        "appenders": ["out"],
                        "level": "trace"
                    }
                }
            };
}

class Logger {
    private static APPSENSOR_CLIENT_CATEGORY = "APPSENSOR_CLIENT";
    private static APPSENSOR_SERVER_CATEGORY = "APPSENSOR_SERVER";
    private static APPSENSOR_RESPONSES_CATEGORY = "APPSENSOR_RESPONSES";

    private static configFile       = 'appsensor-logging-config.json';
    private static configSchemeFile = 'appsensor-logging-config_schema.json';

    private static configManager = new JSONConfigManager(new JSONConfigReadValidate(Logger.configFile, 
                                                                                    Logger.configSchemeFile, 
                                                                                    LoggingConfiguration.prototype), 
                                                                                    null, 
                                                                                    null,
                                                                                    Logger.configFile,
                                                                                    Logger.configSchemeFile,
                                                                                    true);

    private static log4js: log.Log4js = log.configure(new LoggingConfiguration().log4jsLoggers);

    private static clientLogger: log.Logger  = Logger.log4js.getLogger();
    private static serverLogger: log.Logger  = Logger.log4js.getLogger();
    private static responsesLogger: log.Logger  = Logger.log4js.getLogger();

    private static async initLoggers(forceReconfig: boolean = false) {
        if (forceReconfig) {
            await Logger.shutdown();
        }

        if (forceReconfig || !Logger.log4js) {
            Logger.log4js = log.configure((Logger.configManager.getConfiguration() as LoggingConfiguration).log4jsLoggers);

            if (Logger.log4js) {
                Logger.clientLogger = Logger.log4js.getLogger(Logger.APPSENSOR_CLIENT_CATEGORY);
                Logger.serverLogger = Logger.log4js.getLogger(Logger.APPSENSOR_SERVER_CATEGORY);
                Logger.responsesLogger = Logger.log4js.getLogger(Logger.APPSENSOR_RESPONSES_CATEGORY);
            }
        }
    }

    static {
        Logger.initLoggers(true);

        Logger.configManager.listenForConfigurationChange( 
            (newConfig: any) => {
                Logger.initLoggers(true);
            });

    }

    public static getClientLogger() {
        return Logger.clientLogger;
    }

    public static getServerLogger() {
        return Logger.serverLogger;
    }

    public static getResponsesLogger() {
        return Logger.responsesLogger;
    }

    public static stringifyObjInLog(logger: log.Logger, level: log.Level | string, obj: Object) {
        if (logger) {
            let arg = obj;
            try {
                arg = JSON.stringify(obj, null, 2);
            } catch (error) {
            }
            logger.log(level, arg);
        }
    }

    static async shutdownAsync() {
        await new Promise((resolve, reject) => {
            if (Logger.log4js) {
                Logger.log4js.shutdown((error?: Error) => {
                    if (error) {
                        reject(error);
                        return;
                    }
        
                    resolve(0);
                });
            } else {
                resolve(0);
            }
        });
    }

    static shutdown(cb?: ((error?: Error | undefined) => void)) {
        if (Logger.log4js) {
            Logger.log4js.shutdown(cb);
        }
    }
}

export {Logger, LoggingConfiguration};
