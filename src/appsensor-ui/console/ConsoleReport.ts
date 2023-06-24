import { Spinner } from "cli-spinner";
import { ColumnUserConfig, table, TableUserConfig } from "table";

import { AppSensorUIConsoleSettings, EXCEL_CELLS_CONFIG, EXCEL_CELLS_TO_MERGE } from "./appsensor-console-ui.js";

abstract class ConsoleReport {
    protected DEFAULT_DISPLAY_TABLE_WIDTH = 150; //character

    protected topItemIndex: number = 0;
    protected itemCount: number = 0;

    //displayed data
    protected header: string[] = [];
    protected data: string[][] = [];
    //collects max. number of characters per column
    protected colMaxCharacters: number[] = [];

    protected excelCellsConfig: EXCEL_CELLS_CONFIG = {cellStyle: [], cellsToMerge: [], rowHeightInLinse: []};

    protected spinner = new Spinner("Loading ...");

    constructor() {
        this.spinner.setSpinnerString(18);
    }

    async loadItems(settings: AppSensorUIConsoleSettings) {};
                                                                                                                           
    async getData(settings: AppSensorUIConsoleSettings): Promise<string[][]> {
        if (this.data.length === 0) {
            await this.loadItems(settings); //if the report hasn't been touched yet, load the data
        }
        return this.data;
    }

    getHeader(): string[] {
        return this.header;
    }

    getColMaxCharacters(): number[] {
        return this.colMaxCharacters;
    }

    protected adjustColMaxCharacters(row: string[]) {
        if (this.colMaxCharacters.length === 0) {
            this.colMaxCharacters = new Array(row.length).fill(0);
        }

        for (let c = 0; c < row.length; c++) {
            let elLength = row[c].length;

            const splitted = row[c].split("\n");
            if (splitted.length > 0) {
                splitted.forEach((el, index) => {
                    if (index === 0) {
                        elLength = el.length;
                    } else if (elLength < el.length) {
                        elLength = el.length;
                    }
                });
            }

            if (this.colMaxCharacters[c] < elLength) {
                this.colMaxCharacters[c] = elLength;
            }
        }
    }

    protected adjustRowHeightForExcel(rowHeights: number[], rowIndex: number, row: string[]) {
        while (rowHeights.length - 1 < rowIndex) {
            rowHeights.push(1);
        }

        let height = 1;
        for (let c = 0; c < row.length; c++) {
            const splitted = row[c].split("\n");
            if (splitted.length > height) {
                height = splitted.length;
            }
        }

        rowHeights[rowIndex] = height;
    }

    protected setHeader(row: string[]) {
        this.adjustColMaxCharacters(row);

        this.header = row;
    }

    protected initData() {
        this.data = [];
        this.itemCount = 0;
    }

    protected addDataRow(row: string[]) {
        this.adjustColMaxCharacters(row);

        this.data.push(row);
                
        this.itemCount = this.data.length;
    }

    protected getDisplayTableConfig(columnCount: number, 
                                    displayedDataRowCount: number,
                                    specificWidths?: {[index: number]: number}): TableUserConfig {
        //by default distribute space equaly among the columns

        const colPaddingBorder = 1 + 1 + 1 + 1; //border left + padding left + padding right + border right;
        let columnWidth = (this.DEFAULT_DISPLAY_TABLE_WIDTH - (columnCount * colPaddingBorder)) / columnCount ;
        if (specificWidths) {
            let specificWidthsTotal = 0;
            let specWidthCount = 0;
            for (let key in specificWidths) {
                specWidthCount++;

                specificWidthsTotal += specificWidths[key] + colPaddingBorder;
            }

            columnWidth = (this.DEFAULT_DISPLAY_TABLE_WIDTH - specificWidthsTotal - ((columnCount - specWidthCount) * colPaddingBorder)) / (columnCount - specWidthCount);
        }

        const columns: {[index: number]:ColumnUserConfig} = {};
        for (let i = 0; i < columnCount; i++) {
            let width = columnWidth;
            if (specificWidths && i in specificWidths) {
                width = specificWidths[i];
            }
            const colConfig: ColumnUserConfig = {width: width};
            
            columns[i] = colConfig;
        }

        return {columns: columns};
    }

