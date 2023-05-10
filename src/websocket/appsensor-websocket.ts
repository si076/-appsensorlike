import { AppSensorEvent, Attack, Response } from "../core/core.js";

interface IMethodRequest {
    id: string;
    methodName: string;
    parameters?: {
        [propertyName: string]: string | Object;
    }

}

interface IMethodResponse {
    id: string;
    methodName: string;
    result: number | Object | null | string;
    error?: string;
}

class MethodRequest implements IMethodRequest {
    id: string;
    methodName: string;
    parameters?: { [propertyName: string]: string | Object; };

    constructor(id: string, methodName: string, parameters?: { [propertyName: string]: string | Object; }) {
        this.id = id;
        this.methodName = methodName;
        this.parameters = parameters;
    }
}

class MethodResponse implements IMethodResponse {
    id: string;
    methodName: string;
    result: number | Object | null | string;
    error?: string;
    resultElementClass: string | null;

    constructor(id: string, 
                methodName: string, 
                result: number | Object | null | string,
                resultElementClass: string | null,
                error?: string) {
        this.id = id;
        this.methodName = methodName;
        this.result = result;
        this.resultElementClass = resultElementClass;
        this.error = error;
    }
}

export {MethodRequest, MethodResponse};