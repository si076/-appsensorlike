#!/usr/bin/env node

import { ReportingEngineExt } from "@appsensorlike/appsensorlike/reporting-engines/reporting-engines.js";
import { AppSensorEvent, Attack, IValidateInitialize, Response} from "@appsensorlike/appsensorlike/core/core.js";
import { JSONConfigReadValidate } from "@appsensorlike/appsensorlike/utils/Utils.js";

import { AppSensorReportingWebSocketClient } from "@appsensorlike/appsensorlike_reporting_engines_websocket/client";

import { ConsoleAllActivitiesReport } from "./ConsoleAllActivitiesReport.js";
import { ConsoleMostActiveDetPointsReport, ConsoleMostActiveUsersReport } from "./ConsoleMostActiveReports.js";
import { ConsoleDetPointCategorizationReport } from "./ConsoleDetPointCategorizationReport.js";
import { ConsoleReport } from "./ConsoleReport.js";
import { ConsoleTrendsReport } from "./ConsoleTrendsReport.js";
import { ConsoleDetPointConfigReport } from "./ConsoleDetPointConfigReport.js";
import { DetectionPointDescriptions, DetectionPointDescriptionsReader } from "./DetectionPointDescriptions.js";

import fs from 'fs';
import readline from 'readline';

// @ts-ignore
import { input, select } from '@inquirer/prompts';
// @ts-ignore
import {CancelablePromise} from '@inquirer';
// @ts-ignore
import excel4node from 'excel4node/distribution/index.js';
import { table } from 'table';
import chalk from 'chalk';
import { MonthDay, Year } from "@js-joda/core";
import { parse, UsageGuideConfig } from 'ts-command-line-args';

class BaseSettings {
    autoReload?: boolean;
    autoReloadTimeMs?: number;
    maxDisplayedItems?: number;
}

class CommandLineOptions extends BaseSettings {
    report?: string;
    earliest?: string;
    export?: boolean;
    help?: boolean;
}

const ALL_REPORTS: string = "All";

const AVAILABLE_REPORTS: string[] = [ALL_REPORTS, 
    ConsoleAllActivitiesReport.ID,  
    ConsoleMostActiveDetPointsReport.ID,
    ConsoleMostActiveUsersReport.ID,
    ConsoleTrendsReport.ID,
    ConsoleDetPointConfigReport.ID,
    ConsoleDetPointCategorizationReport.ID]; 

//prepared for ts-command-line-args module's write-markdown but
//it doesn't support ES module loading!
const USAGE_GUIDE_INFO: UsageGuideConfig<CommandLineOptions> = {
    arguments: {
        report: {type: String, optional: true, 
                 alias: 'r', defaultValue: 'All', 
                 description: `Report to be displayed/exported, one of: ${AVAILABLE_REPORTS.join(', ')}`},
        earliest: {type: String, optional: true, alias: 'e',
                   description: 'Report earliest date (server UTC) in format YYYY-MM-DD HH:mm:ss.sss (fraction part .sss is optional)'},
        export: {type: Boolean, optional: true, alias: 'x',
                 description: 'Export report(s) to an excel file in the working directory. If this option is set, report(s) are not displayed!'},
        autoReload: {type: Boolean, optional: true, alias: 'a', 
                     description: 'Set on auto reload'},
        autoReloadTimeMs: {type: Number, optional: true, alias: 't',
                            description: 'Auto reload interval in milliseconds'},
        maxDisplayedItems: {type: Number, optional: true, alias: 'i',
                            description: 'Maximum displayed items at once'},
        help: {type: Boolean, optional: true, alias: 'h', 
               description: 'Prints this usage guide' },
    },
    parseOptions: {
        helpArg: 'help',
        headerContentSections: [{header: 'AppSensorLike Console Reports', 
                                 content: 'Display most of AppSensor Dashboard reports on console. Reports data can be exported to an excel file in the background.' }],
        footerContentSections: [{header: '', content: `MIT license. Project home: {underline https://github.com/si076/appsensorlike}` }],
    }
}


