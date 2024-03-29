import fs from 'fs';
import EventEmitter from "events";
import assert from 'assert';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

import Ajv from "ajv";
import { AnySchemaObject, ErrorObject } from "ajv";
import formatsPlugin from "ajv-formats"

import { AppSensorEvent, Attack, DetectionPoint, DetectionSystem, 
         Interval, IPAddress, KeyValuePair, Resource, Response, Threshold, 
         User, IValidateInitialize } from '../core/core.js';
import { GeoLocation } from '../core/geolocation/geolocation.js';
import { Clause, Expression, Rule } from '../core/rule/rule.js';
import { ServerConfiguration } from '../core/configuration/server/server_configuration.js';

class ValidationError extends Error implements ErrorObject {
    keyword: string;
    instancePath: string;
    schemaPath: string;
    params: Record<string, any>;
    propertyName?: string | undefined;
    schema?: unknown;
    parentSchema?: AnySchemaObject | undefined;
    data?: unknown;

    constructor(errObj: ErrorObject, message?: string) {
        super(message);
        this.name = this.constructor.name;

        this.keyword = errObj.keyword;
        this.instancePath = errObj.instancePath;
        this.schemaPath = errObj.schemaPath;
        this.params = errObj.params;
        this.propertyName = errObj.propertyName;
        this.schema = errObj.schema;
        this.parentSchema = errObj.parentSchema;
        this.data = errObj.data;
    }

}

class JSONConfigManager {

    public static CONFIGURATION_CHANGED_EVENT: string = 'CONFIGURATION_CHANGED';

    private eventEmitter = new EventEmitter();

    protected configReader: JSONConfigReadValidate;

    protected configFile: string | null = null;
    protected configSchemaFile: string | null = null;
    protected watchConfigFile: boolean = false;

    protected currentConfig: any = null;

    constructor(configReader: JSONConfigReadValidate,
                configFile: string | null = null,
                configSchemaFile: string | null = null,
                watchConfigFile: boolean = false) {
        this.configReader = configReader;
        this.configFile = configFile;
        this.configSchemaFile = configSchemaFile;
        this.watchConfigFile = watchConfigFile;
        
        if (watchConfigFile) {
            let fileToWatch = this.configReader.getDefaultConfigFile();
            if (this.configFile) {
                fileToWatch = this.configFile;
            }
            this.watch(fileToWatch);
        }
    }

    public getConfiguration(): any {
        if (!this.currentConfig) {
            this.currentConfig = this.configReader.read(this.configFile, this.configSchemaFile);
        }

        return this.currentConfig;
    }

    protected reloadConfiguration() {
        const config = this.configReader.read(this.configFile, this.configSchemaFile, true);
        if (config) {
            try {
                assert.deepStrictEqual(config, 
                                       this.currentConfig);
            } catch (error) {
                if (error instanceof assert.AssertionError) {
                    ServerConfiguration.clientApplicationCache.clear();

                    this.currentConfig = config;

                    this.eventEmitter.emit(JSONConfigManager.CONFIGURATION_CHANGED_EVENT, this.currentConfig);
                }
            }
        }
    }

    public listenForConfigurationChange(cb: (newConfig: any) => void) {
        this.eventEmitter.addListener(JSONConfigManager.CONFIGURATION_CHANGED_EVENT, cb);
    }

    private watch(file: string) {
        if (this.watchConfigFile) {
            const me = this;
            fs.watchFile(file, {persistent: false}, function (this: JSONConfigManager, curr: fs.Stats, prev: fs.Stats) {
                // console.log(prev);
                // console.log(curr);
                me.reloadConfiguration();
            });
        }
    }

    private unwatch(file: string) {
        if (this.watchConfigFile) {
            fs.unwatchFile(file);
        }
    }
}


class JSONConfigReadValidate {

    protected defaultConfigFile: string;
    protected defaultConfigSchemaFile: string | null;

