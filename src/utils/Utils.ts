import fs from 'fs';
import Ajv, { AnySchemaObject, ErrorObject } from "ajv"
import addFormats from "ajv-formats"
import { AppSensorEvent, Attack, DetectionPoint, DetectionSystem, Interval, IPAddress, KeyValuePair, Resource, Response, Threshold, User } from '../core/core.js';
import { GeoLocation } from '../core/geolocation/geolocation.js';
import { Clause, Expression, Rule } from '../core/rule/rule.js';

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

class JSONConfigReadValidate {

    protected defaultConfigFile: string;
    protected defaultConfigSchemaFile: string | null;
    protected prototypeOfConfigObj: Object | null | undefined;

    constructor(defaultConfigFile: string, 
                defaultConfigSchemaFile: string | null = null, 
                prototypeOfConfigObj?: Object | null) {
        this.defaultConfigFile = defaultConfigFile;
        this.defaultConfigSchemaFile = defaultConfigSchemaFile;
        this.prototypeOfConfigObj = prototypeOfConfigObj;
    }

    public read(configLocation: string = '', 
                validatorLocation: string | null = null, 
                reload: boolean  = false): any {
        let config: any = null;

        if (configLocation === '') {
            configLocation = this.defaultConfigFile;
        };

        if (!validatorLocation) {
            validatorLocation = this.defaultConfigSchemaFile;
        };


        try {
            config = JSON.parse(fs.readFileSync(configLocation, 'utf8'));
        } catch (error) {
            if (!reload) {
                throw error;
            } else {
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

        return config;
    }



    protected validateConfig(config: any, validatorLocation: string, reload: boolean): boolean {

        const schema = JSON.parse(fs.readFileSync(validatorLocation, 'utf8'));

        const ajv = new Ajv({strict:true, allowUnionTypes: true, allErrors:true});
        addFormats(ajv);

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
    }

    public static setTimestampFromJSONParsedObject(target: AppSensorEvent | Attack | Response, obj: Object) {
        const propDescr = Object.getOwnPropertyDescriptor(obj, "timestamp");
        if (propDescr) {
            target.setTimestamp(new Date(propDescr.value));
        }
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
                            }
                        }
                    }
    
    
                } else if (element[1] instanceof Object) {
    
                    this.setPrototypeInDepth(element[1], sourcePropDescr.value);
                }
            }
        }
    }

}

export {JSONConfigReadValidate, Utils};
