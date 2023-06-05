import { LocalDateTime } from "@js-joda/core";
import { Interval } from "@js-joda/extra";

import { AppSensorEvent, Attack, DetectionPoint, Response, Utils } from "../../core/core.js";
import { ReportingEngineExt } from "../../reporting-engines/reporting-engines.js";
import { BaseReport } from "./BaseReport.js";
import { Dates, Table, TimeFrameItem, TimeUnit, Type, ViewObject } from "./Reports.js";

class DetectionPointReport extends BaseReport {

    constructor(reportingEngine: ReportingEngineExt) {
        super(reportingEngine);
    }

	// @PreAuthorize("hasAnyRole('VIEW_DATA')")
	// @RequestMapping(value="/api/detection-points/{label}/all", method = RequestMethod.GET)
	// @ResponseBody
	// public Map<String,Object> allContent(@PathVariable("label") String label, @RequestParam("earliest") String rfc3339Timestamp, @RequestParam Long limit, @RequestParam int slices) { 
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
	
	// @PreAuthorize("hasAnyRole('VIEW_DATA')")
	// @RequestMapping(value="/api/detection-points/{label}/by-time-frame", method = RequestMethod.GET)
	// @ResponseBody
	// public Collection<TimeFrameItem> byTimeFrame(@PathVariable("label") String label) {
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
	
		items.push(TimeFrameItem.of(monthAgoEventCount, TimeUnit.MONTH, Type.EVENTS));
		items.push(TimeFrameItem.of(monthAgoResponseCount, TimeUnit.MONTH, Type.ATTACKS));
		items.push(TimeFrameItem.of(weekAgoEventCount,  TimeUnit.WEEK, Type.EVENTS));
		items.push(TimeFrameItem.of(weekAgoResponseCount,  TimeUnit.WEEK, Type.ATTACKS));
		items.push(TimeFrameItem.of(dayAgoEventCount,   TimeUnit.DAY, Type.EVENTS));
		items.push(TimeFrameItem.of(dayAgoResponseCount,   TimeUnit.DAY, Type.ATTACKS));
		items.push(TimeFrameItem.of(shiftAgoEventCount, TimeUnit.SHIFT, Type.EVENTS));
		items.push(TimeFrameItem.of(shiftAgoResponseCount, TimeUnit.SHIFT, Type.ATTACKS));
		items.push(TimeFrameItem.of(hourAgoEventCount,  TimeUnit.HOUR, Type.EVENTS));
		items.push(TimeFrameItem.of(hourAgoResponseCount,  TimeUnit.HOUR, Type.ATTACKS));