    protected prototypeOfConfigObj: Object | null | undefined;

    constructor(defaultRelativeTo: string,
                defaultConfigFile: string, 
                defaultConfigSchemaFile: string | null = null, 
                prototypeOfConfigObj?: Object | null) {
        this.defaultConfigFile = Utils.resolvePath(defaultRelativeTo, defaultConfigFile);
        this.defaultConfigSchemaFile = defaultConfigSchemaFile ? Utils.resolvePath(defaultRelativeTo, defaultConfigSchemaFile) : null;
        this.prototypeOfConfigObj = prototypeOfConfigObj;
    }

    public getDefaultConfigFile(): string {
        return this.defaultConfigFile;
    }

    public getDefaultConfigSchemaFile(): string | null {
        return this.defaultConfigSchemaFile;
    }

    public getConfigLocation(configLocation: string | null = null): string {
        if (!configLocation) {
            configLocation = this.defaultConfigFile;
        } else {
            if (!fs.existsSync(configLocation)) {
                configLocation = this.defaultConfigFile;
            }
        }

        return configLocation;
    }

    public getValidatorLocation(validatorLocation: string | null = null): string | null {
        if (!validatorLocation) {
            validatorLocation = this.defaultConfigSchemaFile;
        } else {
            if (!fs.existsSync(validatorLocation)) {
                validatorLocation = this.defaultConfigSchemaFile;
            }
        }

        return validatorLocation;
    }

    /**
     * Read configuration file and validate.
     * If a configuration file is not provided, default is taken
     * If a validator(schema) is not provided, default is taken. 
     * If default schema is not set, loaded configuration is not validated
     * @param configLocation a configuration file path relative to the working directory or an absolute path
     * @param validatorLocation a validator(schema) 
     * @param reload true when configuration file has been changed since loaded in memory
     * @returns a configuration object
     */
    public read(configLocation: string | null = null, 
                validatorLocation: string | null = null, 
                reload: boolean  = false): any {
        let config: any = null;

        configLocation = this.getConfigLocation(configLocation);

        validatorLocation = this.getValidatorLocation(validatorLocation);

        try {
            config = JSON.parse(fs.readFileSync(configLocation, 'utf8'));
        } catch (error) {
            if (!reload) {
                throw error;
            } else {
                //don't log here because of circular dependencies
                console.error(error);
            }
        }

        if (config && validatorLocation !== null) {
            // console.log('Validating config...');

            const valid = this.validateConfig(config, validatorLocation, reload);
            if (!valid) {
                //There is(are) validation error(s) reported by validateConfig
                config = null;
            }
        }

        if (config && this.prototypeOfConfigObj !== undefined) {
            Object.setPrototypeOf(config, this.prototypeOfConfigObj);
        }

        if (Utils.isIValidateInitialize(config)) {
            config.checkValidInitialize();
        }

        return config;
    }

    /**
     * Read configuration from a string and validate.
     * @param configAsString a string containing the configuration in JSON format
     * @param validatorLocation a validator(schema); if it is null, doesn't validate
     * @returns a configuration object
     */
    public readFromString(configAsString: string, 
                          validatorLocation: string | null = null) {
        let config = JSON.parse(configAsString);

        if (config && validatorLocation !== null) {
            // console.log('Validating config...');

            const valid = this.validateConfig(config, validatorLocation, false);
            if (!valid) {
                //There is(are) validation error(s) reported by validateConfig
                config = null;
            }
        }

        if (config && this.prototypeOfConfigObj !== undefined) {
            Object.setPrototypeOf(config, this.prototypeOfConfigObj);
        }

        if (Utils.isIValidateInitialize(config)) {
            config.checkValidInitialize();
        }

        return config;
    }