class AppSensorUIConsoleSettings extends BaseSettings implements IValidateInitialize {
    lastCheck?: Date;

    checkValidInitialize(): void {
        if (!this.lastCheck) {
            this.lastCheck = new Date(0);
        } else {
            this.lastCheck = new Date(this.lastCheck);
        }

        if (!this.autoReload) {
            this.autoReload = false;
        }

        if (!this.autoReloadTimeMs) {
            this.autoReloadTimeMs = 30000;
        }

        if (!this.maxDisplayedItems) {
            this.maxDisplayedItems = 5;
        }
    }
}

class AppSensorUIConsoleSettingsLoader extends JSONConfigReadValidate {
    static DEFAULT_FILE: string = 'appsensor-console-ui-settings.json'; 

    protected settingsFile?: string

    constructor(settingsFile?: string) {
        super(import.meta.url,
              AppSensorUIConsoleSettingsLoader.DEFAULT_FILE, 
              null, 
              AppSensorUIConsoleSettings.prototype);

        this.settingsFile = settingsFile;
    }

    public loadSettings(): AppSensorUIConsoleSettings {
        const settings: AppSensorUIConsoleSettings = super.read(this.settingsFile);
        return settings;
    }

    public saveSettings(settings: AppSensorUIConsoleSettings) {
        let file = this.settingsFile;
        if (!file) {
            file = AppSensorUIConsoleSettingsLoader.DEFAULT_FILE;
        }
        fs.writeFileSync(file, JSON.stringify(settings), {encoding: 'utf8'});
    }
}


type EXCEL4NODE_CELL_STYLE = {
    alignment?: { // §18.8.1
        horizontal?: 'center'| 'centerContinuous'| 'distributed' | 'fill' | 'general' | 'justify' | 'left' | 'right',
        indent?: number, // Number of spaces to indent = indent value * 3
        justifyLastLine?: boolean,
        readingOrder?: 'contextDependent'| 'leftToRight' | 'rightToLeft', 
        relativeIndent?: number, // number of additional spaces to indent
        shrinkToFit?: boolean,
        textRotation?: number, // number of degrees to rotate text counter-clockwise
        vertical?: 'bottom'| 'center' | 'distributed' | 'justify' | 'top',
        wrapText?: boolean
    },
    font?: { // §18.8.22
        bold?: boolean,
        charset?: number,
        color?: string,
        condense?: boolean,
        extend?: boolean,
        family?: string,
        italics?: boolean,
        name?: string,
        outline?: boolean,
        scheme?: string, // §18.18.33 ST_FontScheme (Font scheme Styles)
        shadow?: boolean,
        strike?: boolean,
        size?: number,
        underline?: boolean,
        vertAlign?: string // §22.9.2.17 ST_VerticalAlignRun (Vertical Positioning Location)
    },
    border?: { // §18.8.4 border (Border)
        left?: {
            style: string,
            color: string
        },
        right?: {
            style: string,
            color: string
        },
        top?: {
            style: string,
            color: string
        },
        bottom?: {
            style: string,
            color: string
        },
        diagonal?: {
            style: string,
            color: string
        },
        diagonalDown?: boolean,
        diagonalUp?: boolean,
        outline?: boolean
    },
    fill?: { 
        type: 'gradient' | 'pattern' | 'none',
        //gradient options
        bottom?: number, //decimal between 0 and 1
        degree?: number,
        left?: number, //decimal between 0 and 1
        right?: number, //decimal between 0 and 1
        top?: number, //decimal between 0 and 1
        stops?:{ color: string; position: number; }[],
        //pattern options
        patternType?: 'darkDown'| 'darkGray'| 'darkGrid'| 'darkHorizontal'| 'darkTrellis'| 'darkUp'| 'darkVerical'| 'gray0625'| 'gray125'| 'lightDown'| 'lightGray'| 'lightGrid'| 'lightHorizontal'| 'lightTrellis'| 'lightUp'| 'lightVertical'| 'mediumGray'| 'none'| 'solid',
        bgColor?: string, // HTML style hex value. defaults to black
        fgColor?: string // HTML style hex value. defaults to black.
    },
    numberFormat?: number | string // §18.8.30 numFmt (Number Format)
}


