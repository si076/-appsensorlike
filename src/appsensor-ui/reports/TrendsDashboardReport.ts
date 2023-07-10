import { LocalDateTime } from "@js-joda/core";

import { ReportingEngineExt } from "@appsensorlike/appsensorlike/reporting-engines/reporting-engines.js";
import { BaseReport } from "./BaseReport.js";
import { TimeUnit, TrendItem, Type } from "./Reports.js";

class TrendsDashboardReport extends BaseReport {

    constructor(reportingEngine: ReportingEngineExt) {
        super(reportingEngine);
    }

    public async countEvents(): Promise<TrendItem[]> {
        const trends: TrendItem[] = [];
		
        const now = LocalDateTime.now();
        const monthAgo = now.minusMonths(1);
        const weekAgo = now.minusWeeks(1);
        const dayAgo = now.minusDays(1);
        const shiftAgo = now.minusHours(8);
        const hourAgo = now.minusHours(1);
        
        const monthAgoEventCount = await this.reportingEngine.countEvents(monthAgo.toString());
        const weekAgoEventCount = await this.reportingEngine.countEvents(weekAgo.toString());
        const dayAgoEventCount = await this.reportingEngine.countEvents(dayAgo.toString());
        const shiftAgoEventCount = await this.reportingEngine.countEvents(shiftAgo.toString());
        const hourAgoEventCount = await this.reportingEngine.countEvents(hourAgo.toString());
        
        const monthAgoResponseCount = await this.reportingEngine.countResponses(monthAgo.toString());
        const weekAgoResponseCount = await this.reportingEngine.countResponses(weekAgo.toString());
        const dayAgoResponseCount = await this.reportingEngine.countResponses(dayAgo.toString());
        const shiftAgoResponseCount = await this.reportingEngine.countResponses(shiftAgo.toString());
        const hourAgoResponseCount = await this.reportingEngine.countResponses(hourAgo.toString());
		
		trends.push(TrendItem.of(monthAgoEventCount, TimeUnit.MONTH, Type.EVENT));
		trends.push(TrendItem.of(monthAgoResponseCount, TimeUnit.MONTH, Type.RESPONSE));
		trends.push(TrendItem.compute(weekAgoEventCount,  TimeUnit.WEEK, 
									 monthAgoEventCount, TimeUnit.MONTH, Type.EVENT));
		trends.push(TrendItem.compute(weekAgoResponseCount,  TimeUnit.WEEK, 
				 					 monthAgoResponseCount, TimeUnit.MONTH, Type.RESPONSE));
		trends.push(TrendItem.compute(dayAgoEventCount,   TimeUnit.DAY, 
				 					 monthAgoEventCount, TimeUnit.MONTH, Type.EVENT));
		trends.push(TrendItem.compute(dayAgoResponseCount,   TimeUnit.DAY, 
									 monthAgoResponseCount, TimeUnit.MONTH, Type.RESPONSE));
		trends.push(TrendItem.compute(shiftAgoEventCount, TimeUnit.SHIFT, 
									 monthAgoEventCount, TimeUnit.MONTH, Type.EVENT));
		trends.push(TrendItem.compute(shiftAgoResponseCount, TimeUnit.SHIFT, 
				 				 	 monthAgoResponseCount, TimeUnit.MONTH, Type.RESPONSE));
		trends.push(TrendItem.compute(hourAgoEventCount,  TimeUnit.HOUR, 
						 			 monthAgoEventCount, TimeUnit.MONTH, Type.EVENT));
		trends.push(TrendItem.compute(hourAgoResponseCount,  TimeUnit.HOUR, 
									 monthAgoResponseCount, TimeUnit.MONTH, Type.RESPONSE));

		return trends;
	}
	
	
}

export {TrendsDashboardReport}