import { LocalDateTime } from "@js-joda/core";
import { Interval } from "@js-joda/extra";

import { AppSensorEvent, Attack, DetectionPoint, Response, Utils } from "../../core/core.js";
import { ReportingEngineExt } from "../../reporting-engines/reporting-engines.js";
import { BaseReport } from "./BaseReport.js";
import { Dates, NAME_EVENT_COUNT, Table, TimeFrameItem, TimeUnit, Type, ViewObject } from "./Reports.js";

class DetectionPointReport extends BaseReport {

    constructor(reportingEngine: ReportingEngineExt) {
        super(reportingEngine);
    }

    public async allContent(category: string, label: string, earliest: string, limit: number, slices: number): Promise<Map<string,Object>> { 
        const allContent = new Map<string,Object>();
		
        const byTimeFrame = await this.byTimeFrame(category, label);
		allContent.set("byTimeFrame", byTimeFrame);

        const configuration = await this.configuration(label);
		allContent.set("configuration", configuration);

        const recentEvents = await this.recentEvents(label, earliest, limit);
		allContent.set("recentEvents", recentEvents);

        const recentAttacks = await this.recentAttacks(label, earliest, limit)
		allContent.set("recentAttacks", recentAttacks);

        const byClientApplication = await this.byClientApplication(label, earliest);
		allContent.set("byClientApplication", byClientApplication);
        
        const topUsers = await this.topUsers(label, earliest, limit);
		allContent.set("topUsers", topUsers);

        const groupedDetectionPoints = await this.groupedDetectionPoints(label, earliest, slices);
		allContent.set("groupedDetectionPoints", groupedDetectionPoints);

		return allContent;
	}
	
    public async byTimeFrame(category: string, label: string): Promise<TimeFrameItem[]> {
        const items: TimeFrameItem[] = [];
        
        const now = LocalDateTime.now();
        const monthAgo = now.minusMonths(1);
        const weekAgo = now.minusWeeks(1);
        const dayAgo = now.minusDays(1);
        const shiftAgo = now.minusHours(8);
        const hourAgo = now.minusHours(1);
		
		const monthAgoEventCount = await this.reportingEngine.countEventsByCategoryLabel(monthAgo.toString(), category, label);
		const weekAgoEventCount = await this.reportingEngine.countEventsByCategoryLabel(weekAgo.toString(), category, label);
		const dayAgoEventCount = await this.reportingEngine.countEventsByCategoryLabel(dayAgo.toString(), category, label);
		const shiftAgoEventCount = await this.reportingEngine.countEventsByCategoryLabel(shiftAgo.toString(), category, label);
		const hourAgoEventCount = await this.reportingEngine.countEventsByCategoryLabel(hourAgo.toString(), category, label);
		
		const monthAgoResponseCount = await this.reportingEngine.countAttacksByCategoryLabel(monthAgo.toString(), category, label);
		const weekAgoResponseCount = await this.reportingEngine.countAttacksByCategoryLabel(weekAgo.toString(), category, label);
		const dayAgoResponseCount = await this.reportingEngine.countAttacksByCategoryLabel(dayAgo.toString(), category, label);
		const shiftAgoResponseCount = await this.reportingEngine.countAttacksByCategoryLabel(shiftAgo.toString(), category, label);
		const hourAgoResponseCount = await this.reportingEngine.countAttacksByCategoryLabel(hourAgo.toString(), category, label);
	
		items.push(TimeFrameItem.of(monthAgoEventCount, TimeUnit.MONTH, Type.EVENT));
		items.push(TimeFrameItem.of(monthAgoResponseCount, TimeUnit.MONTH, Type.ATTACK));
		items.push(TimeFrameItem.of(weekAgoEventCount,  TimeUnit.WEEK, Type.EVENT));
		items.push(TimeFrameItem.of(weekAgoResponseCount,  TimeUnit.WEEK, Type.ATTACK));
		items.push(TimeFrameItem.of(dayAgoEventCount,   TimeUnit.DAY, Type.EVENT));
		items.push(TimeFrameItem.of(dayAgoResponseCount,   TimeUnit.DAY, Type.ATTACK));
		items.push(TimeFrameItem.of(shiftAgoEventCount, TimeUnit.SHIFT, Type.EVENT));
		items.push(TimeFrameItem.of(shiftAgoResponseCount, TimeUnit.SHIFT, Type.ATTACK));
		items.push(TimeFrameItem.of(hourAgoEventCount,  TimeUnit.HOUR, Type.EVENT));
		items.push(TimeFrameItem.of(hourAgoResponseCount,  TimeUnit.HOUR, Type.ATTACK));

		return items;
	}
	
