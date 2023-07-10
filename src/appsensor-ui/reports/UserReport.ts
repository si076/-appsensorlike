import { Instant, LocalDateTime } from "@js-joda/core";
import { Interval } from "@js-joda/extra";

import { AppSensorEvent, Attack, Response, Utils } from "@appsensorlike/appsensorlike/core/core.js";
import {ReportingEngineExt} from "@appsensorlike/appsensorlike/reporting-engines/reporting-engines.js"
import { BaseReport } from "./BaseReport.js";
import { Dates, NAME_EVENT_COUNT, Table, TimeFrameItem, TimeUnit, Type, ViewObject } from "./Reports.js";


class UserReport extends BaseReport {

    constructor(reportingEngine: ReportingEngineExt) {
        super(reportingEngine);
    }

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

    public async recentEvents(username: string, earliest: string, limit: number): Promise<AppSensorEvent[]> {
        
        return super.recentEvents(username, earliest, limit, this.filterByUser(username));
    }

    public async recentAttacks(username: string, earliest: string, limit: number): Promise<Attack[]> {
        
        return super.recentAttacks(username, earliest, limit, this.filterByUser(username));
    }

    public async recentResponses(username: string, earliest: string, limit: number): Promise<Response[]> {
        
        return super.recentResponses(username, earliest, limit, this.filterByUser(username));
    }

    // seen by these client apps
    public async byClientApplication(username: string, earliest: string): Promise<string> {
        const table = new Table<string,Type,number>();

        await this.filterAndCount(username, earliest, Type.EVENT, 
                                  this.filterByUser(username), 
                                  this.getDetectionSystemId,
                                  table);

        await this.filterAndCount(username, earliest, Type.ATTACK, 
                                  this.filterByUser(username), 
                                  this.getDetectionSystemId,
                                  table);

        await this.filterAndCount(username, earliest, Type.RESPONSE, 
                                  this.filterByUser(username), 
                                  this.getDetectionSystemId,
                                  table);
        
        return JSON.stringify(table);
    }

    public async groupedUsers(username: string, earliest: string, slices: number): Promise<ViewObject<number>> {
        const startingTime = new Date(earliest).getTime(); 

        let events = await this.reportingEngine.findEvents(earliest);
        events = events.filter(this.filterByUser(username));

        let attacks = await this.reportingEngine.findAttacks(earliest);
        attacks = attacks.filter(this.filterByUser(username));

        let responses = await this.reportingEngine.findResponses(earliest);
        responses = responses.filter(this.filterByUser(username));    

        const now = new Date().getTime();
        
        const ranges = Dates.splitRange(startingTime, now, slices);

        const categories = [Type.EVENTS, Type.ATTACKS, Type.RESPONSES];
      
        // timestamp, category, count
        const timestampCounts = this.generateTimestampCounts(ranges, events, attacks, responses);
        
        const viewObject = new ViewObject(timestampCounts.getAsMorrisData(), categories);
        
        return viewObject;
    }

    public async topUsers(earliest: string, 
                          limit: number | undefined = undefined): Promise<NAME_EVENT_COUNT> {
        const map = new Map<string, number>();
        
        const events = await this.reportingEngine.findEvents(earliest);

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

    private generateTimestampCounts(ranges: Interval[], 
                                    events: AppSensorEvent[], 
                                    attacks: Attack[], 
                                    responses: Response[]): Table<string, string, number> {

        const table = new Table<string, string, number>();

        ranges.forEach(range => {
            const timestampStr = range.end().toString();
            
            table.put(timestampStr, Type.EVENTS, 0);
            table.put(timestampStr, Type.ATTACKS, 0);
            table.put(timestampStr, Type.RESPONSES, 0);
        });

        this.countInRangeStoreInTable(events, Type.EVENTS, ranges, table);
        this.countInRangeStoreInTable(attacks, Type.ATTACKS, ranges, table);
        this.countInRangeStoreInTable(responses, Type.RESPONSES, ranges, table);
        
        return table;
    }

}

export {UserReport}