import { ColumnUserConfig, SpanningCellConfig, TableUserConfig } from "table";

import { ReportingEngineExt } from "@appsensorlike/appsensorlike/reporting-engines/reporting-engines.js";

import { AppSensorUIConsoleSettings, EXCEL4NODE_CELL_STYLE } from "./appsensor-ui-console.js";
import { ConsoleReport } from "./ConsoleReport.js";
import { DetectionPointDescriptions, DET_POINT_CATEGORIZATION_DESCR } from "./DetectionPointDescriptions.js";

class ConsoleDetPointCategorizationReport extends ConsoleReport {

    public static ID = 'DetPointCategorization';

    private static DESCRIPTION_COLUMN_WIDTH = 30;

    private detectionPointDescriptions: DetectionPointDescriptions;
    private loaded = false;

    constructor(reportingEngine: ReportingEngineExt,
                detectionPointDescriptions: DetectionPointDescriptions) {
        super(reportingEngine);
        this.detectionPointDescriptions = detectionPointDescriptions;

        this.setHeader(["Category", "Description", "Affected Users", "Detection Points"]);
    }

    async loadItems(earliest: string,
                    settings: AppSensorUIConsoleSettings): Promise<void> {
        if (!this.loaded) {
           
            const centerStyle: EXCEL4NODE_CELL_STYLE = {alignment: {vertical: "center"}};
            const centerWrapStyle: EXCEL4NODE_CELL_STYLE = {alignment: {vertical: "center", wrapText: true}};

            let mergeStart = 1;

            const entries = Object.entries(this.detectionPointDescriptions.Categorization);
            for (let entry of entries) {
                const categorization: DET_POINT_CATEGORIZATION_DESCR = entry[1];

                //prepare console report data
                //
                let detPointsStr = this.getDetectionPoints(categorization.one_user);

                let row = [entry[0], categorization.description, "One User", detPointsStr];

                this.addDataRow(row);


                detPointsStr = this.getDetectionPoints(categorization.all_users);

                row = [entry[0], categorization.description, "All User", detPointsStr];

                this.addDataRow(row);


                // prepare excel data
                //
                // in contrasto to console data we want 
                // each detection point to be on a separate row for a better scrolling in excel
                // 
                categorization.one_user.forEach((el) => {
                    let detPointStr = "";
                    const propDesc = Object.getOwnPropertyDescriptor(this.detectionPointDescriptions.IDs, el);
                    if (propDesc) {
                        detPointStr += `${el}(${propDesc.value})`;
                    }

                    const row = [entry[0], categorization.description, "One User", detPointStr];

                    this.addExcelDataRow(row);
                });

                let rowSpan = categorization.one_user.length;
                if (rowSpan === 0) {
                    this.addExcelDataRow([entry[0], categorization.description, "One User", ""]);
                    rowSpan = 1;
                }

                //merge on "Affected Users" column
                //
                let row1 = mergeStart;
                let row2 = row1 + rowSpan - 1;
                this.excelCellsConfig.dataCellsToMerge.push({row1: row1, col1: 3, row2: row2, col2: 3});
                this.excelCellsConfig.dataCellsStyle.push({row: row1, col: 3, styleOptions: centerStyle});


                mergeStart += rowSpan;
    

                categorization.all_users.forEach((el) => {
                    let detPointStr = "";
                    const propDesc = Object.getOwnPropertyDescriptor(this.detectionPointDescriptions.IDs, el);
                    if (propDesc) {
                        detPointStr += `${el}(${propDesc.value})`;
                    }

                    let row = [entry[0], categorization.description, "All User", detPointStr];

                    this.addExcelDataRow(row);
                });
                
                rowSpan = categorization.all_users.length;
                if (rowSpan === 0) {
                    this.addExcelDataRow([entry[0], categorization.description, "All User", ""]);
                    rowSpan = 1;
                }

                //merge on "Affected Users" column
                //
                row1 = mergeStart;
                row2 = row1 + rowSpan - 1;
                this.excelCellsConfig.dataCellsToMerge.push({row1: row1, col1: 3, row2: row2, col2: 3});
                this.excelCellsConfig.dataCellsStyle.push({row: row1, col: 3, styleOptions: centerStyle});


                mergeStart += rowSpan;


                //merge on "Category", "Description" columns
                //
                rowSpan = (categorization.one_user.length > 0 ? categorization.one_user.length : 1)  + 
                          (categorization.all_users.length > 0 ? categorization.all_users.length : 1);
                const start = mergeStart - rowSpan;

                row1 = start;
                row2 = row1 + rowSpan - 1;
                this.excelCellsConfig.dataCellsToMerge.push({row1: row1, col1: 1, row2: row2, col2: 1});
                this.excelCellsConfig.dataCellsStyle.push({row: row1, col: 1, styleOptions: centerWrapStyle});
                this.excelCellsConfig.dataCellsToMerge.push({row1: row1, col1: 2, row2: row2, col2: 2});
                this.excelCellsConfig.dataCellsStyle.push({row: row1, col: 2, styleOptions: centerWrapStyle});

            } 

            //mind that we set a fixed width of Description column in getDisplayTableConfig method
            this.colMaxCharacters[1] = ConsoleDetPointCategorizationReport.DESCRIPTION_COLUMN_WIDTH;
            

            this.loaded = true;
        }
    }

    private getDetectionPoints(detectionPointIDs: string[]): string {
        let detPointsStr = "";
        detectionPointIDs.forEach((el, index) => {
            if (index > 0) {
                detPointsStr += "\n";
            }
            const propDesc = Object.getOwnPropertyDescriptor(this.detectionPointDescriptions.IDs, el);
            if (propDesc) {
                detPointsStr += `${el}(${propDesc.value})`;
            }
        });
        return detPointsStr;
    }

    protected override getDisplayTableConfig(columnCount: number,
                                             displayedDataRowCount: number,
                                             specificWidths?: {[index: number]: number}): TableUserConfig {

        let start = this.topItemIndex;

        let end = start + displayedDataRowCount;

        let configRow = 0; //header row
        const spanningCells: SpanningCellConfig[] = [];
        for (let i = start; i < end; i++) { //starts from 1 as 0 is the header
            configRow++;

            //every even and odd  rows according to this.data if they are visible are spanned
            if (i % 2 === 0) {
                //displayed row is even according to this.data
                if (i + 1 < end) {
                    spanningCells.push({ col: 0, row: configRow, rowSpan: 2, verticalAlignment: 'middle'});
                    spanningCells.push({ col: 1, row: configRow, rowSpan: 2, verticalAlignment: 'middle'});
                }
            } else {
                //displayed row is odd according to this.data

            }
        }

        const columns: {[index: number]:ColumnUserConfig} = {1: {width:ConsoleDetPointCategorizationReport.DESCRIPTION_COLUMN_WIDTH, 
                                                                 wrapWord: true},
                                                             2: {verticalAlignment: "middle"}};

        return {columns: columns, spanningCells: spanningCells};
    }


    filterItems(): void {
        throw new Error("Method not implemented.");
    }

    getReportName(): string {
        return "Detection Point Categorization";
    }

}

export {ConsoleDetPointCategorizationReport};