    public async configuration(label: string): Promise<string> {
        const configuredDetPoints = await this.getConfiguredDetectionPoints(label);

        return JSON.stringify(configuredDetPoints);
	}
	
    public async recentEvents(label: string, earliest: string, limit: number): Promise<AppSensorEvent[]> {

		return super.recentEvents(label, earliest, limit, this.filterByDetectionPointLabel(label));
	}
	
    public async recentAttacks(label: string, earliest: string, limit: number): Promise<Attack[]> {

		return super.recentAttacks(label, earliest, limit, this.filterByDetectionPointLabel(label));
	}
	
	// seen by these client apps
    public async byClientApplication(label: string, earliest: string): Promise<string> {
        const table = new Table<string,Type,number>();
	
        await this.filterAndCount(label, earliest, Type.EVENT, 
                                  this.filterByDetectionPointLabel(label), 
                                  this.getDetectionSystemId,
                                  table);

        await this.filterAndCount(label, earliest, Type.ATTACK, 
                                  this.filterByDetectionPointLabel(label), 
                                  this.getDetectionSystemId,
                                  table);

		return JSON.stringify(table);
	}
	
    public async topUsers(label: string, earliest: string, limit: number): Promise<NAME_EVENT_COUNT> {
        const map = new Map<string, number>();
        
        let events = await this.reportingEngine.findEvents(earliest);
        events = events.filter(this.filterByDetectionPointLabel(label));
	    
        const keyFunc = (value: AppSensorEvent | Attack | Response) => {
            return Utils.getUserName(value.getUser());
        };

        this.countStoreInMap(events, keyFunc, map);


		const mapEntries = map.entries();
        let toArray: [string, number][] = [];
        for (const entry of mapEntries) {
            toArray.push(entry);
        }

        toArray.sort((a, b) => {
            return (a[1] - b[1]) * -1;
        });

        toArray = toArray.slice(0, limit);

		const filtered: NAME_EVENT_COUNT = {};
        toArray.forEach(el => {
            filtered[el[0]] = el[1];
        });

        return filtered;
	}
	
    public async groupedDetectionPoints(label: string, earliest: string, slices: number): Promise<ViewObject<number>> {
        const startingTime = new Date(earliest).getTime();

		let events = await this.reportingEngine.findEvents(earliest);
        events = events.filter(this.filterByDetectionPointLabel(label));

		let attacks = await this.reportingEngine.findAttacks(earliest);
		attacks = attacks.filter(this.filterByDetectionPointLabel(label));

		const now = new Date().getTime();
		
		const ranges = Dates.splitRange(startingTime, now, slices);

        const categories = [Type.EVENTS, Type.ATTACKS];
		
		// timestamp, category, count
		const timestampCategoryCounts = this.generateTimestampCounts(ranges, events, attacks);
		
		const viewObject = new ViewObject(timestampCategoryCounts.getAsMorrisData(), categories);
		
		return viewObject;
	}
	
    public async topDetectionPoints(earliest: string, 
                                    limit: number | undefined = undefined): Promise<NAME_EVENT_COUNT> {
        const map = new Map<string, number>();
		
		let events = await this.reportingEngine.findEvents(earliest);

        const keyFunc = (value: AppSensorEvent | Attack | Response) => {
            return JSON.stringify(value.getDetectionPoint());
        };

	    this.countStoreInMap(events, keyFunc, map);

		
        const mapEntries = map.entries();
        let toArray: [string, number][] = [];
        for (const entry of mapEntries) {
            toArray.push(entry);
        }

        toArray.sort((a, b) => {
            return (a[1] - b[1]) * -1; //descending
        });

        toArray = toArray.slice(0, limit);

		const filtered: NAME_EVENT_COUNT = {};
        toArray.forEach(el => {
            filtered[el[0]] = el[1];
        });

		return filtered;
	}
	
	private generateTimestampCounts(ranges: Interval[], 
                                    events: AppSensorEvent[], 
                                    attacks: Attack[]): Table<string, string, number> {

                                        const table = new Table<string, string, number>();

        ranges.forEach(range => {
            const timestampStr = range.end().toString();
            
            table.put(timestampStr, Type.EVENTS, 0);
            table.put(timestampStr, Type.ATTACKS, 0);
        });
		
        this.countInRangeStoreInTable(events, Type.EVENTS, ranges, table);
        this.countInRangeStoreInTable(attacks, Type.ATTACKS, ranges, table);

		return table;
	}

}

export {DetectionPointReport}