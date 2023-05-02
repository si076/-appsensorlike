import { AppSensorEvent, Attack, Response } from "../../core/core";

interface IReportingMethodRequest {
    id: string;
    reportingMethodName: string;
    parameters?: {
        [propertyName: string]: string;
    }

}

interface IReportingMethodResponse {
    id: string;
    reportingMethodName: string;
    result: number | AppSensorEvent[] | Attack[] | Response[] | null | string | AppSensorEvent | Attack | Response;
    error?: string;
}

class ReportingMethodRequest implements IReportingMethodRequest {
    id: string;
    reportingMethodName: string;
    parameters?: { [propertyName: string]: string; };

    constructor(id: string, reportingMethodName: string, parameters?: { [propertyName: string]: string; }) {
        this.id = id;
        this.reportingMethodName = reportingMethodName;
        this.parameters = parameters;
    }
}

class ReportingMethodResponse implements IReportingMethodResponse {
    id: string;
    reportingMethodName: string;
    result: number | AppSensorEvent[] | Attack[] | Response[] | null | string | AppSensorEvent | Attack | Response;
    error?: string;

    constructor(id: string, reportingMethodName: string, 
                result: number | AppSensorEvent[] | Attack[] | Response[] | null | string | AppSensorEvent | Attack | Response,
                error?: string) {
        this.id = id;
        this.reportingMethodName = reportingMethodName;
        this.result = result;
        this.error = error;
    }
}

export {ReportingMethodRequest, ReportingMethodResponse};