import { Instant, LocalDateTime } from "@js-joda/core";
import { Interval } from "@js-joda/extra";

import { JSONServerConfigurationReader } from "@appsensorlike/appsensorlike/configuration-modes/appsensor-configuration-json/server/JSONServerConfig.js";
import { ServerConfiguration } from "@appsensorlike/appsensorlike/core/configuration/server/server_configuration.js";
import { AppSensorEvent, Attack, DetectionPoint, Response } from "@appsensorlike/appsensorlike/core/core.js";
import { ReportingEngineExt } from "@appsensorlike/appsensorlike/reporting-engines/reporting-engines.js";
import { DetectionPointReport } from "./DetectionPointReport.js";
import { CategoryItem, Dates, Table, TimeFrameItem, TimeUnit, Type, ViewObject } from "./Reports.js";
import { UserReport } from "./UserReport.js";

class DashboardReport {

	private userReport: UserReport;
	private detectionPointReport: DetectionPointReport;

    private reportingEngine: ReportingEngineExt;

    constructor(reportingEngine: ReportingEngineExt,
                userReport: UserReport,
				detectionPointReport: DetectionPointReport) {
        this.userReport = userReport;
        this.reportingEngine = reportingEngine;
		this.detectionPointReport = detectionPointReport;
    }

    public async allContent(earliest: string, slices: number, limit: number): Promise<Map<string,Object>> {
        const allContent = new Map<string,Object>();
		
        const activeResponses = await this.activeResponses(earliest, limit);
		allContent.set("activeResponses", activeResponses);

        const byTimeFrame = await this.byTimeFrame();
		allContent.set("byTimeFrame", byTimeFrame);

        const byCategory = await this.byCategory(earliest);
		allContent.set("byCategory", byCategory);

        const groupedEvents = await this.groupedEvents(earliest, slices)
		allContent.set("groupedEvents", groupedEvents);

        const topUsers = await this.userReport.topUsers(earliest, limit)
		allContent.set("topUsers", topUsers);

		const topDetectionPoints = await this.detectionPointReport.topDetectionPoints(earliest, limit)
		allContent.set("topDetectionPoints", topDetectionPoints);
		
		return allContent; 
	}
	
    public async activeResponses(earliest: string, limit: number): Promise<Response[]> {
        let activeResponses: Response[] = await this.reportingEngine.findResponses(earliest);

		const computedLimit = (limit != null) ? limit : Number.MAX_VALUE;

        activeResponses = activeResponses.filter(el => el.isActive());

        activeResponses = activeResponses.slice(0, computedLimit);
		
		return activeResponses;
	}
	
    public async byTimeFrame(): Promise<TimeFrameItem[]> {
        const items: TimeFrameItem[] = [];
		
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

        items.push(TimeFrameItem.of(monthAgoEventCount, TimeUnit.MONTH, Type.EVENT));
        items.push(TimeFrameItem.of(monthAgoResponseCount, TimeUnit.MONTH, Type.RESPONSE));
        items.push(TimeFrameItem.of(weekAgoEventCount,  TimeUnit.WEEK, Type.EVENT));
        items.push(TimeFrameItem.of(weekAgoResponseCount,  TimeUnit.WEEK, Type.RESPONSE));
        items.push(TimeFrameItem.of(dayAgoEventCount,   TimeUnit.DAY, Type.EVENT));
        items.push(TimeFrameItem.of(dayAgoResponseCount,   TimeUnit.DAY, Type.RESPONSE));
        items.push(TimeFrameItem.of(shiftAgoEventCount, TimeUnit.SHIFT, Type.EVENT));
        items.push(TimeFrameItem.of(shiftAgoResponseCount, TimeUnit.SHIFT, Type.RESPONSE));
        items.push(TimeFrameItem.of(hourAgoEventCount,  TimeUnit.HOUR, Type.EVENT));
        items.push(TimeFrameItem.of(hourAgoResponseCount,  TimeUnit.HOUR, Type.RESPONSE));

        return items;
	}
	
