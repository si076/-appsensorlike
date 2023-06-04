import { Instant, LocalDateTime } from "@js-joda/core";
import {Interval} from '@js-joda/extra';
import { AppSensorEvent, Attack } from "../../core/core";

enum TimeUnit { 
    MONTH, 
    WEEK, 
    DAY, 
    SHIFT, 
    HOUR
}; 

enum Type { 
    EVENTS = "Events", 
    ATTACKS = "Attacks", 
    RESPONSES = "Responses"
}; 

class TimeFrameItem {
		
    private unit: TimeUnit ;
    private count: number;
    private type: Type;
    
    public static of(count: number, unit: TimeUnit, type: Type): TimeFrameItem {
        return new TimeFrameItem(count, unit, type);
    }
    
    private constructor(count: number, unit: TimeUnit, type: Type) {
        this.count = count;
        this.unit = unit;
        this.type = type;
    }

    public getUnit(): TimeUnit {
        return this.unit;
    }

    public getCount(): number {
        return this.count;
    }
    
    public getType(): Type {
        return this.type;
    }
}

class Table<ROW_KEY, COLUMN_KEY, VALUE> {

    private data = new Map<ROW_KEY, Map<COLUMN_KEY, VALUE>>();

    get(rowKey: ROW_KEY, columnKey: COLUMN_KEY): VALUE | undefined {
        let result = undefined;

        const row = this.data.get(rowKey);
        if (row) {
            result = row.get(columnKey);
        }

        return result;
    }

    put(rowKey: ROW_KEY, columnKey: COLUMN_KEY, value: VALUE) {
        let row = this.data.get(rowKey);
        if (!row) {
            row = new Map<COLUMN_KEY, VALUE>();
            this.data.set(rowKey, row);
        }

        row.set(columnKey, value); 
    }

    getAsMorrisData(): {[k: string]: string | VALUE}[] {
        const result: {[k: string]: string | VALUE}[] = [];

        const keys = this.data.keys();
        for ( const key of keys) {
            const column = this.data.get(key);

            const obj: {[k: string]: string | VALUE} = {};
            obj[ViewObject.MORRIS_X_KEY_NAME] = new String(key).toString();

            const entries = column!.entries();
            for (const entry of entries) {
                const colKey = new String(entry[0]).toString(); 
                obj[colKey] = entry[1];
            }

            result.push(obj);
        };

        return result;
    }
}

class ViewObject<VALUE> {

    public static MORRIS_X_KEY_NAME = "xKey";

    private data: string = "";
    private xkey: string = ViewObject.MORRIS_X_KEY_NAME;
    private ykeys: string[] = [];
    private labels: string[] = [];
    
    public constructor(timestampCategoryCounts: {[k: string]: string | VALUE}[], categories: string[]) { //categoryKeyMappings: Map<string, string>) {

        // for (const category of categoryKeyMappings.keys()) {
        //     this.ykeys.push(categoryKeyMappings.get(category)!);
        //     this.labels.push(category);
        // }
        categories.forEach(el => {
            this.ykeys.push(el);
            this.labels.push(el);
        });

        this.data = JSON.stringify(timestampCategoryCounts);
    }
    
    public getData(): string {
        return this.data;
    }

    public getXkey(): string {
        return this.xkey;
    }

    public getYkeys(): string[] {
        return this.ykeys;
    }
    
    public getLabels(): string[] {
        return this.labels;
    }
    
}

class CategoryItem {
		
    private category: string;
    private eventCount: number;
    private attackCount: number;
    
    private countByLabel: string;//Table<string, Type, number>;
    
    private recentEvents: AppSensorEvent[];
    private recentAttacks: Attack[];
    
    public static of(
            category: string, 
            eventCount: number, 
            attackCount: number, 
            countByLabel: Table<string, Type, number>,
            recentEvents: AppSensorEvent[],
            recentAttacks: Attack[]): CategoryItem {
        return new CategoryItem(category, eventCount, attackCount, countByLabel, recentEvents, recentAttacks);
    }
    
    private constructor(
            category: string, 
            eventCount: number, 
            attackCount: number, 
            countByLabel: Table<string, Type, number>,
            recentEvents: AppSensorEvent[],
            recentAttacks: Attack[]) {
        this.category = category;
        this.eventCount = eventCount;
        this.attackCount = attackCount;
        this.countByLabel = JSON.stringify(countByLabel);
        this.recentEvents = recentEvents;
        this.recentAttacks = recentAttacks;
    }
    
    public getCategory(): string {
        return this.category;
    }

    public getCountByLabel(): string {
        return this.countByLabel;
    }

    public getRecentEvents(): AppSensorEvent[] {
        return this.recentEvents;
    }

    public getRecentAttacks(): Attack[] {
        return this.recentAttacks;
    }

    public getEventCount(): number {
        return this.eventCount;
    }
    
    public getAttackCount(): number {
        return this.attackCount;
    }
    
}


class Dates {

	public static splitRange(from: number, to: number, slices: number): Interval[] {
		const ranges: Interval[] = [];
		
		const millisDifference = to - from;
		
		const rangeInMillis = Math.floor(millisDifference / slices);
		
        let startMillis = from;
		for(let i = 0; i < slices; i++) {
			
			if (ranges.length > 0) {
				// add 1 ms to end time of previous range
				startMillis = ranges[i - 1].end().toEpochMilli() + 1;
			}
			
			const range = Interval.of(Instant.ofEpochMilli(startMillis), Instant.ofEpochMilli(startMillis + rangeInMillis));
			ranges.push(range);
		}
		
		return ranges;
	}
	
}

export {TimeUnit, Type, TimeFrameItem, Table, ViewObject, CategoryItem, Dates}
