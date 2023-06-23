import { Instant, LocalDateTime } from "@js-joda/core";
import {Interval} from '@js-joda/extra';
import { AppSensorEvent, Attack } from "../../core/core";

type NAME_EVENT_COUNT = {[key: string]: number};

enum TimeUnit { 
    MONTH = "MONTH", 
    WEEK  = "WEEK", 
    DAY   = "DAY", 
    SHIFT = "SHIFT", 
    HOUR  = "HOUR"
}; 

enum Type {
    EVENT     = "EVENT",
    ATTACK    = "ATTACK",
    RESPONSE  = "RESPONSE",
    EVENTS    = "Events", 
    ATTACKS   = "Attacks", 
    RESPONSES = "Responses"
}; 

enum TrendDirection {
    HIGHER = "Higher", 
    LOWER  = "Lower", 
    SAME   = "Same" 
}

class TimeUnitUtil { 
        
    public static toHours(timeUnit: TimeUnit): number {
        let hours = 0;
        
        switch (timeUnit) {
        case TimeUnit.MONTH:
            hours = 30 * 24;
            break;
        case TimeUnit.WEEK:
            hours = 7 * 24;
            break;
        case TimeUnit.DAY:
            hours = 24;
            break;
        case TimeUnit.SHIFT:
            hours = 8;
            break;
        case TimeUnit.HOUR:
            hours = 1;
            break;
        }
        
        return hours;
    }
} 

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

    private backingMap: {[k: string]: {[k: string]: string | VALUE}} = {};

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

        //update the "backingMap" needed for pages' js files
        const rowKeyStr = new String(rowKey).toString();
        let colValueObj: {[k: string]: string | VALUE} | undefined = this.backingMap[rowKeyStr];
        if (!colValueObj) {
            colValueObj = {};
        }
        const colKeyStr = new String(columnKey).toString();
        colValueObj[colKeyStr] = value;

        this.backingMap[rowKeyStr] = colValueObj;
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

class TrendDirectionUtil {
    
    private static DEFAULT_TREND_DELTA_PERCENTAGE = 20.0;

    public static of(base: number, variation: number): TrendDirection {
        let direction = TrendDirection.SAME;
        
        if (base === variation) {
            direction = TrendDirection.SAME;
        } else if (base > variation && variation === 0) {
            direction = TrendDirection.LOWER;
        } else if (base < variation && base === 0) {
            direction = TrendDirection.HIGHER;
        } else {
            
            // actually calculate difference %
            // const baseDbl = Double.valueOf(base);
            // const variationDbl = Double.valueOf(variation);
            const difference = base - variation;
            const percentageDifference = Math.abs(difference / variation) * 100.0;
            
            if (percentageDifference < TrendDirectionUtil.DEFAULT_TREND_DELTA_PERCENTAGE) {
                direction = TrendDirection.SAME;
            } else if (base > variation) {
                direction = TrendDirection.LOWER;
            } else if (base < variation) {
                direction = TrendDirection.HIGHER;
            }
        }
        
        return direction;
    }
    
}

class TrendItem {
    
    private direction: TrendDirection; 
    private unit: TimeUnit;
    private count: number;
    private type: Type;
    
    public static of(countOverTimeUnit: number, unit: TimeUnit, type: Type): TrendItem {
        const count = TrendItem.countPerHour(countOverTimeUnit, unit);

        const toFixedPrec = Number.parseFloat(new Number(count).toFixed(4));

        return new TrendItem(toFixedPrec, TrendDirection.SAME, unit, type);
    }
    
    // denominator is always a month, so this would be events/responses in a day compared to a month 
    public static compute(countVariation: number, unitVariation: TimeUnit, 
                          countBase: number, unitBase: TimeUnit, 
                          type: Type): TrendItem {
        
        const countVariationPerHour = TrendItem.countPerHour(countVariation, unitVariation);
        const countBasePerHour = TrendItem.countPerHour(countBase, unitBase);
        
        const direction = TrendDirectionUtil.of(countBasePerHour, countVariationPerHour);

        const toFixedPrec = Number.parseFloat(new Number(countVariationPerHour).toFixed(4));

        return new TrendItem(toFixedPrec , direction, unitVariation, type);
    }
    
    private static countPerHour(count: number, unit: TimeUnit): number {
        let perHour = 0;
        
        if (count > 0) {
            perHour = count / TimeUnitUtil.toHours(unit);
        }
        
        return perHour;
    }
    
    private constructor(count: number, direction: TrendDirection, unit: TimeUnit, type: Type) {
        this.count = count;
        this.direction = direction;
        this.unit = unit;
        this.type = type;
    }

    public getDirection(): TrendDirection {
        return this.direction;
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

export {TimeUnit, Type, TimeFrameItem, Table, ViewObject, CategoryItem, Dates,
        TrendItem, NAME_EVENT_COUNT}
