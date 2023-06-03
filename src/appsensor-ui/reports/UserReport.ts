import { Instant, LocalDateTime } from "@js-joda/core";
import { Interval } from "@js-joda/extra";

import { AppSensorEvent, Attack, Response, Utils } from "../../core/core.js";
import {ReportingEngineExt} from "../../reporting-engines/reporting-engines.js"
import { Dates, Table, TimeFrameItem, TimeUnit, Type, ViewObject } from "./Reports.js";

class UserReport {

    // private final Gson gson = new Gson();

    // private final static String MORRIS_EVENTS_ID = "events1";
    // private final static String MORRIS_ATTACKS_ID = "attacks1";
    // private final static String MORRIS_RESPONSES_ID = "responses1";
    // private final static String EVENTS_LABEL = "Events";
    // private final static String ATTACKS_LABEL = "Attacks";
    // private final static String RESPONSES_LABEL = "Responses";

    // private static final String DATE_FORMAT_STR = "YYYY-MM-dd HH:mm:ss";

    private reportingEngine: ReportingEngineExt;

    constructor(reportingEngine: ReportingEngineExt) {
        this.reportingEngine = reportingEngine;
    }

    // // @PreAuthorize("hasAnyRole('VIEW_DATA')")
    // // @RequestMapping(value="/api/users/{username}/all", method = RequestMethod.GET)
    // // @ResponseBody
    // public Map<String,Object> allContent(@PathVariable("username") String username, @RequestParam("earliest") String rfc3339Timestamp, @RequestParam Long limit, @RequestParam int slices) { 
    public async allContent(username: string, earliest: string, limit: number, slices: number): Promise<Map<string,Object>> { 
        const allContent = new Map<string,Object>();
        
        const byTimeFrame = await this.byTimeFrame(username);
        allContent.set("byTimeFrame", byTimeFrame);

        const recentEvents = await this.recentEvents(username, earliest, limit);
        allContent.set("recentEvents", recentEvents);

        const recentAttacks = await this.recentAttacks(username, earliest, limit)
        allContent.set("recentAttacks", recentAttacks);

        const recentResponses = await this.recentResponses(username, earliest, limit);
        allContent.set("recentResponses", recentResponses);

        const byClientApplication = await this.byClientApplication(username, earliest);
        allContent.set("byClientApplication", byClientApplication);

        const groupedUsers = await this.groupedUsers(username, earliest, slices);
        allContent.set("groupedUsers", groupedUsers);

        const activeResponses = await this.activeResponses(username, earliest);
        allContent.set("activeResponses", activeResponses);
        
        return allContent;
    }

    // @PreAuthorize("hasAnyRole('VIEW_DATA')")
    // @RequestMapping(value="/api/users/{username}/active-responses", method = RequestMethod.GET)
    // @ResponseBody
    // public Collection<Response> activeResponses(@PathVariable("username") String username, @RequestParam("earliest") String rfc3339Timestamp) {
    public async activeResponses(username: string, earliest: string): Promise<Response[]> {
        
        let activeResponses: Response[] = await this.reportingEngine.findResponses(earliest);

        activeResponses = activeResponses.filter(el => {
            const user = el.getUser();
            if (el.isActive() && user && user.getUsername() === username) {
                return el;
            }
        });

        activeResponses.sort((a: Response, b: Response) => {
            const aT = a.getTimestamp();
            const bT = b.getTimestamp();

            return (aT && bT) ? aT.getTime() - bT.getTime() : 0;
        });

        return activeResponses;
    }