    protected validateConfig(config: any, validatorLocation: string, reload: boolean): boolean {

        const schema = JSON.parse(fs.readFileSync(validatorLocation, 'utf8'));

        const ajv = new Ajv.default({strict:true, allowUnionTypes: true, allErrors:true});
        formatsPlugin.default(ajv);

        const validate = ajv.compile(schema);
        validate(config);

        let valid = true;
        const validationResult = validate.errors;
        if (validationResult) {
            //There is(are) validation error(s)
            valid = false;

            //don't log here because of circular dependencies 
            if (!reload) {
                //since this is the initial start of the applicat just throw 
                if (validationResult.length > 0) {
                    console.log(validationResult);
                    throw new ValidationError(validationResult[0], `Configuration validation failed!`);    
                } else {
                    throw new Error('Configuration validation failed!');    
                }
            } else {
                //do not disturb running application with errors 
                //just log to the console 
                //who change the configuration should be aware
                console.error('Configuration validation failed!');
                for (let e = 0; e < validationResult.length; e++) {
                    console.error(validationResult[e]);
                }
            }
            
        }

        return valid;
    }

}

class Utils {
    
    public static ipAddressSample: IPAddress;
    public static detectionPointSample: DetectionPoint;
    public static ruleSample: Rule;
    public static appSensorEventPrototypeSample: AppSensorEvent;
    public static attackPrototypeSample: Attack;
    public static responsePrototypeSample: Response;

    static {
        const interval = new Interval();

        const ipAddress = new IPAddress();
        ipAddress.setGeoLocation(new GeoLocation(0, 0));

        const user = new User();
        user.setIPAddress(ipAddress);

        const detectionSystem = new DetectionSystem('', ipAddress);

        const resource = new Resource();

        const metadata = [new KeyValuePair()];

        const response = new Response();
        response.setUser(user);
        response.setInterval(interval);
        response.setDetectionSystem(detectionSystem);
        response.setMetadata(metadata);

        const threshold = new Threshold();
        threshold.setInterval(interval);

        const detPoint = new DetectionPoint("something", "something");
        detPoint.setThreshold(threshold);
        detPoint.setResponses([response]);

        const clause = new Clause();
        clause.setMonitorPoints([detPoint]);

        const expre = new Expression();
        expre.setClauses([clause]);
        expre.setWindow(interval);

        const rule: Rule = new Rule();
        rule.setWindow(interval);
        rule.setExpressions([expre]);
        rule.setResponses([response]);


        Utils.ipAddressSample = ipAddress;

        Utils.detectionPointSample = detPoint;

        Utils.ruleSample = rule;

        Utils.appSensorEventPrototypeSample = new AppSensorEvent();
        Utils.appSensorEventPrototypeSample.setUser(user);
        Utils.appSensorEventPrototypeSample.setDetectionPoint(detPoint);
        Utils.appSensorEventPrototypeSample.setDetectionSystem(detectionSystem);
        Utils.appSensorEventPrototypeSample.setResource(resource);
        Utils.appSensorEventPrototypeSample.setMetadata(metadata);

        Utils.attackPrototypeSample = new Attack();
        Utils.attackPrototypeSample.setUser(user);
        Utils.attackPrototypeSample.setDetectionPoint(detPoint);
        Utils.attackPrototypeSample.setDetectionSystem(detectionSystem);
        Utils.attackPrototypeSample.setResource(resource);
        Utils.attackPrototypeSample.setMetadata(metadata);
        Utils.attackPrototypeSample.setRule(rule);

        Utils.responsePrototypeSample = new Response();
        Utils.responsePrototypeSample.setUser(user);
        Utils.responsePrototypeSample.setInterval(interval);
        Utils.responsePrototypeSample.setDetectionSystem(detectionSystem);
        Utils.responsePrototypeSample.setMetadata(metadata);
        Utils.responsePrototypeSample.setDetectionPoint(detPoint);
        Utils.responsePrototypeSample.setRule(rule);
    }

