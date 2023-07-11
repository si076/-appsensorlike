import { DateTimeFormatter, LocalDateTime } from "@js-joda/core";

import { ReportingEngineExt } from "@appsensorlike/appsensorlike/reporting-engines/reporting-engines.js";

import { TimeUnitUtil, TrendDirection, TrendItem } from "@appsensorlike/appsensorlike_ui/appsensor-ui/reports/Reports.js";
import { TrendsDashboardReport } from "@appsensorlike/appsensorlike_ui/appsensor-ui/reports/TrendsDashboardReport.js";

import { AppSensorUIConsoleSettings, EXCEL4NODE_CELL_STYLE } from "./appsensor-ui-console.js";
import { ConsoleReport } from "./ConsoleReport.js";

class ConsoleTrendsReport extends ConsoleReport {
    public static ID = 'Trends';

    private report: TrendsDashboardReport;

    private loaded = false;

    constructor(reportingEngine: ReportingEngineExt) {
        super(reportingEngine);

        this.report = new TrendsDashboardReport(reportingEngine);
    }

    async loadItems(earliest: string,
                    settings: AppSensorUIConsoleSettings): Promise<void> {
        if (!this.loaded || this.hasToReload || this.newItemReceived) {
            this.hasToReload = false;
            this.newItemReceived = false;
            
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
            
            const topWrapStyle: EXCEL4NODE_CELL_STYLE = {alignment: {vertical: "top", wrapText: true}};
            const topStyle: EXCEL4NODE_CELL_STYLE = {alignment: {vertical: "top"}};
            ConsoleReport.mergeObjects(this.excelCellsConfig.headerCellsStyle[1], topWrapStyle);
            ConsoleReport.mergeObjects(this.excelCellsConfig.headerCellsStyle[2], topWrapStyle);
            ConsoleReport.mergeObjects(this.excelCellsConfig.headerCellsStyle[3], topWrapStyle);
            ConsoleReport.mergeObjects(this.excelCellsConfig.headerCellsStyle[4], topStyle);
            ConsoleReport.mergeObjects(this.excelCellsConfig.headerCellsStyle[5], topStyle);


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
                        break;
                    }

                    insertionIndex++; //catches also position after the last element
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
                    const count = entry[1][e].getCount();
                    let countStr = new Number(count).toFixed(4); 
                    if (Number.isInteger(count)) {
                        countStr = new Number(count).toFixed();
                    } 
                    row.push(countStr + " " + directionSign);
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