type EXCEL_CELLS_TO_MERGE = {row1: number, col1: number, row2: number, col2: number};
type EXCEL_CELL_STYLE = {row: number, col: number, styleOptions: EXCEL4NODE_CELL_STYLE}
type EXCEL_CELLS_CONFIG = {headerRowHeight: number, //in lines
                           headerCellsStyle: EXCEL4NODE_CELL_STYLE[], 
                           dataCellsToMerge: EXCEL_CELLS_TO_MERGE[],
                           dataCellsStyle: EXCEL_CELL_STYLE[],
                           dataRowsHeight: number[]}; //in lines

class ReportingConsole {

    private reportingEngine: ReportingEngineExt;

    private settings: AppSensorUIConsoleSettings = new AppSensorUIConsoleSettings();
    private repotingSettingsLoader = new AppSensorUIConsoleSettingsLoader(AppSensorUIConsoleSettingsLoader.DEFAULT_FILE);

    private commandLineOptions: CommandLineOptions;

    private detectionPointDescriptions: DetectionPointDescriptions;

    private earliest: string;
    private reports: ConsoleReport[] = [];
    private currentReport: ConsoleReport;
    private actionPromise: CancelablePromise | null = null;
    private timeoutID: NodeJS.Timeout | null = null;

    constructor(reportingEngine: ReportingEngineExt) {
        this.reportingEngine = reportingEngine;

        this.settings = this.repotingSettingsLoader.loadSettings();
        this.detectionPointDescriptions = new DetectionPointDescriptionsReader().read();

        this.commandLineOptions = this.getCommandLineOptions();

        if (!this.validateCommandLineOptions(this.commandLineOptions)) {
            process.exit(1);
        }

        this.earliest = this.settings.lastCheck!.toISOString();
        if (this.commandLineOptions.earliest) {
            if (this.commandLineOptions.earliest.indexOf('.') > 0) {
                this.commandLineOptions.earliest += 'Z';
            }
            this.earliest = this.commandLineOptions.earliest;
        }

        if (!this.commandLineOptions.export) {
            if (this.commandLineOptions.autoReload) {
                this.settings.autoReload = this.commandLineOptions.autoReload;
            }
    
            if (this.commandLineOptions.autoReloadTimeMs) {
                this.settings.autoReloadTimeMs = this.commandLineOptions.autoReloadTimeMs;
            }
    
            if (this.commandLineOptions.maxDisplayedItems) {
                this.settings.maxDisplayedItems = this.commandLineOptions.maxDisplayedItems;
            }
        }

        this.setReports(this.commandLineOptions.report || ALL_REPORTS);

        this.currentReport = this.reports[0];

        if (!this.settings.autoReload) {
            //let new events only buble if autoRefresh is off 
            this.reportingEngine.addOnAddListener(this.onAdd.bind(this));
        }
    }

    getCommandLineOptions(): CommandLineOptions {
        return parse<CommandLineOptions>(USAGE_GUIDE_INFO.arguments, USAGE_GUIDE_INFO.parseOptions);
    }

    validateCommandLineOptions(commandLineOptions: CommandLineOptions): boolean {
        if (commandLineOptions.report && AVAILABLE_REPORTS.indexOf(commandLineOptions.report) === -1) {
            console.log("Invalid Report: ${commandLineOptions.report}");
            return false;
        }

        if (commandLineOptions.earliest) {
            const res = this.validateEarliestDate(commandLineOptions.earliest);
            if (typeof res === "string") {
                console.log(`Invalid earliest date: ${res}`);
                return false;
            }
        }

        return true;
    }

