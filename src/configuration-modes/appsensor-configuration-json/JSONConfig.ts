import fs from 'fs';
import Ajv, { AnySchemaObject, ErrorObject } from "ajv"
import addFormats from "ajv-formats"

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

class JSONConfig {

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

    protected setPrototypeInDepth(target: Object, source: Object) {
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

export {JSONConfig};