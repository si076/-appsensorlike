import { DateTimeFormatter, LocalDateTime } from "@js-joda/core";

import { TimeUnitUtil, TrendDirection, TrendItem } from "../reports/Reports.js";
import { TrendsDashboardReport } from "../reports/TrendsDashboardReport.js";
import { AppSensorUIConsoleSettings } from "./appsensor-console-ui.js";
import { ConsoleReport } from "./ConsoleReport.js";

class ConsoleTrendsReport extends ConsoleReport {

    private report: TrendsDashboardReport;

    private loaded = false;

    constructor(report: TrendsDashboardReport) {
        super();

        this.report = report;
    }

    async loadItems(settings: AppSensorUIConsoleSettings): Promise<void> {
        if (!this.loaded) {
            this.initData();

            const trendItems = await this.report.countEvents();

            const now = LocalDateTime.now();
            const monthAgo = now.minusMonths(1);
            const weekAgo = now.minusWeeks(1);
            const dayAgo = now.minusDays(1);
            const shiftAgo = now.minusHours(8);
            const hourAgo = now.minusHours(1);

            const dMMyyyy = DateTimeFormatter.ofPattern("d.MM.yyyy");
            const HHmm = DateTimeFormatter.ofPattern("HH:mm");
            const monthIntervalStr = monthAgo.format(dMMyyyy) + ' -\n' + now.format(dMMyyyy);
            const weekIntervalStr  = weekAgo.format(dMMyyyy) + ' -\n' + now.format(dMMyyyy);
            const dayIntervalStr   = dayAgo.format(dMMyyyy) + ' -\n' + now.format(dMMyyyy);
            const shiftIntervalStr = shiftAgo.format(HHmm) + ' - ' + now.format(HHmm);
            const hourIntervalStr  = hourAgo.format(HHmm) + ' - ' + now.format(HHmm);

            this.setHeader(["", monthIntervalStr, weekIntervalStr, dayIntervalStr, shiftIntervalStr, hourIntervalStr]);


            const typeTrendItemsMap = new Map<string, TrendItem[]>();
            //find the unique types
            trendItems.forEach((el) => {

                const type = el.getType();
                let typeTrendItems = typeTrendItemsMap.get(type);
                if (!typeTrendItems) {
                    typeTrendItems = [];
                    typeTrendItemsMap.set(type, typeTrendItems);
                }

                const elHours = TimeUnitUtil.toHours(el.getUnit());
                //insert the new item according to its units: Month, Week, Day, Shift, Hour
                //
                let insertionIndex = 0;
                for (let i = 0; i < typeTrendItems.length; i++) {
                    const trendItem = typeTrendItems[i];
                    const hours = TimeUnitUtil.toHours(trendItem.getUnit());

                    if (elHours > hours) {
                        insertionIndex = i;
                        break;
                    }
                }

                typeTrendItems.splice(insertionIndex, 0, el);
                
            });

            const entries = typeTrendItemsMap.entries();
            for (const entry of entries) {
                const row: string[] = [entry[0]];

                for (let e = 0; e < entry[1].length; e++) {
                    const trendDirection = entry[1][e].getDirection();
                    const directionSign = trendDirection === TrendDirection.SAME ? "=" :
                                            trendDirection === TrendDirection.HIGHER ? "↑" : "↓";   
                    row.push(new Number(entry[1][e].getCount()).toFixed(4) + " " + directionSign);
                }

                this.addDataRow(row);    
            }

            this.loaded = true;
        }
    }

    filterItems(): void {
        throw new Error("Method not implemented.");
    }
    getReportName(): string {
        return "Trends";
    }

}

export {ConsoleTrendsReport}