    setReports(reportName: string = ALL_REPORTS) {
        switch (reportName) {
            case ALL_REPORTS:
            case ConsoleAllActivitiesReport.ID: {
                this.reports.push(new ConsoleAllActivitiesReport(this.reportingEngine, 
                                                                 this.detectionPointDescriptions));
                if (reportName !== ALL_REPORTS) {
                    break;
                }
            }
            case ALL_REPORTS:
            case ConsoleMostActiveDetPointsReport.ID: {
                this.reports.push(new ConsoleMostActiveDetPointsReport(this.reportingEngine));
                if (reportName !== ALL_REPORTS) {
                    break;
                }
            }
            case ALL_REPORTS:
            case ConsoleMostActiveUsersReport.ID: {
                this.reports.push(new ConsoleMostActiveUsersReport(this.reportingEngine));
                if (reportName !== ALL_REPORTS) {
                    break;
                }
            }
            case ALL_REPORTS:
            case ConsoleTrendsReport.ID: {
                this.reports.push(new ConsoleTrendsReport(this.reportingEngine));
                if (reportName !== ALL_REPORTS) {
                    break;
                }
            }
            case ALL_REPORTS:
            case ConsoleDetPointConfigReport.ID: {
                this.reports.push(new ConsoleDetPointConfigReport(this.reportingEngine));
                if (reportName !== ALL_REPORTS) {
                    break;
                }
            }
            case ALL_REPORTS:
            case ConsoleDetPointCategorizationReport.ID: {
                this.reports.push(new ConsoleDetPointCategorizationReport(this.reportingEngine, 
                                                                          this.detectionPointDescriptions));
                if (reportName !== ALL_REPORTS) {
                    break;
                }
            }
        }
    }

    public async run() {
        if (this.commandLineOptions.export) {
            await this.exportToExcel(this.settings, this.reports);
            process.exit(0);
        } else {
            await this.reportLoop();
        }
    }

    private async reportLoop() {

        let answer = null;
        while (answer !== 'exit') {
            console.clear();
            
            await this.currentReport.loadItems(this.earliest, this.settings);

            console.clear();

            console.log(this.prepareMainTable(this.settings, this.currentReport));

            this.actionPromise = this.prepareActionsMenu(this.settings, this.currentReport);

            const promises: Promise<string>[] = [this.actionPromise];
            if (this.settings.autoReload) {
                const reloadPromise = this.reloadAfter(this.settings.autoReloadTimeMs!);
                promises.splice(0, 0, reloadPromise);
            }

            const action = await Promise.race(promises).
                                    catch(error => {
                                        if (error instanceof Error &&
                                            error.message === 'Prompt was canceled') {
                                            //do nothing
                                        }
                                    });

            this.actionPromise = null;
            if (this.timeoutID) {
                clearTimeout(this.timeoutID);
            }              
                 
            await this.onAction(action!, this.settings);
        }     
           
    }

	public reloadAfter(timeOutInMilis: number): Promise<string> {
		return new Promise((resolve, reject) => {
			this.timeoutID = setTimeout(() => {
                                if (this.actionPromise !== null) {
                                    this.actionPromise.cancel();
                                }
                                resolve('reloadNow');
                            }, timeOutInMilis);
		});

	}

    protected onAdd(event: AppSensorEvent | Attack | Response): void {
        this.reports.forEach(el => {
            el.onAdd(event);
        });

        //allow console to reload
        if (this.actionPromise !== null) {
            this.actionPromise.cancel();
        }
    }

