import { JSONServerConfigurationReader } from "../../configuration-modes/appsensor-configuration-json/server/JSONServerConfig.js";
import { ReportingEngineExt, } from "../../reporting-engines/reporting-engines.js";
import { AppSensorReportingWebSocketClient } from "../../reporting-engines/appsensor-reporting-websocket/client/appsensor-reporting-websocket-client.js";
import { AppSensorEvent, Attack, DetectionSystem, Response, User} from "../../core/core.js";
import { JSONConfigReadValidate } from "../../utils/Utils.js";

import { table } from 'table';
// @ts-ignore
import { input, select } from '@inquirer/prompts';
// import InterruptedPrompt from 'inquirer-interrupted-prompt';
// import DatePrompt from "inquirer-date-prompt/index.js";

import readline from 'readline';

// @ts-ignore
import excel4node from 'excel4node/distribution/index.js';

import { BaseReport } from "../reports/BaseReport.js";

import fs from 'fs';
import { UserReport } from "../reports/UserReport.js";
import { DetectionPointReport } from "../reports/DetectionPointReport.js";
import { ConsoleRecentReport } from "./ConsoleRecentReport.js";
import { ConsoleMostActiveDetectionPointsReport, ConsoleMostActiveUsersReport } from "./ConsoleMostActiveReports.js";
import { ConsoleDetPointCategorizationReport } from "./ConsoleDetPointCategorizationReport.js";
import { ConsoleReport } from "./ConsoleReport.js";
import { TrendsDashboardReport } from "../reports/TrendsDashboardReport.js";
import { ConsoleTrendsReport } from "./ConsoleTrendsReport.js";
// inquirer.registerPrompt("search-list", SearchBox);
// @ts-ignore
// inquirer.registerPrompt("date", DatePrompt);

// InterruptedPrompt.fromAll(inquirer);

class AppSensorUIConsoleSettings implements IValidateInitialize {
    lastCheck?: Date;
    viewRefreshTimeMs?: number;
    maxDisplayedItems?: number;

    checkValidInitialize(): void {
        if (!this.lastCheck) {
            this.lastCheck = new Date(0);
        }

        if (!this.viewRefreshTimeMs) {
            this.viewRefreshTimeMs = 10000;
        }

        if (!this.maxDisplayedItems) {
            this.maxDisplayedItems = 10;
        }
    }
}

class AppSensorUIConsoleSettingsLoader extends JSONConfigReadValidate {
    static DEFAULT_FILE: string = './appsensor-ui/console/appsensor-console-ui-settings.json'; 

    protected settingsFile?: string

