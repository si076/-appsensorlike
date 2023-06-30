import { ColumnUserConfig, TableUserConfig } from "table";
import { JSONServerConfigurationReader } from "../../configuration-modes/appsensor-configuration-json/server/JSONServerConfig.js";
import { ServerConfiguration } from "../../core/configuration/server/server_configuration.js";
import { DetectionPoint, Response, Utils } from "../../core/core.js";
import { ReportingEngineExt } from "../../reporting-engines/reporting-engines.js";
import { ConfigurationReport } from "../reports/ConfigurationReport.js";
import { AppSensorUIConsoleSettings, EXCEL4NODE_CELL_STYLE } from "./appsensor-console-ui.js";
import { ConsoleReport } from "./ConsoleReport.js";

class ConsoleDetPointConfigReport extends ConsoleReport {

    private report: ConfigurationReport;
    private loaded = false;

    constructor(reportingEngine: ReportingEngineExt,
                autoReload: boolean) {
        super(reportingEngine, autoReload);

        this.report = new ConfigurationReport(reportingEngine);

        this.setHeader(["Detection System (\nClient application,\nExternal detect. system, etc.)",
                        "Category", "Label", "Threshold", "Responses"]);
        const topWrapStyle: EXCEL4NODE_CELL_STYLE = {alignment: {vertical: "top", wrapText: true}};
        const topStyle: EXCEL4NODE_CELL_STYLE = {alignment: {vertical: "top"}};
        ConsoleReport.mergeObjects(this.excelCellsConfig.headerCellsStyle[0], topWrapStyle);
        ConsoleReport.mergeObjects(this.excelCellsConfig.headerCellsStyle[1], topStyle);
        ConsoleReport.mergeObjects(this.excelCellsConfig.headerCellsStyle[2], topStyle);
        ConsoleReport.mergeObjects(this.excelCellsConfig.headerCellsStyle[3], topStyle);
        ConsoleReport.mergeObjects(this.excelCellsConfig.headerCellsStyle[4], topStyle);
    }

    async loadItems(earliest: string,
                    settings: AppSensorUIConsoleSettings): Promise<void> {
        if (!this.loaded || this.hasToReload) {
            this.hasToReload = false;
            
            const serverConfigurationString = await this.report.getServerConfiguration();

            const config: ServerConfiguration | null = new JSONServerConfigurationReader().readFromString(serverConfigurationString);

            if (config) {
                const topStyle: EXCEL4NODE_CELL_STYLE = {alignment: {vertical: "top"}};
                let mergeStart = 1;

                const detectionPoints = config.getDetectionPoints();

                detectionPoints.forEach((detPoint) => {
                    mergeStart = this.addDetectionPoint(detPoint, mergeStart, topStyle);
                });


                const customDetPoints = config.getCustomDetectionPoints();

                const entries = customDetPoints.entries();
                for (const entry of entries) {
                    entry[1].forEach(detPoint => {
                        mergeStart = this.addDetectionPoint(detPoint, mergeStart, topStyle, entry[0]);
                    });
                }
            }
                
            this.loaded = true;
        }
    }

    addDetectionPoint(detPoint: DetectionPoint, 
                      mergeStart: number,
                      style: EXCEL4NODE_CELL_STYLE, 
                      detSystemId: string = ""): number {
        const category = detPoint.getCategory();
        const label = Utils.getDetectionPointLabel(detPoint) || "";

        let thresholdStr = "";
        const threshold       = detPoint.getThreshold();
        if (threshold) {
            thresholdStr += threshold.getCount();
            const interval  = threshold.getInterval();
            if (interval) {
                thresholdStr = threshold.getCount() + 'x in ' + interval.getDuration() + ' ' + interval.getUnit();
            }
        }

        const detPointResponses = detPoint.getResponses();

        //prepare console report data
        //
        const responsesStr = this.getResponsesAsString(detPointResponses);

        const dataRow = [detSystemId, category, label, thresholdStr, responsesStr];
        
        this.addDataRow(dataRow);

        // prepare excel data
        //
        // for each response separate row for better scrolling
        for (let r = 0; r < detPointResponses.length; r++) {
            const responseStr = this.getResponseAsString(detPointResponses[r], r);
            const excelRow = [detSystemId, category, label, thresholdStr, responseStr];
            
            this.addExcelDataRow(excelRow);
        }

        let rowSpan = detPointResponses.length;
        if (rowSpan === 0) {
            this.addExcelDataRow([detSystemId, category, label, thresholdStr, ""]);
            rowSpan = 1;
        }

        let row1 = mergeStart;
        let row2 = row1 + rowSpan - 1;
        this.excelCellsConfig.dataCellsToMerge.push({row1: row1, col1: 1, row2: row2, col2: 1});
        this.excelCellsConfig.dataCellsStyle.push({row: row1, col: 1, styleOptions: style});
        this.excelCellsConfig.dataCellsToMerge.push({row1: row1, col1: 2, row2: row2, col2: 2});
        this.excelCellsConfig.dataCellsStyle.push({row: row1, col: 2, styleOptions: style});
        this.excelCellsConfig.dataCellsToMerge.push({row1: row1, col1: 3, row2: row2, col2: 3});
        this.excelCellsConfig.dataCellsStyle.push({row: row1, col: 3, styleOptions: style});
        this.excelCellsConfig.dataCellsToMerge.push({row1: row1, col1: 4, row2: row2, col2: 4});
        this.excelCellsConfig.dataCellsStyle.push({row: row1, col: 4, styleOptions: style});


        mergeStart += rowSpan;

        return mergeStart;
    }

    getResponsesAsString(responses: Response[]): string {
        let responsesStr = "";

        responses.forEach((el, index) => {
            if (responsesStr.length > 0) {
                responsesStr += "\n";
            } 

            responsesStr += this.getResponseAsString(el, index);
        });

        return responsesStr;
    }

    getResponseAsString(response: Response, index: number): string {
        let responseStr = (index + 1) + ". " + response.getAction();

        const responseInterval = response.getInterval();
        if (responseInterval) {
            responseStr += ` (maintains effect for ${responseInterval.getDuration()} ${responseInterval.getUnit()})`;
        }

        return responseStr;
    }

    protected override getDisplayTableConfig(columnCount: number,
                                             displayedDataRowCount: number,
                                             specificWidths?: {[index: number]: number}): TableUserConfig {

        // const columns: {[index: number]:ColumnUserConfig} = {4: {width:35, wrapWord: true}};

        return super.getDisplayTableConfig(columnCount, displayedDataRowCount, {2: 14, 4: 40});
    }

    filterItems(): void {
        throw new Error("Method not implemented.");
    }

    getReportName(): string {
        return "Detection Points Configuration";
    }

}

export {ConsoleDetPointConfigReport};