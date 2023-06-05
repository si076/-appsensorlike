import { Instant, LocalDateTime } from "@js-joda/core";
import { Interval } from "@js-joda/extra";
import { JSONServerConfigurationReader } from "../../configuration-modes/appsensor-configuration-json/server/JSONServerConfig.js";
import { ServerConfiguration } from "../../core/configuration/server/server_configuration.js";
import { AppSensorEvent, Attack, DetectionPoint, Response } from "../../core/core.js";
import { ReportingEngineExt } from "../../reporting-engines/reporting-engines.js";
import { CategoryItem, Dates, Table, TimeFrameItem, TimeUnit, Type, ViewObject } from "./Reports.js";
import { UserReport } from "./UserReport.js";

class DashboardReport {

	private userReport: UserReport;

	// @Autowired
	// private DetectionPointController detectionPointController;

    private reportingEngine: ReportingEngineExt;

    constructor(reportingEngine: ReportingEngineExt,
                userController: UserReport) {
        this.userReport = userController;
        this.reportingEngine = reportingEngine;
    }

	// @PreAuthorize("hasAnyRole('VIEW_DATA')")
	// @RequestMapping(value="/api/dashboard/all", method = RequestMethod.GET)
	// @ResponseBody
	// public Map<String,Object> allContent(@RequestParam("earliest") String rfc3339Timestamp, @RequestParam("slices") int slices, @RequestParam("limit") Long limit) {
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

        //TODO
		// allContent.set("topDetectionPoints", detectionPointController.topDetectionPoints(earliest, limit));
		
		return allContent;
	}
	
	// @PreAuthorize("hasAnyRole('VIEW_DATA')")
	// @RequestMapping(value="/api/responses/active", method = RequestMethod.GET)
	// @ResponseBody
	// public Collection<Response> activeResponses(@RequestParam("earliest") String rfc3339Timestamp, @RequestParam("limit") Long limit) {
    public async activeResponses(earliest: string, limit: number): Promise<Response[]> {
        let activeResponses: Response[] = await this.reportingEngine.findResponses(earliest);

		const computedLimit = (limit != null) ? limit : Number.MAX_VALUE;

        activeResponses = activeResponses.filter(el => el.isActive());

        activeResponses = activeResponses.slice(0, computedLimit);
		
		return activeResponses;
	}
	
	// @PreAuthorize("hasAnyRole('VIEW_DATA')")
	// @RequestMapping(value="/api/dashboard/by-time-frame", method = RequestMethod.GET)
	// @ResponseBody
	// public Collection<TimeFrameItem> byTimeFrame() {
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

        items.push(TimeFrameItem.of(monthAgoEventCount, TimeUnit.MONTH, Type.EVENTS));
        items.push(TimeFrameItem.of(monthAgoResponseCount, TimeUnit.MONTH, Type.RESPONSES));
        items.push(TimeFrameItem.of(weekAgoEventCount,  TimeUnit.WEEK, Type.EVENTS));
        items.push(TimeFrameItem.of(weekAgoResponseCount,  TimeUnit.WEEK, Type.RESPONSES));
        items.push(TimeFrameItem.of(dayAgoEventCount,   TimeUnit.DAY, Type.EVENTS));
        items.push(TimeFrameItem.of(dayAgoResponseCount,   TimeUnit.DAY, Type.RESPONSES));
        items.push(TimeFrameItem.of(shiftAgoEventCount, TimeUnit.SHIFT, Type.EVENTS));
        items.push(TimeFrameItem.of(shiftAgoResponseCount, TimeUnit.SHIFT, Type.RESPONSES));
        items.push(TimeFrameItem.of(hourAgoEventCount,  TimeUnit.HOUR, Type.EVENTS));
        items.push(TimeFrameItem.of(hourAgoResponseCount,  TimeUnit.HOUR, Type.RESPONSES));

        return items;
	}
	
	// @PreAuthorize("hasAnyRole('VIEW_DATA')")
	// @RequestMapping(value="/api/dashboard/by-category", method = RequestMethod.GET)
	// @ResponseBody
	// public Collection<CategoryItem> byCategory(@RequestParam("earliest") String rfc3339Timestamp) {
    public async byCategory(earliest: string): Promise<CategoryItem[]> {
        const items: CategoryItem[] = [];

		const maxItems = 5;
		
		let events = await this.reportingEngine.findEvents(earliest);
		let attacks = await this.reportingEngine.findAttacks(earliest);
		
        const configuredDetectionPointCategories = await this.getConfiguredDetectionPointCategories();
		for (const category of configuredDetectionPointCategories) {

            events = events.filter(el => el.getDetectionPoint() ? el.getDetectionPoint()!.getCategory() === category : false);
            attacks = attacks.filter(el => el.getDetectionPoint() ? el.getDetectionPoint()!.getCategory() === category : false);

			const countByLabel = new Table<string, Type, number>();
			
			for (const event of events) {
                let label = '';
                if (event.getDetectionPoint()) {
                    //no mutation of the detection point; the label is ensured by the config reader
                    label = event.getDetectionPoint()!.getLabel()!;
                }
				
				let count = countByLabel.get(label, Type.EVENTS);
				
				if (count === undefined) {
					count = 0;
				}
				
				count++;
				
				countByLabel.put(label, Type.EVENTS, count);
			}
			
			for (const attack of attacks) {
                let label = '';
                if (attack.getDetectionPoint()) {
                    //no mutation of the detection point; the label is ensured by the config reader
                    label = attack.getDetectionPoint()!.getLabel()!;
                }
				
				let count = countByLabel.get(label, Type.ATTACKS);
				
				if (count === undefined) {
					count = 0;
				}
				
				count++;
				
				countByLabel.put(label, Type.ATTACKS, count);
			}
			
			events = this.latest<AppSensorEvent>(events, maxItems);
			attacks = this.latest<Attack>(attacks, maxItems);
			
			items.push(CategoryItem.of(category, events.length, attacks.length, countByLabel, events, attacks));
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
	// @PreAuthorize("hasAnyRole('VIEW_DATA')")
	// @RequestMapping(value="/api/events/grouped", method = RequestMethod.GET)
	// @ResponseBody
	// public ViewObject groupedEvents(@RequestParam("earliest") String rfc3339Timestamp, @RequestParam("slices") int slices) {
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
	
	// private Map<String, String> generateCategoryKeyMappings() {
	// 	Map<String, String> categoryKeyMappings = new HashMap<>();
		
	// 	int i = 1;
	// 	for (String category : this.reportingEngine.getConfiguredDetectionPointCategories()) {
	// 		categoryKeyMappings.put(category, "a" + String.valueOf(i));
	// 		i++;
	// 	}
		
	// 	return categoryKeyMappings;
	// }
	
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