    public async byCategory(earliest: string): Promise<CategoryItem[]> {
        const items: CategoryItem[] = [];

		const maxItems = 5;
		
		let events = await this.reportingEngine.findEvents(earliest);
		let attacks = await this.reportingEngine.findAttacks(earliest);
		
        const configuredDetectionPointCategories = await this.getConfiguredDetectionPointCategories();
		for (const category of configuredDetectionPointCategories) {

            let filteredEvents = events.filter(el => el.getDetectionPoint() ? el.getDetectionPoint()!.getCategory() === category : false);
            let filteredAttacks = attacks.filter(el => el.getDetectionPoint() ? el.getDetectionPoint()!.getCategory() === category : false);

			const countByLabel = new Table<string, Type, number>();
			
			for (const event of filteredEvents) {
                let label = '';
                if (event.getDetectionPoint()) {
                    //no mutation of the detection point; the label is ensured by the config reader
                    label = event.getDetectionPoint()!.getLabel()!;
                }
				
				let count = countByLabel.get(label, Type.EVENT);
				
				if (count === undefined) {
					count = 0;
				}
				
				count++;
				
				countByLabel.put(label, Type.EVENT, count);
			}
			
			for (const attack of filteredAttacks) {
                let label = '';
                if (attack.getDetectionPoint()) {
                    //no mutation of the detection point; the label is ensured by the config reader
                    label = attack.getDetectionPoint()!.getLabel()!;
                }
				
				let count = countByLabel.get(label, Type.ATTACK);
				
				if (count === undefined) {
					count = 0;
				}
				
				count++;
				
				countByLabel.put(label, Type.ATTACK, count);
			}
			
			filteredEvents = this.latest<AppSensorEvent>(filteredEvents, maxItems);
			filteredAttacks = this.latest<Attack>(filteredAttacks, maxItems);
			
			items.push(CategoryItem.of(category, filteredEvents.length, filteredAttacks.length, countByLabel, filteredEvents, filteredAttacks));
		}
		
		return items;
	}
	
	private latest<T>(array: T[], limit: number): T[] {
		return array.reverse().slice(0, limit);
	}
	
	// pull events from "earliest" until now 
	// build "slices" # (e.g. 20) of equal time ranges from "earliest" to now
	// group events by time frame. 
	// 
	// example: "earliest" is 20 days ago, and "slices" is 20. 
	// there would be a time range for each day, and you would count how many events applied to that day grouped by detection point category
	// something like 
	// [ 
	//	day1/cat1/5, day1/cat2/1, day1/cat3/14,
	//  day2/cat1/7, day2/cat2/0, day2/cat3/47,
	//  day3/cat1/2, day3/cat2/3, day3/cat3/53,
	//  ...
	// ]
	// 
	// this function drives the dashboard and is specifically formatted for an morris.js graph
	// 
    public async groupedEvents(earliest: string, slices: number): Promise<ViewObject<number>> {
        const startingTime = new Date(earliest).getTime();  

        let events = await this.reportingEngine.findEvents(earliest);
		
        const now = new Date().getTime();
        
        const ranges = Dates.splitRange(startingTime, now, slices);

		const categories = await this.getConfiguredDetectionPointCategories(); //this.generateCategoryKeyMappings();
		
		// timestamp, category, count
		const timestampCategoryCounts = this.generateTimestampCategoryCounts(ranges, categories, events);
		
		const viewObject = new ViewObject(timestampCategoryCounts.getAsMorrisData(), categories);
		
		return viewObject;
	}
	
	private generateTimestampCategoryCounts(ranges: Interval[],
                                            categories: string[],
                                            events: AppSensorEvent[]): Table<string, string, number> {
		
        const table = new Table<string, string, number>();
		
        ranges.forEach(range => {
            const timestampStr = range.end().toString();
			
			for (const category of categories) {
				table.put(timestampStr, category, 0);
			}
		});
		
		for (const event of events) {
			const eventDate = event.getTimestamp().getTime();
			
			intervalLoop: for(const range of ranges) {
				if (range.contains(Instant.ofEpochMilli(eventDate))) {
					const timestampStr = range.end().toString();

					let category = '';
                    if (event.getDetectionPoint()) {
                        //no mutation of detection point
                        category = event.getDetectionPoint()!.getCategory();
                    }

					let count = table.get(timestampStr, category)!; //already ensured 
					
					count++;
					
					table.put(timestampStr, category, count);
					
					break intervalLoop;
				}
			}
		}
		
		return table;
	}
	
	private async getConfiguredDetectionPointCategories(): Promise<string[]> {
		const categories: string[] = [];
		
		const serverConfigurationString = await this.reportingEngine.getServerConfigurationAsJson();

        const config: ServerConfiguration | null = new JSONServerConfigurationReader().readFromString(serverConfigurationString);

        if (config) {
            for (const detectionPoint of config.getDetectionPoints()) {
                const category = detectionPoint.getCategory();
                if (categories.indexOf(category) === -1) {
                    categories.push(category);
                }
            }
            
            categories.sort();
        }
		
		return categories;
	}
	
	public async getConfiguredDetectionPoints(label: string): Promise<DetectionPoint[]> {
		let detectionPoints: DetectionPoint[] = [];
		
		const serverConfigurationString = await this.reportingEngine.getServerConfigurationAsJson();

        const config: ServerConfiguration | null = new JSONServerConfigurationReader().readFromString(serverConfigurationString);

        if (config) {
            config.getDetectionPoints().forEach(dt => detectionPoints.push(dt));

            detectionPoints = detectionPoints.filter(dt => label === dt.getLabel());
        }
		
		return detectionPoints;
	}
		
}

export {DashboardReport}
