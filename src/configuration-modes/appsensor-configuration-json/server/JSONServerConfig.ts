import fs from 'fs';
import EventEmitter from 'events';
import Ajv, { AnySchemaObject, ErrorObject } from "ajv"
import addFormats from "ajv-formats"

import { ServerConfiguration, ServerConfigurationReader } from "../../../core/configuration/server/server_configuration.js";
import { Clause, Expression, Rule } from '../../../core/rule/rule.js';
import { ClientApplication, DetectionPoint, DetectionSystem, Interval, IPAddress, KeyValuePair, Response, Threshold, User } from '../../../core/core.js';
import { CorrelationSet } from '../../../core/correlation/correlation.js';
import { GeoLocation } from '../../../core/geolocation/geolocation.js';
import { Role } from '../../../core/accesscontrol/accesscontrol.js';

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

class JSONServerConfiguration extends ServerConfiguration {
}

class JSONServerConfigurationReader implements ServerConfigurationReader {

    private configFile: string = 'appsensor-server-config.json';
    private configSchemaFile: string = 'appsensor-server-config_schema.json'; 

    private static configPrototypesSample: JSONServerConfiguration;

    static {
        JSONServerConfigurationReader.configPrototypesSample = new JSONServerConfiguration();

        const interval = new Interval();

        const ipAddress = new IPAddress();
        ipAddress.setGeoLocation(new GeoLocation(0, 0));

        const user = new User();
        user.setIPAddress(ipAddress);

        const response = new Response();
        response.setInterval(interval);
        response.setDetectionSystem(new DetectionSystem('', ipAddress));
        response.setMetadata([new KeyValuePair()]);

        const threshold = new Threshold();
        threshold.setInterval(interval);

        const detPoint = new DetectionPoint();
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

        JSONServerConfigurationReader.configPrototypesSample.rules = [rule];


        JSONServerConfigurationReader.configPrototypesSample.detectionPoints = [detPoint];

        const correlSet = new CorrelationSet();
        JSONServerConfigurationReader.configPrototypesSample.correlationSets = [correlSet];

        const clientAppl = new ClientApplication();
        clientAppl.setIpAddress(ipAddress);

        JSONServerConfigurationReader.configPrototypesSample.clientApplications = [clientAppl];
    }

    read(configurationLocation: string = '', validatorLocation: string | null = '', reload: boolean = false): ServerConfiguration | null {
        let config: ServerConfiguration | null = null;


        if (configurationLocation === '') {
            configurationLocation = this.configFile;
            // throw new Error('JSONServerConfigurationReader: configurationLocation cannot be null!');
        };

        if (validatorLocation === '') {
            validatorLocation = this.configSchemaFile;
            // throw new Error('JSONServerConfigurationReader: validatorLocation cannot be null!');
        };

        try {
            // config = JSON.parse(fs.readFileSync(configurationLocation, 'utf8'), (key, value) => {
            //     console.log(key + ' -> ' + value);
            // });
            config = JSON.parse(fs.readFileSync(configurationLocation, 'utf8'));
            if (config) {
                this.setPrototypeInDepth(config, JSONServerConfigurationReader.configPrototypesSample);

                //set detection points' label to be as id 
                //for more details about that change in the original java code 
                //see https://github.com/jtmelton/appsensor/issues/18
                this.adjustDetectionPoints(config.getDetectionPoints());

            }
        } catch (error) {
            if (!reload) {
                throw error;
            } else {
                console.error(error);
            }
        }

        if (config && validatorLocation !== null) {
            // console.log('Validating config...');

            const validationResult = this.validateConfig(config, validatorLocation);
            if (validationResult) {
                //There is(are) validation error(s)
                config = null;
    
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
        }
        
        return config;
    }

    private validateConfig(config: ServerConfiguration, validatorLocation: string): ErrorObject<string, Record<string, any>, unknown>[] | null | undefined {
        // console.log('>>> ConfigurationManager.validateConfig');
        const schema = JSON.parse(fs.readFileSync(validatorLocation, 'utf8'));

        const ajv = new Ajv({strict:true, allowUnionTypes: true, allErrors:true});
        addFormats(ajv);

        const validate = ajv.compile(schema);
        validate(config);

        // console.log('<<< ConfigurationManager.validateConfig');

        return validate.errors;
    }

    setPrototypeInDepth(target: Object, source: Object) {
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

    adjustDetectionPoints(detPoints: DetectionPoint[]) {
        if (detPoints) {
            detPoints.forEach(el => {
                el.setLabel(el.getId());
            });
        }
    }

    public static test() {
        const inst = new JSONServerConfigurationReader();
        const config: ServerConfiguration | null = inst.read();

        console.log(JSON.stringify(config!.getDetectionPoints()[0].getThreshold(), null, 2));
    }

}

export {JSONServerConfigurationReader};