    async onAction(action: string, 
                   settings: AppSensorUIConsoleSettings) {
        switch (action) {
            case 'chooseReport': {
                await this.prepareReportsMenu(this.reports)
                .then((answer) => {
                    if (answer) {
                        let selectedReport = Number.parseInt(answer);
                        selectedReport -= 1;

                        this.currentReport = this.reports[selectedReport];
                    }
                })
                .catch();
                
                break
            }
            case 'earliestDate': {
                await this.prepareEarliestDate(settings)
                .then((answer) => {
                    if (answer && answer.trim().length > 0) {
                        this.earliest = answer.trim().replace(' ', 'T') + 'Z';
                    }
                })
                .catch();
                break
            }
            case 'itemsNavigation': {
                await this.prepareItemsNavigation(this.currentReport)
                .then((answer) => {
                    switch (answer) {
                        case 'P': 
                        case 'p': {
                            this.currentReport.toPreviousItems(settings);
                            break;
                        }
                        case 'N': 
                        case 'n': {
                            this.currentReport.toNextItems(settings);
                            break;
                        }
                        default: {
                            const itemIndex = Number.parseInt(answer);
                            this.currentReport.toItem(settings, itemIndex);
                            break;
                        }
                    }
                })
                .catch();


                break
            }
            case 'exportReports': {
                await this.exportToExcel(settings, this.reports);

                break;
            }
            case 'reloadNow': {
                this.reports.forEach(el => {
                    el.setHasToReload();
                });

                break;
            }
            case 'exit': {
                settings.lastCheck = new Date();
                this.repotingSettingsLoader.saveSettings(settings);

                process.exit(0);

                break;
            }
        }
    }

    prepareActionsMenu(settings: AppSensorUIConsoleSettings, report: ConsoleReport): CancelablePromise<string> {
        let itemsNavigationDisabled = true;
        if (report.getItemsCount() > settings.maxDisplayedItems!) {
            itemsNavigationDisabled = false;
        }
        return select<string>(
            {
                message: 'Choose action',
                choices: [
                    {
                        value: 'chooseReport',
                        name: 'Choose a report'
                        //short: 'Press <Shift + F> to back to main menu!'
                    },
                    {
                        value: 'exportReports',
                        name: 'Export report(s) to an excel file in the working directory'
                        //short: 'Press <Shift + F> to back to main menu!'
                    },
                    { 
                        value: 'itemsNavigation',
                        name: 'Items navigation (when more than currently displayed)',
                        disabled: itemsNavigationDisabled
                        //short: 'Press <Shift + F> to back to main menu!'
                    },
                    {
                        value: 'earliestDate',
                        name: 'Change the report earliest date'
                        //short: 'Press <Shift + F> to back to main menu!'
                    },
                    {
                        value: 'reloadNow',
                        name: 'Reload now'
                        //short: 'Press <Shift + F> to back to main menu!'
                    },
                    {
                        value: 'exit',
                        name: 'Exit',
                    }
                ]
            }
        );
    }

    prepareReportsMenu(reports: ConsoleReport[]): Promise<string> {
        const choices: {value: string, name: string}[] = [];
        reports.forEach((el, index) => {
            const number = index + 1;
            choices.push({value: new Number(number).toString(), 
                          name: `${number}. ${el.getReportName()}`});
        });
        return select<string>({
                    message: 'Report:',
                    choices: choices
                });
    }

    prepareItemsNavigation(report: ConsoleReport): Promise<string> {
        const reportItemsCount = report.getItemsCount();
        const itemsFromTo = '1 - ' + reportItemsCount;
        return input({
            message: `Go to items by typing: 'P'/'p'(previous); 'N'/'n'(next); a number in range [${itemsFromTo}]:`,
            // interruptedKeyName: 'shift+f',
            validate: (userInput: any) => {
                if (userInput !== 'p' &&
                    userInput !== 'P' &&
                    userInput !== 'n' &&
                    userInput !== 'N' &&
                    Number.isNaN(userInput) &&
                    (userInput < 1 || userInput > reportItemsCount)) {
                    return "You have to type: 'P' or 'p'; 'N' or 'n'; a number in range [1 - " + reportItemsCount + "]";
                }
                return true;
            }
        });
    }