    // @PreAuthorize("hasAnyRole('VIEW_DATA')")
    // @RequestMapping(value="/api/users/{username}/by-time-frame", method = RequestMethod.GET)
    // @ResponseBody
    // public Collection<TimeFrameItem> byTimeFrame(@PathVariable("username") String username) {
    public async byTimeFrame(username: string): Promise<TimeFrameItem[]> {
        const items: TimeFrameItem[] = [];
        
        const now = LocalDateTime.now();
        const monthAgo = now.minusMonths(1);
        const weekAgo = now.minusWeeks(1);
        const dayAgo = now.minusDays(1);
        const shiftAgo = now.minusHours(8);
        const hourAgo = now.minusHours(1);
        
        const monthAgoEventCount = await this.reportingEngine.countEventsByUser(monthAgo.toString(), username);
        const weekAgoEventCount = await this.reportingEngine.countEventsByUser(weekAgo.toString(), username);
        const dayAgoEventCount = await this.reportingEngine.countEventsByUser(dayAgo.toString(), username);
        const shiftAgoEventCount = await this.reportingEngine.countEventsByUser(shiftAgo.toString(), username);
        const hourAgoEventCount = await this.reportingEngine.countEventsByUser(hourAgo.toString(), username);
        
        const monthAgoResponseCount = await this.reportingEngine.countResponsesByUser(monthAgo.toString(), username);
        const weekAgoResponseCount = await this.reportingEngine.countResponsesByUser(weekAgo.toString(), username);
        const dayAgoResponseCount = await this.reportingEngine.countResponsesByUser(dayAgo.toString(), username);
        const shiftAgoResponseCount = await this.reportingEngine.countResponsesByUser(shiftAgo.toString(), username);
        const hourAgoResponseCount = await this.reportingEngine.countResponsesByUser(hourAgo.toString(), username);

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
    // @RequestMapping(value="/api/users/{username}/latest-events", method = RequestMethod.GET)
    // @ResponseBody
    // public Collection<Event> recentEvents(@PathVariable("username") String username, @RequestParam("earliest") String rfc3339Timestamp, @RequestParam("limit") Long limit) {
    public async recentEvents(username: string, earliest: string, limit: number): Promise<AppSensorEvent[]> {
        
        let events = await this.reportingEngine.findEvents(earliest);
        events = events.filter(el => {
            const user = el.getUser();
            if (user && user.getUsername() === username) {
                return el;
            }
        });

        events.sort((a: AppSensorEvent, b: AppSensorEvent) => {
            const aT = a.getTimestamp();
            const bT = b.getTimestamp();

            return (aT && bT) ? (aT.getTime() - bT.getTime()) * -1 : 0;
        });
            
        return events.slice(0, limit);
    }

    // @PreAuthorize("hasAnyRole('VIEW_DATA')")
    // @RequestMapping(value="/api/users/{username}/latest-attacks", method = RequestMethod.GET)
    // @ResponseBody
    // public Collection<Attack> recentAttacks(@PathVariable("username") String username, @RequestParam("earliest") String rfc3339Timestamp, @RequestParam("limit") Long limit) {
    public async recentAttacks(username: string, earliest: string, limit: number): Promise<Attack[]> {
        
        let attacks = await this.reportingEngine.findAttacks(earliest);
        attacks = attacks.filter(el => {
            const user = el.getUser();
            if (user && user.getUsername() === username) {
                return el;
            }
        });

        attacks.sort((a: Attack, b: Attack) => {
            const aT = a.getTimestamp();
            const bT = b.getTimestamp();

            return (aT && bT) ? (aT.getTime() - bT.getTime()) * -1 : 0;
        });
            
        return attacks.slice(0, limit);
    }

    // @PreAuthorize("hasAnyRole('VIEW_DATA')")
    // @RequestMapping(value="/api/users/{username}/latest-responses", method = RequestMethod.GET)
    // @ResponseBody
    // public Collection<Response> recentResponses(@PathVariable("username") String username, @RequestParam("earliest") String rfc3339Timestamp, @RequestParam("limit") Long limit) {
    public async recentResponses(username: string, earliest: string, limit: number): Promise<Response[]> {
        
        let responses = await this.reportingEngine.findResponses(earliest);
        responses = responses.filter(el => {
            const user = el.getUser();
            if (user && user.getUsername() === username) {
                return el;
            }
        });

        responses.sort((a: Response, b: Response) => {
            const aT = a.getTimestamp();
            const bT = b.getTimestamp();

            return (aT && bT) ? (aT.getTime() - bT.getTime()) * -1 : 0;
        });
            
        return responses.slice(0, limit);
    }

    getDetectionSystemId(obj: AppSensorEvent | Attack | Response): string {
        let result = "unknown";

        const detSystem = obj.getDetectionSystem();

        if (detSystem) {
            result = detSystem.getDetectionSystemId();
        }

        return result;
    }

    // seen by these client apps
    // @PreAuthorize("hasAnyRole('VIEW_DATA')")
    // @RequestMapping(value="/api/users/{username}/by-client-application", method = RequestMethod.GET)
    // @ResponseBody
    // public String byClientApplication(@PathVariable("username") String username, @RequestParam("earliest") String rfc3339Timestamp) {
    public async byClientApplication(username: string, earliest: string): Promise<string> {
        const table = new Table<string,Type,number>();

        let events = await this.reportingEngine.findEvents(earliest);
        events = events.filter(el => {
            const user = el.getUser();
            if (user && user.getUsername() === username) {
                return el;
            }
        });

        let attacks = await this.reportingEngine.findAttacks(earliest);
        attacks = attacks.filter(el => {
            const user = el.getUser();
            if (user && user.getUsername() === username) {
                return el;
            }
        });

        let responses = await this.reportingEngine.findResponses(earliest);
        responses = responses.filter(el => {
            const user = el.getUser();
            if (user && user.getUsername() === username) {
                return el;
            }
        });
        
        for(const event of events) {
            const detSystemId = this.getDetectionSystemId(event);

            let count = table.get(detSystemId, Type.EVENTS);
            
            if (count === undefined) {
                count = 0;
            }
            
            count++;
            
            table.put(detSystemId, Type.EVENTS, count);
        }
        
        for(const attack of attacks) {
            const detSystemId = this.getDetectionSystemId(attack);

            let count = table.get(detSystemId, Type.ATTACKS);
            
            if (count === undefined) {
                count = 0;
            }
            
            count++;
            
            table.put(detSystemId, Type.ATTACKS, count);
        }
        
        for(const response of responses) {
            const detSystemId = this.getDetectionSystemId(response);

            let count = table.get(detSystemId, Type.RESPONSES);
            
            if (count === undefined) {
                count = 0;
            }
            
            count++;
            
            table.put(detSystemId, Type.RESPONSES, count);
        }
        
        return JSON.stringify(table.getAsMorrisData());
    }

    // @PreAuthorize("hasAnyRole('VIEW_DATA')")
    // @RequestMapping(value="/api/users/{username}/grouped", method = RequestMethod.GET)
    // @ResponseBody
    // public ViewObject groupedUsers(@PathVariable("username") String username, @RequestParam("earliest") String rfc3339Timestamp, @RequestParam("slices") int slices) {
    public async groupedUsers(username: string, earliest: string, slices: number): Promise<ViewObject<number>> {
        const startingTime = new Date(earliest).getTime(); 

        let events = await this.reportingEngine.findEvents(earliest);
        events = events.filter(el => {
            const user = el.getUser();
            if (user && user.getUsername() === username) {
                return el;
            }
        });

        let attacks = await this.reportingEngine.findAttacks(earliest);
        attacks = attacks.filter(el => {
            const user = el.getUser();
            if (user && user.getUsername() === username) {
                return el;
            }
        });

        let responses = await this.reportingEngine.findResponses(earliest);
        responses = responses.filter(el => {
            const user = el.getUser();
            if (user && user.getUsername() === username) {
                return el;
            }
        });    

        const now = new Date().getTime();
        
        const ranges = Dates.splitRange(startingTime, now, slices);

        const categories = [Type.EVENTS, Type.ATTACKS, Type.RESPONSES];
      
        // timestamp, category, count
        const timestampCounts = this.generateTimestampCounts(ranges, events, attacks, responses);
        
        const viewObject = new ViewObject(timestampCounts.getAsMorrisData(), categories);
        
        return viewObject;
    }

    // @PreAuthorize("hasAnyRole('VIEW_DATA')")
    // @RequestMapping(value="/api/users/top", method = RequestMethod.GET)
    // @ResponseBody
    // public Map<String, Long> topUsers(@RequestParam("earliest") String rfc3339Timestamp, @RequestParam("limit") Long limit) {
    public async topUsers(earliest: string, limit: number): Promise<Map<string, number> > {
        const map = new Map<string, number>();
        
        const events = await this.reportingEngine.findEvents(earliest);
        
        for (const event of events) {
            const username = Utils.getUserName(event.getUser());
            
            let count = map.get(username);
            
            if (count === undefined) {
                count = 0;
            }
            
            count++;
            
            map.set(username, count);
        }

        // Comparator<Entry<String, Long>> byValue = (entry1, entry2) -> entry1.getValue().compareTo(entry2.getValue());
        
        // Map<String, Long> filtered = 
        //         map
        //         .entrySet()
        //         .stream()
        //         .sorted(byValue.reversed())
        //         .limit(limit)
        //         .collect(
        //             Collectors.toMap(
        //                 entry -> entry.getKey(),
        //                 entry -> entry.getValue()
        //             )
        //         );

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

    private generateTimestampCounts(ranges: Interval[], events: AppSensorEvent[], attacks: Attack[], responses: Response[]): Table<string, string, number> {

        const table = new Table<string, string, number>();

        ranges.forEach(range => {
            const timestampStr = range.end().toString();
            
            table.put(timestampStr, Type.EVENTS, 0);
            table.put(timestampStr, Type.ATTACKS, 0);
            table.put(timestampStr, Type.RESPONSES, 0);
        });
        
        for (const event of events) {
            const eventDate = event.getTimestamp().getTime();
            
            intervalLoop: for(const range of ranges) {
                if (range.contains(Instant.ofEpochMilli(eventDate))) {
                    const timestampStr = range.end().toString();

                    let count = table.get(timestampStr, Type.EVENTS)!;
                    
                    count++;
                    
                    table.put(timestampStr, Type.EVENTS, count);
                    
                    break intervalLoop;
                }
            }
        }
        
        for (const attack of attacks) {
            const attackDate = attack.getTimestamp().getTime();
            
            intervalLoop: for(const range of ranges) {
                if (range.contains(Instant.ofEpochMilli(attackDate))) {
                    const timestampStr = range.end().toString();

                    let count = table.get(timestampStr, Type.ATTACKS)!;
                    
                    count++;
                    
                    table.put(timestampStr, Type.ATTACKS, count);
                    
                    break intervalLoop;
                }
            }
        }
        
        for (const response of responses) {
            const timestamp = response.getTimestamp();
            if (!timestamp) {
                break;
            }

            const responseDate = timestamp.getTime();
            
            intervalLoop: for(const range of ranges) {
                if (range.contains(Instant.ofEpochMilli(responseDate))) {
                    const timestampStr = range.end().toString();

                    let count = table.get(timestampStr, Type.RESPONSES)!;
                    
                    count++;
                    
                    table.put(timestampStr, Type.RESPONSES, count);
                    
                    break intervalLoop;
                }
            }
        }
        
        return table;
    }

}

export {UserReport}