    constructor(settingsFile?: string) {
        super(AppSensorUIConsoleSettingsLoader.DEFAULT_FILE, null, AppSensorUIConsoleSettings.prototype);

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

type DET_POINT_CATEGORIZATION_DESCR = { description: string, one_user: string[], all_users: string[] };

class DetectionPointDescriptions {
    IDs: {
        [id: string]:string
    } = {};
    Categorization: {
        Suspicious: DET_POINT_CATEGORIZATION_DESCR,
        Attack: DET_POINT_CATEGORIZATION_DESCR,
        Discrete: DET_POINT_CATEGORIZATION_DESCR,
        Aggregating: DET_POINT_CATEGORIZATION_DESCR,
        Modifying: DET_POINT_CATEGORIZATION_DESCR,
    } = {
        Suspicious: {description: '', one_user:[], all_users: []},
        Attack: {description: '', one_user:[], all_users: []},
        Discrete: {description: '', one_user:[], all_users: []},
        Aggregating: {description: '', one_user:[], all_users: []},
        Modifying: {description: '', one_user:[], all_users: []}
    };
}

class DetectionPointDescriptionsReader extends JSONConfigReadValidate {
    constructor() {
        super('appsensor-detection-point-descriptions.json', null, DetectionPointDescriptions.prototype);
    }
}

type RESPONSE_CATEGORIZATION_EXECUTION = { always: string[], sometimes: string[] };

class ResponseDescriptions {
    IDs: {
        [id: string]:string
    } = {};
    Categorization: {
        Purpose: {
            Logging: RESPONSE_CATEGORIZATION_EXECUTION,
            Notifying: RESPONSE_CATEGORIZATION_EXECUTION,
            Disrupting: RESPONSE_CATEGORIZATION_EXECUTION,
            Blocking: RESPONSE_CATEGORIZATION_EXECUTION,
        },
        Target_User: {
            One: RESPONSE_CATEGORIZATION_EXECUTION,
            All: RESPONSE_CATEGORIZATION_EXECUTION
        },
        Response_Duration: {
            Instantaneous: RESPONSE_CATEGORIZATION_EXECUTION,
            Period: RESPONSE_CATEGORIZATION_EXECUTION,
            Permanent: RESPONSE_CATEGORIZATION_EXECUTION
        }
    } = {
        Purpose: {
            Logging: { always: [], sometimes: [] },
            Notifying: { always: [], sometimes: [] },
            Disrupting: { always: [], sometimes: [] },
            Blocking: { always: [], sometimes: [] }
        },
        Target_User: {
            One: { always: [], sometimes: [] },
            All: { always: [], sometimes: [] },
        },
        Response_Duration: {
            Instantaneous: { always: [], sometimes: [] },
            Period: { always: [], sometimes: [] },
            Permanent: { always: [], sometimes: [] },
        }
    };
}

class ResponseDescriptionsReader extends JSONConfigReadValidate {
    constructor() {
        super('appsensor-responses-descriptions.json', null, ResponseDescriptions.prototype);
    }
}

type EXCEL4NODE_CELL_STYLE =     {
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
type EXCEL_CELL_STYLE = {row: number, col: number, styleOprions: EXCEL4NODE_CELL_STYLE}
type EXCEL_CELLS_CONFIG = {cellsToMerge: EXCEL_CELLS_TO_MERGE[],
                           cellStyle: EXCEL_CELL_STYLE[],
                           rowHeightInLinse: number[]};

class ReportingConsole {

    private reportingEngine: ReportingEngineExt;

    private repotingSettingsLoader = new AppSensorUIConsoleSettingsLoader();

    private events: AppSensorEvent[] = [];
    private attacks: Attack[] = [];
    private responses: Response[] = [];
    private users: User[] = [];
    private detectionSystems: DetectionSystem[] = [];

    private detectionPointDescriptions: DetectionPointDescriptions;

    constructor(reportingEngine: ReportingEngineExt) {
        this.reportingEngine = reportingEngine;

        this.detectionPointDescriptions = new DetectionPointDescriptionsReader().read();
    }

    public async reportLoop() {
        const settings = this.repotingSettingsLoader.loadSettings();

        const configAsString = await this.reportingEngine.getServerConfigurationAsJson();

        const config = new JSONServerConfigurationReader().readFromString(configAsString);

        const reports: ConsoleReport[] = [];
        reports.push(new ConsoleRecentReport(new BaseReport(this.reportingEngine), this.detectionPointDescriptions));
        reports.push(new ConsoleMostActiveDetectionPointsReport(new DetectionPointReport(this.reportingEngine)));
        reports.push(new ConsoleMostActiveUsersReport(new UserReport(this.reportingEngine)));
        reports.push(new ConsoleTrendsReport(new TrendsDashboardReport(this.reportingEngine)));
        reports.push(new ConsoleDetPointCategorizationReport(this.detectionPointDescriptions));

        let selectedReport = 0;

        let answer = null;
        while (answer !== 'exit') {
            console.clear();
            
            const currentReport = reports[selectedReport];
            await currentReport.loadItems(settings);

            console.clear();

            console.log(this.prepareMainTable(settings, selectedReport, currentReport));

            try {
                await this.prepareActionsMenu(settings, currentReport)
                .then(async (answer) => {
                    switch (answer) {
                        case 'chooseReport': {
                            await this.prepareReportsMenu(reports)
                            .then((answer) => {
                                if (answer) {
                                    selectedReport = Number.parseInt(answer);
                                    selectedReport -= 1;
                                }
                            })
                            .catch();
                            
                            break
                        }
                        case 'earliestDate': {
                            await this.prepareEarliestDate(settings)
                            .then((answer) => {

                            })
                            .catch();
                            break
                        }
                        case 'itemsNavigation': {
                            await this.prepareItemsNavigation(currentReport)
                            .then((answer) => {
                                switch (answer) {
                                    case 'P': 
                                    case 'p': {
                                        currentReport.toPreviousItems(settings);
                                        break;
                                    }
                                    case 'N': 
                                    case 'n': {
                                        currentReport.toNextItems(settings);
                                        break;
                                    }
                                    default: {
                                        const itemIndex = Number.parseInt(answer);
                                        currentReport.toItem(settings, itemIndex);
                                        break;
                                    }
                                }
                            })
                            .catch();
    
    
                            break
                        }
                        case 'saveReports': {
                            await this.exportToExcel(settings, reports);

                            break;
                        }
                        case 'exit': {
                            process.exit(0);

                            break;
                        }
                    }
                })
                .catch();
    
            } catch (e) {
    
            }

            
        }     
           
    }

    prepareActionsMenu(settings: AppSensorUIConsoleSettings, report: ConsoleReport): Promise<string> {
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
                        value: 'saveReports',
                        name: 'Save reports'
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
                        value: 'exit',
                        name: 'Exit',
                    }
                ]
            }
        );
    }

    prepareReportsMenu(reports: ConsoleReport[]): Promise<string> {
        const choices: {value: number, name: string}[] = [];
        reports.forEach((el, index) => {
            const number = index + 1;
            choices.push({value: number, name: `${number}. ${el.getReportName()}`});
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
            message: `Go to: previous items by typing 'P' or 'p'; next items by typing 'N' or 'n'; an arbitrary item by entering a number [${itemsFromTo}]:`,
            // interruptedKeyName: 'shift+f',
            validate: (userInput: any) => {
                if (userInput !== 'p' &&
                    userInput !== 'P' &&
                    userInput !== 'n' &&
                    userInput !== 'N' &&
                    Number.isNaN(userInput) &&
                    (userInput < 1 || userInput > reportItemsCount)) {
                    return "You have to type: 'P' or 'p'; 'N' or 'n'; number between 1 - " + reportItemsCount;
                }
                return true;
            }
        });
    }

    prepareEarliestDate(settings: AppSensorUIConsoleSettings): Promise<string> {
        return input({
            message: 'Report earliest date :'
            // interruptedKeyName: 'shift+f'
        });
    }

    prepareMainTable(settings: AppSensorUIConsoleSettings, selectedMenuItem: number = 0, report: ConsoleReport): string {
        const data: string[][] = [];

        
        data.push([report.getReportName()]);
        data.push(["Report since: " + ConsoleReport.formatTimestamp(settings.lastCheck) + "\n" +
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

        data.push(["Showing items: " + itemsCountStr + "; Maximum displayed items at once: " + maxDisplayedItemsAtOnce]);

        return table(data);//, config);
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

        const headerStyle = wb.createStyle({
            font: {
              color: '#9d9d9d',
              bold: true,
              size: 12,
            },
            fill: {
                type: 'pattern',
                patternType: 'solid',
                bgColor: '#2E2E2E'
            }
        });
        // Add Worksheets to the workbook
        for (let report of reports) {
            const ws = wb.addWorksheet(report.getReportName());
            const header = report.getHeader();
            const data = await report.getData(settings);
            const colMaxCharacters = report.getColMaxCharacters();
            const excelCellsConfig = report.getExcelCellsConfig();

            let row = 1;
            for (let i = 0; i < header.length; i++) {
                const column = i + 1;

                ws.column(column).setWidth(colMaxCharacters[i] + 2);

                ws.cell(row, column).string(header[i]);
            }

            ws.cell(row, 1, row, header.length).style(headerStyle);

            for (let i = 0; i < data.length; i++) {
                row++;

                const dataRow = data[i];
                for (let j = 0; j < dataRow.length; j++) {
                    ws.cell(row, j + 1).string(dataRow[j]);
                }

                if (excelCellsConfig.rowHeightInLinse.length > 0) {
                    ws.row(row).setHeight(excelCellsConfig.rowHeightInLinse[row - 2] * rowHeight);
                }
            }

            excelCellsConfig.cellsToMerge.forEach((el) => {
                ws.cell(el.row1, el.col1, el.row2, el.col2, true);
            });
            excelCellsConfig.cellStyle.forEach((el) => {
                const style = wb.createStyle(el.styleOprions);
                ws.cell(el.row, el.col).style(style);
            });
        }

        const fromDateStr = ConsoleReport.formatTimestamp(settings.lastCheck!, false, false);
        const toDateStr = ConsoleReport.formatTimestamp(new Date(), false, false);

        let fileName = `AppSensor_Reports_${fromDateStr}-${toDateStr}.xlsx`;
        fileName = fileName.replace(new RegExp(' ', 'g'), '_').replace(new RegExp(':', 'g'), '-');

        wb.write(fileName);
    }
}

function run() {
    new ReportingConsole(new AppSensorReportingWebSocketClient()).reportLoop();
}

run();

export {ConsoleReport, DET_POINT_CATEGORIZATION_DESCR, DetectionPointDescriptions, DetectionPointDescriptionsReader, 
        RESPONSE_CATEGORIZATION_EXECUTION, AppSensorUIConsoleSettings, 
        EXCEL_CELLS_TO_MERGE, EXCEL_CELL_STYLE, EXCEL4NODE_CELL_STYLE, EXCEL_CELLS_CONFIG};