    prepareEarliestDate(settings: AppSensorUIConsoleSettings): Promise<string> {
        return input({
            message: 'Report earliest date (server UTC) in format YYYY-MM-DDTHH:mm:ss.sss (fraction part .sss is optional):',
            validate: this.validateEarliestDate
        });
    }

    validateEarliestDate(userInput: any): string | true {
        const regExpr = "([0-9]{4})-([0-9]{2})-([0-9]{2})T([0-9]{2})\:([0-9]{2})\:([0-9]{2})(\.([0-9]{3}))*";
        if (userInput) {
            const match = userInput.match(regExpr);
            if (match) {
                const yearStr             = match[1];
                const monthStr            = match[2];
                const dayStr              = match[3];
                const hourStr             = match[4];
                const minutesStr          = match[5];
                const secondsStr          = match[6];

                const month = Number.parseInt(monthStr);
                if (month < 1 || month > 12) {
                    return `Invalid month: ${month}; Month has to be in range [01-12]`
                }

                const day = Number.parseInt(dayStr);
                if (day < 1 || day > 31) {
                    return `Invalid day of month: ${day}; Day has to be in range [01-31]`
                }

                const year = Number.parseInt(yearStr);
                const yearJoda = Year.of(year);
                if (!yearJoda.isValidMonthDay(MonthDay.of(month, day))) {
                    return `${day} is not a valid day for the combination of year and month ${year}-${month}`;
                }

                const hour = Number.parseInt(hourStr);
                if (hour > 23) {
                    return `Invalid hour: ${hour}; Hour has to be in range [00-23]`;
                }
                
                const minutes = Number.parseInt(minutesStr);
                if (minutes > 59) {
                    return `Invalid minutes: ${minutes}; Minutes has to be in range [00-59]`;
                }
                
                const seconds = Number.parseInt(secondsStr);
                if (seconds > 59) {
                    return `Invalid seconds: ${seconds}`;
                }
                
            } else {
                return "Invalid date format";
            }
        }
        return true;
    }

    prepareMainTable(settings: AppSensorUIConsoleSettings, report: ConsoleReport): string {
        const data: string[][] = [];

        
        data.push([report.getReportName()]);
        data.push(["Report since: " + ConsoleReport.formatTimestamp(new Date(this.earliest)) + "\n" +
                   "User: All\n" + 
                   "Detection System: All"]);
        data.push([report.display(settings)]);

        let itemsCountStr = "0 of 0";
        const itemsCount = report.getItemsCount();
        const reportTopItemIndex = report.getTopItemIndex();
        if (itemsCount > 0) {
            
            if (itemsCount > settings.maxDisplayedItems!) {

                if ((reportTopItemIndex + settings.maxDisplayedItems!) > itemsCount) {
                    itemsCountStr = "[" + (reportTopItemIndex + 1) + " - " + itemsCount + "] of " + itemsCount;
                } else {
                    itemsCountStr = "[" + (reportTopItemIndex + 1) + " - " + (reportTopItemIndex + settings.maxDisplayedItems!) + "] of " + itemsCount;
                }
            } else {
                itemsCountStr = "[1 - " + itemsCount + "] of " + itemsCount;
            }
        }

        const maxDisplayedItemsAtOnce = new Number(settings.maxDisplayedItems!).toString();

        let footer = "Showing items: " + itemsCountStr + "; Maximum displayed items at once: " + maxDisplayedItemsAtOnce;
        const newObjectSinceLastReload = report.getNewObjectSinceLastReload();
        if (newObjectSinceLastReload) {
            footer += "; New Since Last Reload: " + 
                      "Events: " + chalk.yellow.bgWhite(this.formatNumber(newObjectSinceLastReload.events)) + " " + 
                      "Attacks: " + chalk.red.bgWhite(this.formatNumber(newObjectSinceLastReload.attacks)) + " " +
                      "Responses: " + chalk.green.bgWhite(this.formatNumber(newObjectSinceLastReload.responses));
        } 

        data.push([footer]);

        return table(data);//, config);
    }

