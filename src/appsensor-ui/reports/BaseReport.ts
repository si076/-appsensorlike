import { Instant } from "@js-joda/core";
import { Interval } from "@js-joda/extra";

import { JSONServerConfigurationReader } from "../../configuration-modes/appsensor-configuration-json/server/JSONServerConfig.js";
import { ServerConfiguration } from "../../core/configuration/server/server_configuration.js";
import { AppSensorEvent, Attack, DetectionPoint, Response } from "../../core/core.js";
import { ReportingEngineExt } from "../../reporting-engines/reporting-engines.js";
import { Table, Type } from "./Reports.js";

class BaseReport {

    protected reportingEngine: ReportingEngineExt;

    constructor(reportingEngine: ReportingEngineExt) {
        this.reportingEngine = reportingEngine;
    }

    protected filterByUser(username: string): (value: AppSensorEvent | Attack | Response) => unknown  {
        return (el: AppSensorEvent | Attack | Response) => {
            const user = el.getUser();
            if (user && user.getUsername() === username) {
                return el;
            }
        }
    }

    protected filterByDetectionPointLabel(label: string): (value: AppSensorEvent | Attack | Response) => unknown  {
        return (el: AppSensorEvent | Attack | Response) => {
            const detPoint = el.getDetectionPoint();
            if (detPoint && detPoint.getLabel() === label) {
                return el;
            }
        }
    }

    protected compareByDateDescending(a: AppSensorEvent | Attack | Response, b: AppSensorEvent | Attack | Response): number {
        const aT = a.getTimestamp();
        const bT = b.getTimestamp();

        return (aT && bT) ? (aT.getTime() - bT.getTime()) * -1 : 0;
    }

    public async recentEvents(param: string,
                              earliest: string, 
                              limit: number,
                              filterFunc: (value: AppSensorEvent, index: number, array: AppSensorEvent[]) => unknown): Promise<AppSensorEvent[]> {
        
        let events = await this.reportingEngine.findEvents(earliest);
        events = events.filter(filterFunc);

        events.sort(this.compareByDateDescending);
             
        return events.slice(0, limit);
    }

    public async recentAttacks(param: string,
                               earliest: string, 
                               limit: number,
                               filterFunc: (value: Attack, index: number, array: Attack[]) => unknown ): Promise<Attack[]> {

        let attacks = await this.reportingEngine.findAttacks(earliest);
        attacks = attacks.filter(filterFunc);

        attacks.sort(this.compareByDateDescending);

		return attacks.slice(0, limit);
	}

    public async recentResponses(param: string,
                                 earliest: string, 
                                 limit: number,
                                 filterFunc: (value: Response, index: number, array: Response[]) => unknown ): Promise<Response[]> {

        let responses = await this.reportingEngine.findResponses(earliest);
        responses = responses.filter(filterFunc);

        responses.sort(this.compareByDateDescending);

		return responses.slice(0, limit);
	}

    protected async filterAndCount(param: string,
                                   earliest: string,
                                   type: Type,
                                   filterFunc: (value: AppSensorEvent | Attack | Response) => unknown,
                                   rowKeyFunc: (value: AppSensorEvent | Attack | Response) => string,
                                   table: Table<string,Type,number>) {
        let objects: AppSensorEvent[] | Attack[] |  Response[] = [];
        
        switch (type) {
            case Type.EVENTS: {
                objects = await this.reportingEngine.findEvents(earliest);
                objects = objects.filter(filterFunc); //here instead of below because TS complain
                break;
            }
            case Type.ATTACKS: {
                objects = await this.reportingEngine.findAttacks(earliest);
                objects = objects.filter(filterFunc); //here instead of below because TS complain
                break;
            }
            case Type.RESPONSES: {
                objects = await this.reportingEngine.findResponses(earliest);
                objects = objects.filter(filterFunc); //here instead of below because TS complain
                break;
            }
        }
        
        this.countStoreInTable(objects, rowKeyFunc, table);
    }

    protected countStoreInTable(objects: AppSensorEvent[] | Attack[] |  Response[],
                                rowKeyFunc: (value: AppSensorEvent | Attack | Response) => string,
                                table: Table<string,Type,number>) {

        for(const object of objects) {
            const rowKey = rowKeyFunc(object);

            let count = table.get(rowKey, Type.EVENTS);
            
            if (count === undefined) {
                count = 0;
            }
            
            count++;
            
            table.put(rowKey, Type.EVENTS, count);
        }
    }

    protected countStoreInMap<T>(objects: AppSensorEvent[] | Attack[] |  Response[],
                              keyFunc: (value: AppSensorEvent | Attack | Response) => T | undefined,
                              map: Map<T, number>) {

        for(const object of objects) {
            const key = keyFunc(object);

            if (!key) {
                break;
            }

            let count = map.get(key);
            
            if (count === undefined) {
                count = 0;
            }
            
            count++;
            
            map.set(key, count);
        }
    }

    protected countInRangeStoreInTable(objects: AppSensorEvent[] | Attack[] |  Response[],
                                       type: Type,
                                       ranges: Interval[],
                                       table: Table<string, string, number>) {
        for (const object of objects) {
            const timestamp = object.getTimestamp();
            if (!timestamp) {
                break;
            }

            const objectDate = timestamp.getTime();
            
            intervalLoop: for(const range of ranges) {
                if (range.contains(Instant.ofEpochMilli(objectDate))) {
                    const timestampStr = range.end().toString();

                    let count = table.get(timestampStr, type)!;
                    
                    count++;
                    
                    table.put(timestampStr, type, count);
                    
                    break intervalLoop;
                }
            }
        }

    }

    protected getDetectionSystemId(obj: AppSensorEvent | Attack | Response): string {
        let result = "unknown";

        const detSystem = obj.getDetectionSystem();

        if (detSystem) {
            result = detSystem.getDetectionSystemId();
        }

        return result;
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

export {BaseReport}