		return items;
	}
	
	// @PreAuthorize("hasAnyRole('VIEW_DATA')")
	// @RequestMapping(value="/api/detection-points/{label}/configuration", method = RequestMethod.GET)
	// @ResponseBody
	// public String configuration(@PathVariable("label") String label) {
    public async configuration(label: string): Promise<string> {
        const configuredDetPoints = await this.getConfiguredDetectionPoints(label);

        return JSON.stringify(configuredDetPoints);
	}
	
	// @PreAuthorize("hasAnyRole('VIEW_DATA')")
	// @RequestMapping(value="/api/detection-points/{label}/latest-events", method = RequestMethod.GET)
	// @ResponseBody
	// public Collection<Event> recentEvents(@PathVariable("label") String label, @RequestParam("earliest") String rfc3339Timestamp, @RequestParam("limit") Long limit) {
    public async recentEvents(label: string, earliest: string, limit: number): Promise<AppSensorEvent[]> {

		return super.recentEvents(label, earliest, limit, this.filterByDetectionPointLabel(label));
	}
	
	// @PreAuthorize("hasAnyRole('VIEW_DATA')")
	// @RequestMapping(value="/api/detection-points/{label}/latest-attacks", method = RequestMethod.GET)
	// @ResponseBody
	// public Collection<Attack> recentAttacks(@PathVariable("label") String label, @RequestParam("earliest") String rfc3339Timestamp, @RequestParam("limit") Long limit) {
    public async recentAttacks(label: string, earliest: string, limit: number): Promise<Attack[]> {

		return super.recentAttacks(label, earliest, limit, this.filterByDetectionPointLabel(label));
	}
	
	// seen by these client apps
	// @PreAuthorize("hasAnyRole('VIEW_DATA')")
	// @RequestMapping(value="/api/detection-points/{label}/by-client-application", method = RequestMethod.GET)
	// @ResponseBody
	// public String byClientApplication(@PathVariable("label") String label, @RequestParam("earliest") String rfc3339Timestamp) {
    public async byClientApplication(label: string, earliest: string): Promise<string> {
        const table = new Table<string,Type,number>();


		// Collection<Event> events = this.reportingEngine.findEvents(rfc3339Timestamp).stream().filter(e -> label.equals(e.getDetectionPoint().getLabel())).collect(Collectors.toList());
		// Collection<Attack> attacks = this.reportingEngine.findAttacks(rfc3339Timestamp).stream().filter(a -> label.equals(a.getDetectionPoint().getLabel())).collect(Collectors.toList());
		
		// for(Event event : events) {
		// 	Long count = table.get(event.getDetectionSystem().getDetectionSystemId(), Type.EVENT);
			
		// 	if (count == null) {
		// 		count = 0L;
		// 	}
			
		// 	count = count + 1L;
			
		// 	table.put(event.getDetectionSystem().getDetectionSystemId(), Type.EVENT, count);
		// }
		
		// for(Attack attack : attacks) {
		// 	Long count = table.get(attack.getDetectionSystem().getDetectionSystemId(), Type.ATTACK);
			
		// 	if (count == null) {
		// 		count = 0L;
		// 	}
			
		// 	count = count + 1L;
			
		// 	table.put(attack.getDetectionSystem().getDetectionSystemId(), Type.ATTACK, count);
		// }
		
        await this.filterAndCount(label, earliest, Type.EVENTS, 
                                  this.filterByDetectionPointLabel(label), 
                                  this.getDetectionSystemId,
                                  table);

        await this.filterAndCount(label, earliest, Type.ATTACKS, 
                                  this.filterByDetectionPointLabel(label), 
                                  this.getDetectionSystemId,
                                  table);

		return JSON.stringify(table);
	}
	
	// @PreAuthorize("hasAnyRole('VIEW_DATA')")
	// @RequestMapping(value="/api/detection-points/{label}/top-users", method = RequestMethod.GET)
	// @ResponseBody
	// public Map<String, Long> topUsers(@PathVariable("label") String label, @RequestParam("earliest") String rfc3339Timestamp, @RequestParam("limit") Long limit) {
    public async topUsers(label: string, earliest: string, limit: number): Promise<Map<string, number>> {
        const map = new Map<string, number>();
        
        let events = await this.reportingEngine.findEvents(earliest);
        events = events.filter(this.filterByDetectionPointLabel(label));
	    
		// for (Event event : events) {
		// 	String username = event.getUser().getUsername();
			
		// 	Long count = map.get(username);
			
		// 	if (count == null) {
		// 		count = 0L;
		// 	}
			
		// 	count = count + 1L;
			
		// 	map.put(username, count);
		// }

        const keyFunc = (value: AppSensorEvent | Attack | Response) => {
            return Utils.getUserName(value.getUser());
        };

        this.countStoreInMap(events, keyFunc, map);

		
		// Comparator<Entry<String, Long>> byValue = (entry1, entry2) -> entry1.getValue().compareTo(entry2.getValue());

		// Map<String, Long> filtered = 
		// 		map
		// 		.entrySet()
		// 		.stream()
		// 		.sorted(byValue.reversed())
		// 		.limit(limit)
		// 		.collect(
		// 			Collectors.toMap(
		// 				entry -> entry.getKey(),
		// 				entry -> entry.getValue()
		// 			)
		// 		);
		
        const mapEntries = map.entries();
        let toArray: [string, number][] = [];
        for (const entry of mapEntries) {
            toArray.push(entry);
        }

        toArray.sort((a, b) => {
            return (a[1] - b[1]) * -1;
        });

        toArray = toArray.slice(0, limit);

        const filtered = new Map<string, number>();
        toArray.forEach(el => {
            filtered.set(el[0], el[1]);
        });

		// Map<String, Long> sorted = Maps.sortStringsByValue(filtered);
		
		// return sorted;
        return filtered;
	}
	
	// @PreAuthorize("hasAnyRole('VIEW_DATA')")
	// @RequestMapping(value="/api/detection-points/{label}/grouped", method = RequestMethod.GET)
	// @ResponseBody
	// public ViewObject groupedDetectionPoints(@PathVariable("label") String label, @RequestParam("earliest") String rfc3339Timestamp, @RequestParam("slices") int slices) {
    public async groupedDetectionPoints(label: string, earliest: string, slices: number): Promise<ViewObject<number>> {
        const startingTime = new Date(earliest).getTime();

		let events = await this.reportingEngine.findEvents(earliest);
        events = events.filter(this.filterByDetectionPointLabel(label));

		let attacks = await this.reportingEngine.findAttacks(earliest);
		attacks = attacks.filter(this.filterByDetectionPointLabel(label));

		const now = new Date().getTime();
		
		const ranges = Dates.splitRange(startingTime, now, slices);

		// Map<String, String> categoryKeyMappings = new HashMap<>();
		// categoryKeyMappings.put(EVENTS_LABEL, MORRIS_EVENTS_ID);
		// categoryKeyMappings.put(ATTACKS_LABEL, MORRIS_ATTACKS_ID);

        const categories = [Type.EVENTS, Type.ATTACKS];
		
		// timestamp, category, count
		const timestampCategoryCounts = this.generateTimestampCounts(ranges, events, attacks);
		
		const viewObject = new ViewObject(timestampCategoryCounts.getAsMorrisData(), categories);
		
		return viewObject;
	}
	
	// @PreAuthorize("hasAnyRole('VIEW_DATA')")
	// @RequestMapping(value="/api/detection-points/top", method = RequestMethod.GET)
	// @ResponseBody
	// public Map<String, Long> topDetectionPoints(@RequestParam("earliest") String rfc3339Timestamp, @RequestParam("limit") Long limit) {
    public async topDetectionPoints(earliest: string, limit: number): Promise<Map<string, number>> {
        const map = new Map<DetectionPoint, number>();
		
		let events = await this.reportingEngine.findEvents(earliest);

		// for (Event event : events) {
		// 	DetectionPoint detectionPoint = event.getDetectionPoint();
			
		// 	Long count = map.get(detectionPoint);
			
		// 	if (count == null) {
		// 		count = 0L;
		// 	}
			
		// 	count = count + 1L;
			
		// 	map.put(detectionPoint, count);
		// }

        const keyFunc = (value: AppSensorEvent | Attack | Response) => {
            return value.getDetectionPoint();
        };

	    this.countStoreInMap(events, keyFunc, map);

		
		// Comparator<Entry<DetectionPoint, Long>> byValue = (entry1, entry2) -> entry1.getValue().compareTo(entry2.getValue());

		// Map<DetectionPoint, Long> filtered = 
		// 		map
		// 		.entrySet()
		// 		.stream()
		// 		.sorted(byValue.reversed())
		// 		.limit(limit)
		// 		.collect(
		// 			Collectors.toMap(
		// 				entry -> entry.getKey(),
		// 				entry -> entry.getValue()
		// 			)
		// 		);
		
        const mapEntries = map.entries();
        let toArray: [DetectionPoint, number][] = [];
        for (const entry of mapEntries) {
            toArray.push(entry);
        }

        toArray.sort((a, b) => {
            return (a[1] - b[1]) * -1; //descending
        });

        toArray = toArray.slice(0, limit);

		// Map<String, Long> stringFiltered = new HashMap<>();
		
		// for(DetectionPoint detectionPoint : filtered.keySet()) {
		// 	stringFiltered.put(gson.toJson(detectionPoint), filtered.get(detectionPoint));
		// }

        const filtered = new Map<string, number>();
        toArray.forEach(el => {
            filtered.set(JSON.stringify(el[0]), el[1]);
        });

		
		// Map<String, Long> sorted = Maps.sortStringsByValue(stringFiltered);
		
		// return sorted;
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

		// for (Event event : events) {
		// 	DateTime eventDate = DateUtils.fromString(event.getTimestamp());
			
		// 	intervalLoop: for(Interval range : ranges) {
		// 		if (range.contains(eventDate)) {
		// 			String timestamp = range.getEnd().toString(DATE_FORMAT_STR);

		// 			Long count = table.get(timestamp, EVENTS_LABEL);
					
		// 			count = count + 1L;
					
		// 			table.put(timestamp, EVENTS_LABEL, count);
					
		// 			break intervalLoop;
		// 		}
		// 	}
		// }
		
		// for (Attack attack : attacks) {
		// 	DateTime attackDate = DateUtils.fromString(attack.getTimestamp());
			
		// 	intervalLoop: for(Interval range : ranges) {
		// 		if (range.contains(attackDate)) {
		// 			String timestamp = range.getEnd().toString(DATE_FORMAT_STR);

		// 			Long count = table.get(timestamp, ATTACKS_LABEL);
					
		// 			count = count + 1L;
					
		// 			table.put(timestamp, ATTACKS_LABEL, count);
					
		// 			break intervalLoop;
		// 		}
		// 	}
		// }
		
		return table;
	}

}

export {DetectionPointReport}