    display(settings: AppSensorUIConsoleSettings): string {

        let start = this.topItemIndex;

        let end = start + settings.maxDisplayedItems! - 1;
        if (end > this.itemCount - 1) {
            end = this.itemCount - 1;
        }

        const dataToDisplay: string[][] = [];
        
        dataToDisplay.push(this.header);
        
        for (let i = start; i <= end; i++) {
            dataToDisplay.push(this.data[i]);
        }

        let columnCount = 1;
        if (this.header.length > 0) {
            columnCount = this.header.length;
        }

        const config = this.getDisplayTableConfig(columnCount, dataToDisplay.length - 1); //displayed rows without header as it is always present
        return table(dataToDisplay, config); 
    }

    abstract filterItems(): void;

    abstract getReportName(): string;

    toItem(settings: AppSensorUIConsoleSettings, topItemIndex: number) {
        this.topItemIndex = topItemIndex - 1;

        //mind topItemIndex starts from 0
        if (this.topItemIndex + settings.maxDisplayedItems! >= this.itemCount) {
            this.topItemIndex = this.itemCount - settings.maxDisplayedItems!;
        }
        
        if (this.topItemIndex < 0) {
            this.topItemIndex = 0;
        }
    }

    toPreviousItems(settings: AppSensorUIConsoleSettings) {
        this.topItemIndex -= settings.maxDisplayedItems!;

        if (this.topItemIndex < 0) {
            this.topItemIndex = 0;
        }
    }

    toNextItems(settings: AppSensorUIConsoleSettings) {
        this.topItemIndex += settings.maxDisplayedItems!;

        //mind topItemIndex starts from 0
        if (this.topItemIndex >= this.itemCount) {
            this.topItemIndex = this.itemCount - settings.maxDisplayedItems!;
        }

        if (this.topItemIndex < 0) {
            this.topItemIndex = 0;
        }
    }

    getItemsCount() {
        return this.itemCount;
    }

    getTopItemIndex() {
        return this.topItemIndex;
    }

    getExcelCellsConfig(): EXCEL_CELLS_CONFIG {
        return this.excelCellsConfig;
    }

    public static formatTimestamp(timestamp: Date | undefined,
                                  includeSecondFraction: boolean = true,
                                  includeTimeZoneOffset: boolean = true): string {
        let timestampStr = "";
        if (timestamp) {
            const timezoneOffsetInMinutes = timestamp.getTimezoneOffset();

            const timestampLocal = new Date(timestamp.getTime() + (timezoneOffsetInMinutes * -1 * 60 * 1000));
            timestampStr = timestampLocal.toISOString().replace('T', ' ').replace('Z', '');

            if (!includeSecondFraction) {
                const ind = timestampStr.indexOf('.');
                if (ind > -1) {
                    timestampStr = timestampStr.slice(0, ind);
                }
            }
            
            if (includeTimeZoneOffset) {
                const timezoneOffsetInHours = (timezoneOffsetInMinutes * -1) / 60;
                let timezoneOffsetInHoursStr = timezoneOffsetInHours + ":00";
                if (timezoneOffsetInHoursStr.length < 5) {
                    timezoneOffsetInHoursStr = "0" + timezoneOffsetInHoursStr;
                }
    
                timestampStr += (timezoneOffsetInMinutes * -1 > 0 ? "+" : "-") + timezoneOffsetInHoursStr;
            }
        }
        return timestampStr;
    }

    protected startSpinner() {
        this.spinner.start();
    }

    protected stopSpinner() {
        this.spinner.stop();
    }
}

export {ConsoleReport};