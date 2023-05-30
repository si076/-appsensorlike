import { JSONServerConfigurationReader } from "../../configuration-modes/appsensor-configuration-json/server/JSONServerConfig.js";
import { DetectionPointDescriptions, DetectionPointDescriptionsReader, ReportingEngineExt, ReportingSettings, ReportingSettingsLoader } from "../reporting-engines.js";
import { AppSensorReportingWebSocketClient } from "../appsensor-reporting-websocket/client/appsensor-reporting-websocket-client.js";
import { ServerConfiguration } from "../../core/configuration/server/server_configuration.js";
import { AppSensorEvent, Attack, DetectionPoint, DetectionSystem, Response, User, Utils as coreUtils} from "../../core/core.js";
import { SearchCriteria } from "../../core/criteria/criteria.js";
import { Utils } from "../../utils/Utils.js";

import { table, TableUserConfig } from 'table';
// @ts-ignore
import { input, select } from '@inquirer/prompts';
// import InterruptedPrompt from 'inquirer-interrupted-prompt';
// import DatePrompt from "inquirer-date-prompt/index.js";

import readline from 'readline';

import {Spinner} from 'cli-spinner';

// inquirer.registerPrompt("search-list", SearchBox);
// @ts-ignore
// inquirer.registerPrompt("date", DatePrompt);

// InterruptedPrompt.fromAll(inquirer);

abstract class Report {

    protected topItemIndex: number = 0;
    protected itemCount: number = 0;

    protected events: AppSensorEvent[] = [];
    protected attacks: Attack[] = [];
    protected responses: Response[] = [];

    setItems(config: ServerConfiguration | null, 
             settings: ReportingSettings,
             events: AppSensorEvent[],
             attacks: Attack[],
             responses: Response[]): void {
        this.events = events;
        this.attacks = attacks;
        this.responses = responses;
    }

    abstract display(settings: ReportingSettings): string;

    toItem(settings: ReportingSettings, topItemIndex: number) {
        this.topItemIndex = topItemIndex - 1;

        //mind topItemIndex starts from 0
        if (this.topItemIndex + settings.maxDisplayedItems! >= this.itemCount) {
            this.topItemIndex = this.itemCount - settings.maxDisplayedItems!;
        }
        
        if (this.topItemIndex < 0) {
            this.topItemIndex = 0;
        }
    }

    toPreviousItems(settings: ReportingSettings) {
        this.topItemIndex -= settings.maxDisplayedItems!;

        if (this.topItemIndex < 0) {
            this.topItemIndex = 0;
        }
    }

    toNextItems(settings: ReportingSettings) {
        this.topItemIndex += settings.maxDisplayedItems!;

        //mind topItemIndex starts from 0
        if (this.topItemIndex >= this.itemCount) {
            this.topItemIndex = this.itemCount - settings.maxDisplayedItems!;
        }

        if (this.topItemIndex < 0) {
            this.topItemIndex = 0;
        }
    }

    abstract filterItems(): void;

    getItemsCount() {
        return this.itemCount;
    }

    getTopItemIndex() {
        return this.topItemIndex;
    }
}

class ActivatedDetectionPointsReport extends Report {

    private static SEPARATOR = ':';

    private items: [string, {events: number, 
                             attacks: number, 
                             responses: number}][] = [];
    
    private detectionPointDescriptions: DetectionPointDescriptions = new DetectionPointDescriptions();

    setItems(config: ServerConfiguration | null, 
             settings: ReportingSettings, 
             events: AppSensorEvent[], 
             attacks: Attack[], 
             responses: Response[]): void {
        super.setItems(config, settings, events, attacks, responses);

        this.items = this.getDetectionPointCounters(config, settings);

        this.itemCount = this.items.length;

        this.detectionPointDescriptions = new DetectionPointDescriptionsReader().read();
    }
 

    display(settings: ReportingSettings): string {

        const data: string[][] = [];

        let start = this.topItemIndex;

        let end = start + settings.maxDisplayedItems! - 1;
        if (end > this.items.length - 1) {
            end = this.items.length - 1;
        }

        data.push(["", "Category", "Label", "Events", "Attacks", "Responses", "Description"]);

        for (let i = start; i <= end; i++) {
            const item = this.items[i];
            const splited = item[0].split(ActivatedDetectionPointsReport.SEPARATOR);

            let detectionPointDescr = "";
            const propDesc = Object.getOwnPropertyDescriptor(this.detectionPointDescriptions.IDs, splited[1]);
            if (propDesc) {
                detectionPointDescr = propDesc.value;
            }

            data.push([new Number(i + 1).toString(),
                       splited[0], 
                       splited[1], 
                       new Number(item[1].events).toString(), 
                       new Number(item[1].attacks).toString(), 
                       new Number(item[1].responses).toString(), 
                       detectionPointDescr]);
        }

        return table(data);
    }

