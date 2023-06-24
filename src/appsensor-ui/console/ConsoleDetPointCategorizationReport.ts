import { ColumnUserConfig, SpanningCellConfig, TableUserConfig } from "table";

import { AppSensorUIConsoleSettings, DetectionPointDescriptions, DET_POINT_CATEGORIZATION_DESCR, EXCEL4NODE_CELL_STYLE, EXCEL_CELLS_TO_MERGE } from "./appsensor-console-ui.js";
import { ConsoleReport } from "./ConsoleReport.js";

class ConsoleDetPointCategorizationReport extends ConsoleReport {

    private static DESCRIPTION_COLUMN_WIDTH = 30;

    private detectionPointDescriptions: DetectionPointDescriptions;
    private loaded = false;

    constructor(detectionPointDescriptions: DetectionPointDescriptions) {
        super();
        this.detectionPointDescriptions = detectionPointDescriptions;

        this.setHeader(["Category", "Description", "Affected Users", "Detection Points"]);
    }

    async loadItems(settings: AppSensorUIConsoleSettings): Promise<void> {
        if (!this.loaded) {
           
            const centerStyle: EXCEL4NODE_CELL_STYLE = {alignment: {vertical: "center"}};
            const centerWrapStyle: EXCEL4NODE_CELL_STYLE = {alignment: {vertical: "center", wrapText: true}};
            const topWrapStyle: EXCEL4NODE_CELL_STYLE = {alignment: {vertical: "top", wrapText: true}};

            let pair = 0;
            let rowIndex = 0;
            const entries = Object.entries(this.detectionPointDescriptions.Categorization);
            for (let entry of entries) {
                const categorization: DET_POINT_CATEGORIZATION_DESCR = entry[1];

                let detPointsStr = this.getDetectionPoints(categorization.one_user);

                let row = [entry[0], categorization.description, "One User", detPointsStr];

                this.adjustRowHeightForExcel(this.excelCellsConfig.rowHeightInLinse, rowIndex, row);

                this.addDataRow(row);

                rowIndex++;


                detPointsStr = this.getDetectionPoints(categorization.all_users);

                row = [entry[0], categorization.description, "All User", detPointsStr];

                this.adjustRowHeightForExcel(this.excelCellsConfig.rowHeightInLinse, rowIndex, row);

                this.addDataRow(row);

                rowIndex++;


                //excel cell options
                const row1 = pair * 2 + 2; //+1 for the header and + 1 since in excel numbering starts from 1
                const row2 = pair * 2 + 3; //+1 for the header and + 1 since in excel numbering starts from 1 + 1 for the next row
                this.excelCellsConfig.cellsToMerge.push({row1: row1, 
                                                         col1: 1, 
                                                         row2: row2, 
                                                         col2: 1});
                this.excelCellsConfig.cellsToMerge.push({row1: row1, 
                                                         col1: 2, 
                                                         row2: row2, 
                                                         col2: 2});

                this.excelCellsConfig.cellStyle.push({row: row1, col: 1, styleOprions: centerStyle});
                this.excelCellsConfig.cellStyle.push({row: row1, col: 2, styleOprions: centerWrapStyle});
                this.excelCellsConfig.cellStyle.push({row: row1, col: 3, styleOprions: centerStyle});
                this.excelCellsConfig.cellStyle.push({row: row2, col: 3, styleOprions: centerStyle});
                this.excelCellsConfig.cellStyle.push({row: row1, col: 4, styleOprions: topWrapStyle});
                this.excelCellsConfig.cellStyle.push({row: row2, col: 4, styleOprions: topWrapStyle});

                pair++;
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