import { AppSensorEvent, Attack, Response } from "../../core/core";
import { ReportingEngine } from "../../core/reporting/reporting";

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
    resultElementClass: string | null;

    constructor(id: string, reportingMethodName: string, 
                result: number | AppSensorEvent[] | Attack[] | Response[] | null | string | AppSensorEvent | Attack | Response,
                resultElementClass: string | null,
                error?: string) {
        this.id = id;
        this.reportingMethodName = reportingMethodName;
        this.result = result;
        this.resultElementClass = resultElementClass;
        this.error = error;
    }
}

interface ReportingEngineExt extends ReportingEngine {

	countEventsByCategoryLabel(earliest: string, category: string, label: string): Promise<number>;
	
	countAttacksByCategoryLabel(earliest: string, category: string, label: string): Promise<number>;
	
	countResponsesByCategoryLabel(earliest: string, category: string, label: string): Promise<number>;

}

export {ReportingMethodRequest, ReportingMethodResponse, ReportingEngineExt};