    public static resolvePath(relativeToFileURL: string, fileLocation: string): string {
        let __dirname = process.cwd();
        if (relativeToFileURL.length > 0) {
            const __filename = fileURLToPath(relativeToFileURL);
            __dirname = dirname(__filename);
        }

        const resolvedPath = resolve(__dirname, fileLocation);

        // console.log(resolvedPath);

        return resolvedPath;
    } 

	public static sleep(timeOutInMilis: number): Promise<null> {
		return new Promise((resolve, reject) => {
			setTimeout(() => {
				resolve(null);
			}, timeOutInMilis);
		});

	}

    public static setPrototypeInDepth(target: Object, source: Object) {
        const sourceProto = Object.getPrototypeOf(source);
        Object.setPrototypeOf(target, sourceProto);

        const entries: [string, any][] = Object.entries(target);

        for (let i = 0; i < entries.length; i++) {
            const element: [string, any] = entries[i];
            
            const sourcePropDescr = Object.getOwnPropertyDescriptor(source, element[0]);

            if (sourcePropDescr) {
                if (element[1] instanceof Array) {
                
                    if (element[1].length > 0 &&
                        element[1][0] instanceof Object) {
                        
                        if (sourcePropDescr.value instanceof Array) {
    
                            for (let a = 0; a < element[1].length; a++) {
                                const arEl = element[1][a];
    
                                this.setPrototypeInDepth(arEl, sourcePropDescr.value[0]);

                                if (Utils.isIValidateInitialize(arEl)) {
                                    arEl.checkValidInitialize();
                                }
                            }
                        }
                    }
    
    
                } else if (element[1] instanceof Object) {
    
                    this.setPrototypeInDepth(element[1], sourcePropDescr.value);

                    if (Utils.isIValidateInitialize(element[1])) {
                        element[1].checkValidInitialize();
                    }
                }
            }
        }

        if (Utils.isIValidateInitialize(target)) {
            target.checkValidInitialize();
        }
    }

    public static isIValidateInitialize(obj: any): obj is IValidateInitialize {
        return (obj as IValidateInitialize).checkValidInitialize !== undefined;
    }
   

    public static setTimestampFromJSONParsedObject(target: AppSensorEvent | Attack | Response, obj: Object) {
        const propDescr = Object.getOwnPropertyDescriptor(obj, "timestamp");
        if (propDescr) {
            target.setTimestamp(new Date(propDescr.value));
        }
    }

    public static setPrototypeInDepthByClassName(target: Object, className: string) {
        switch (className) {
            case 'AppSensorEvent': {
                Utils.setPrototypeInDepth(target, Utils.appSensorEventPrototypeSample);
                Utils.setTimestampFromJSONParsedObject(target as AppSensorEvent, target);
                break;
            }
            case 'Attack': {
                Utils.setPrototypeInDepth(target, Utils.attackPrototypeSample);
                Utils.setTimestampFromJSONParsedObject(target as Attack, target);
                break;
            }
            case 'Response': {
                Utils.setPrototypeInDepth(target, Utils.responsePrototypeSample);
                Utils.setTimestampFromJSONParsedObject(target as Response, target);
                break;
            }
        }

    }

    public static copyPropertyValues<T1 extends Object>(srcObj: T1, trgObj: T1) {
        const trgPropNames = Object.getOwnPropertyNames(trgObj);

        for (let index = 0; index < trgPropNames.length; index++) {
            const trgPropName = trgPropNames[index];
            const trgPropDecr: PropertyDescriptor | undefined = 
                    Object.getOwnPropertyDescriptor(trgObj, trgPropName);
            const srcPropDecr: PropertyDescriptor | undefined = 
                    Object.getOwnPropertyDescriptor(srcObj, trgPropName);
            if (!srcPropDecr) {
                throw new Error(`Cannot copy the value of property ${trgPropName} because doesn't exist in source object!`);
            }
            trgObj[trgPropName as keyof typeof trgObj] = srcObj[trgPropName as keyof typeof srcObj];
        }

    }

}

export {JSONConfigManager, JSONConfigReadValidate, Utils};