    private getDetectionPointCounters(config: ServerConfiguration | null, 
                                      settings: ReportingSettings): [string, {events: number, 
                                                                              attacks: number, 
                                                                              responses: number}][] {
        const detectionPointCount: [string, {events: number, 
                                             attacks: number, 
                                             responses: number}][] = [];
        if (config) {
            const detectionPoints = config.getDetectionPoints();
            if (detectionPoints) {
                for (let i = 0; i < detectionPoints.length; i++) {
                    const detPoint = detectionPoints[i];
                    const category = detPoint.getCategory();
                    const label = detPoint.getLabel();

                    const key = category + ActivatedDetectionPointsReport.SEPARATOR + label;

                    const counters = {events: 0, attacks: 0, responses: 0};

                    const earliest = settings.lastCheck!.toISOString();
                    
                    const criteria = new SearchCriteria();
                    criteria.setEarliest(new Date(earliest));
                    criteria.setDetectionPoint(new DetectionPoint(category, label));

                    this.events.forEach(el => {
                        if (coreUtils.isMatchingEvent(criteria, el)) {
                            counters.events++; 
                        }
                    });

                    this.attacks.forEach(el => {
                        if (coreUtils.isMatchingAttack(criteria, el)) {
                            counters.attacks++;  
                        }
                    });

                    this.responses.forEach(el => {
                        if (coreUtils.isMatchingResponse(criteria, el)) {
                            counters.responses++;        
                        }
                    });

                    detectionPointCount.push([key, counters]);
                };
            }

        }        

        return detectionPointCount;
    }

    filterItems(): void {
        throw new Error("Method not implemented.");
    }
}

class ReportingConsole {

    private static REPORTS: string[] = ['Activated Detection Points',
                                        'Activated Ruls',
                                        'Report by user',
                                        'Report by detection system'];


    private reportingEngine: ReportingEngineExt;

    private repotingSettingsLoader = new ReportingSettingsLoader();

    private events: AppSensorEvent[] = [];
    private attacks: Attack[] = [];
    private responses: Response[] = [];
    private users: User[] = [];
    private detectionSystems: DetectionSystem[] = [];

    constructor(reportingEngine: ReportingEngineExt) {
        this.reportingEngine = reportingEngine;
    }

    private async loadData(this: ReportingConsole, settings: ReportingSettings, cb: (error?: any) => void) {

        const me = this;
        let spinner = new Spinner("Loading Events...");
        spinner.setSpinnerString(18);
        spinner.start();
        await Utils.sleep(2000);
        this.reportingEngine.findEvents(settings.lastCheck!.toISOString())
        .then(async (events) => {
            // console.log("Events loaded");

            me.events = events;
            spinner.stop();

            spinner = new Spinner("Loading Attacks...");
            spinner.setSpinnerString(19);
            spinner.start();
            await Utils.sleep(2000);
            this.reportingEngine.findAttacks(settings.lastCheck!.toISOString())
            .then(async (attacks) => {
                // console.log("Attacks loaded");

                me.attacks = attacks;

                spinner.stop();
    
                spinner = new Spinner("Loading Responses...");
                spinner.setSpinnerString(20);
                spinner.start();
                await Utils.sleep(2000);
                this.reportingEngine.findResponses(settings.lastCheck!.toISOString())
                .then((responses) => {
                    // console.log("Responses loaded");

                    me.responses = responses;

                    spinner.stop();
        
                    cb();
                })
                .catch((error) => {
                    cb(error);
                });
            })
            .catch((error) => {
                cb(error);
            });
        })
        .catch((error) => {
            cb(error);
        });
    }

    public async reportLoop() {
        const settings = this.repotingSettingsLoader.loadSettings();

        const configAsString = await this.reportingEngine.getServerConfigurationAsJson();

        const config = new JSONServerConfigurationReader().readFromString(configAsString);

        const reports: Report[] = [];
        reports.push(new ActivatedDetectionPointsReport());

        let selectedReport = 0;
        let currentReport = reports[selectedReport];

        this.loadData(settings, async (error?: any) => {
            reports.forEach(el => {
                el.setItems(config, settings, this.events, this.attacks, this.responses);
            });

            
            let answer = null;
            while (answer !== 'exit') {
                console.clear();
                
                console.log(this.prepareMainTable(settings, selectedReport, currentReport));
    
                try {
                    await this.prepareActionsMenu(settings, currentReport)
                    .then(async (answer) => {
                        switch (answer) {
                            case 'chooseReport': {
                                await this.prepareReportsMenu()
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
        });
           
    }

    prepareActionsMenu(settings: ReportingSettings, report: Report): Promise<string> {
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
                        value: 'saveReport',
                        name: 'Save displayed report'
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

    prepareReportsMenu(): Promise<string> {
        return select<string>({
            message: 'Report:',
            choices: [{value: 1, name: `1. ${ReportingConsole.REPORTS[0]}`},
                      {value: 2, name: `2. ${ReportingConsole.REPORTS[1]}`},
                      {value: 3, name: `3. ${ReportingConsole.REPORTS[2]}`},
                      {value: 4, name: `4. ${ReportingConsole.REPORTS[3]}`}]
        });
    }

    prepareItemsNavigation(report: Report): Promise<string> {
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

    prepareEarliestDate(settings: ReportingSettings): Promise<string> {
        return input({
            message: 'Report earliest date :'
            // interruptedKeyName: 'shift+f'
        });
    }

    prepareMainTable(settings: ReportingSettings, selectedMenuItem: number = 0, report: Report): string {
        const data: string[][] = [];

        
        data.push([ReportingConsole.REPORTS[selectedMenuItem]]);
        data.push(["Report since: " + settings.lastCheck + "\n" +
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

        data.push(["Showing items: " + itemsCountStr + " Maximum displayed items at once: " + maxDisplayedItemsAtOnce]);

        // const config: TableUserConfig = {
            // spanningCells: [
            //     { col: 0, row: 0, rowSpan: 2 },
            // ]
        // }


        return table(data);//, config);
    }

    clearLine (stream: NodeJS.WritableStream) {
        readline.clearLine(stream, 0);
        readline.cursorTo(stream, 0);
      
        return this;
    }


}

function run() {
    new ReportingConsole(new AppSensorReportingWebSocketClient()).reportLoop();
}

run();