    formatNumber(num: number): string {
        let formated = "" + num;
        while(formated.length < 3) {
            formated = " " + formated;
        }
        return formated;
    }

    clearLine (stream: NodeJS.WritableStream) {
        readline.clearLine(stream, 0);
        readline.cursorTo(stream, 0);
      
        return this;
    }

    async exportToExcel(settings: AppSensorUIConsoleSettings, 
                        reports: ConsoleReport[]) {
        const rowHeight = 18;                    

        const wb = new excel4node.Workbook();

        // Add Worksheets to the workbook
        for (let report of reports) {
            const ws = wb.addWorksheet(report.getReportName());
            let excelData = await report.getExcelData(this.earliest, settings);
            if (excelData.length === 0) {
                excelData = await report.getData(this.earliest, settings);
            }
            //in some cases header is populated dynamicaly of data
            //if report hasn't been touched since this point, it will be empty
            // at first, let load of data 
            const header = report.getHeader(); 
            const colMaxCharacters = report.getColMaxCharacters();
            const excelCellsConfig = report.getExcelCellsConfig();


            let row = 1;
            //header cells
            for (let i = 0; i < header.length; i++) {
                const column = i + 1;

                ws.column(column).setWidth(colMaxCharacters[i] + 2);

                ws.cell(row, column).style(excelCellsConfig.headerCellsStyle[i]);

                ws.cell(row, column).string(header[i]);
            }

            if (excelCellsConfig.headerRowHeight > 0) {
                ws.row(row).setHeight(excelCellsConfig.headerRowHeight * rowHeight);
            }

            //data cells
            for (let i = 0; i < excelData.length; i++) {
                row++;

                const dataRow = excelData[i];
                for (let j = 0; j < dataRow.length; j++) {
                    ws.cell(row, j + 1).string(dataRow[j]);
                }

                if (excelCellsConfig.dataRowsHeight.length > 0) {
                    ws.row(row).setHeight(excelCellsConfig.dataRowsHeight[row - 2] * rowHeight);
                }
            }

            excelCellsConfig.dataCellsToMerge.forEach((el) => {
                //mind the header row + 1
                ws.cell(el.row1 + 1, el.col1, el.row2 + 1, el.col2, true);
            });
            excelCellsConfig.dataCellsStyle.forEach((el) => {
                //mind the header row + 1
                const style = wb.createStyle(el.styleOptions);
                ws.cell(el.row + 1, el.col).style(style);
            });
        }

        const fromDateStr = ConsoleReport.formatTimestamp(new Date(this.earliest));
        const toDateStr = ConsoleReport.formatTimestamp(new Date());


        let fileName = `AppSensorLike_Reports_${fromDateStr}-${toDateStr}.xlsx`;
        fileName = fileName.replace(new RegExp(' ', 'g'), '_').replace(new RegExp(':', 'g'), '-');

        await new Promise((resolve, reject) => {
            wb.write(fileName, (err: NodeJS.ErrnoException | string | null, stats: fs.Stats) => {
                if (err) {
                    console.log(err);    
                }
                resolve(null);
            });
        });
    }
}

async function run() {
    const reportingEngine = new AppSensorReportingWebSocketClient();
    await reportingEngine.connect();
    await new ReportingConsole(reportingEngine).run();
}

await run();

export { AppSensorUIConsoleSettings, USAGE_GUIDE_INFO,
        EXCEL_CELLS_TO_MERGE, EXCEL_CELL_STYLE, EXCEL4NODE_CELL_STYLE, EXCEL_CELLS_CONFIG};