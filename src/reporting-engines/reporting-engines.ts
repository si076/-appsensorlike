import { ReportingEngine } from "../core/reporting/reporting.js";


interface ReportingEngineExt extends ReportingEngine {

	countEventsByCategoryLabel(earliest: string, category: string, label: string): Promise<number>;
	
	countAttacksByCategoryLabel(earliest: string, category: string, label: string): Promise<number>;
	
	countResponsesByCategoryLabel(earliest: string, category: string, label: string): Promise<number>;

}


export {ReportingEngineExt};