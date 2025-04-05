import { ReportingEngineExt } from "@appsensorlike/appsensorlike/reporting-engines/reporting-engines.js";
import { AppSensorEvent, Attack, Response, Utils as coreUtils } from "@appsensorlike/appsensorlike/core/core.js";
import { Rule } from "@appsensorlike/appsensorlike/core/rule/rule.js";

import { BaseReport } from "@appsensorlike/appsensorlike_ui/appsensor-ui/reports/BaseReport.js";

import { AppSensorUIConsoleSettings, EXCEL4NODE_CELL_STYLE } from "./appsensor-ui-console.js";
import { ConsoleReport } from "./ConsoleReport.js";
import { DetectionPointDescriptions } from "./DetectionPointDescriptions.js";

import { TableUserConfig, ColumnUserConfig } from 'table';
import chalk from 'chalk';


class ConsoleAllActivitiesReport extends ConsoleReport {

    public static ID = 'AllActivities';

    private items: (AppSensorEvent | Attack | Response)[] = [];

    
    private detectionPointDescriptions: DetectionPointDescriptions;

    private baseReport: BaseReport;


    constructor(reportingEngine: ReportingEngineExt,
                detectionPointDescriptions: DetectionPointDescriptions) {
        super(reportingEngine);
        this.baseReport = new BaseReport(reportingEngine);
        this.detectionPointDescriptions = detectionPointDescriptions;

        this.setHeader(["", "Type", "Category", "Id", "From", "To", "Timestamp", "Description"]);
    }

    override async loadItems(earliest: string,
                             settings: AppSensorUIConsoleSettings): Promise<void> {
        if (this.earliest !== earliest || this.hasToReload || this.newItemReceived) {
            this.newObjectSinceLastReload = null;

            let timestamp: Date | undefined = undefined;
            if (this.hasToReload) {
                this.newObjectSinceLastReload = {events: 0, attacks: 0, responses: 0};

                if (this.items.length > 0) {
                    timestamp = this.items[0].getTimestamp();
                }
            }

            
            this.initData();

            this.startSpinner();

            //consider that all of the flags could be set till this report was not touched
            //if only newItemReceived is set, do not reload 
            if (this.earliest !== earliest || this.hasToReload) {
                this.earliest = earliest;
                //pull the data from the server
                this.items = await this.baseReport.getRecent(this.earliest);
            }
            
            this.hasToReload = false;
            this.newItemReceived = false;

            const eventStyle: EXCEL4NODE_CELL_STYLE = {fill: {type: "pattern", patternType: "solid", fgColor: "#FFFF00"}};
            const attackStyle: EXCEL4NODE_CELL_STYLE = {fill: {type: "pattern", patternType: "solid", fgColor: "#FF0000"}};
            const responseStyle: EXCEL4NODE_CELL_STYLE = {fill: {type: "pattern", patternType: "solid", fgColor: "#008000"}};
            

            //go thru all items to prepare data and excelData
            //this has to be done even when one item is received 
            //in order numbering and correct rows to be set in excelCellsConfig
            //
            this.items.forEach((item, index) => {
                let newSinceLastReload = false;

                const itemTimestamp = item.getTimestamp();
                if (timestamp && itemTimestamp && 
                    timestamp.getTime() < itemTimestamp.getTime() &&
                    this.newObjectSinceLastReload) {

                    newSinceLastReload = true;

                    if (item instanceof AppSensorEvent) {
                        this.newObjectSinceLastReload.events++;
                    } else if (item instanceof Attack) {
                        this.newObjectSinceLastReload.attacks++;
                    } else {
                        this.newObjectSinceLastReload.responses++;
                    }
                }

                const detSystem = item.getDetectionSystem();
                const detSystemId = detSystem ? detSystem.getDetectionSystemId(): "unknown detection system";
    
                const userName = coreUtils.getUserName(item.getUser());
    
                const detPoint = item.getDetectionPoint();
                let rule: Rule | null | undefined = null;
    
                let type = "Event";
                let from = userName;
                let to = detSystemId;
    
                if (item instanceof Attack) {
                    type = "Attack";
    
                    rule = item.getRule();
                } else if (item instanceof Response) {
                    type = "Response";
    
                    rule = item.getRule();
    
                    from = to;
                    to = userName;
                } 
    
                let category = "";
                let id = "";
                let detectionPointDescr = "";
                //item was activated by detection point OR rule 
                if (detPoint) {
                    category = detPoint.getCategory();
                    const label = detPoint.getLabel();
                    id = label || "";
    
                    if (label) {
                        const propDesc = Object.getOwnPropertyDescriptor(this.detectionPointDescriptions.IDs, label);
                        if (propDesc) {
                            detectionPointDescr = propDesc.value;
                        }
                    }
                } else if (rule){
                    category = rule.getName();
                    id = rule.getGuid();
                }
    
                const timestampStr = ConsoleReport.formatTimestamp(item.getTimestamp());
                
                const indexStr = new Number(index + 1).toString();

                //["", "Type", "Category", "Id", "From", "To", "Timestamp", "Description"]
                let row = [indexStr,
                             type, 
                             category,
                             id, 
                             from,
                             to, 
                             timestampStr,
                             detectionPointDescr];
                
                
                this.addExcelDataRow(row);

                //assign new array otherwise following mutations of the elements will reflect to excel data as well
                row = [indexStr,
                       type, 
                       category,
                       id, 
                       from,
                       to, 
                       timestampStr,
                       detectionPointDescr];

                if (item instanceof AppSensorEvent) {
                    this.excelCellsConfig.dataCellsStyle.push({row: index + 1, 
                                                               col: 2, 
                                                               styleOptions: eventStyle});

                    type = chalk.yellow("Event");
                } else if (item instanceof Attack) {
                    this.excelCellsConfig.dataCellsStyle.push({row: index + 1, 
                                                               col: 2, 
                                                               styleOptions: attackStyle});

                    type = chalk.red.bold("Attack");
                } else {
                    this.excelCellsConfig.dataCellsStyle.push({row: index + 1, 
                                                               col: 2, 
                                                               styleOptions: responseStyle});

                    type = chalk.green.bold("Response");
                }

                row[1] = type; //chalked
                
                if (newSinceLastReload) {
                    //change the background of the new row
                    for (let r = 0; r < row.length; r++) {
                        if (r !== 1) {
                            chalk.black.bgWhite(row[r]);
                        } else {
                            chalk.bgWhite(row[r]);
                        }
                    }
                }

                this.addDataRow(row);
    
            });
            

            this.stopSpinner();
        }
    }

    onAdd(event: AppSensorEvent | Attack | Response): void {
        super.onAdd(event);
        //add the item at the beginning since the items come from server in descending order by timestamp
        this.items.splice(0 , 0, event);
    }

    protected override getDisplayTableConfig(columnCount: number,
                                             displayedDataRowCount: number,
                                             specificWidths?: {[index: number]: number}): TableUserConfig {

        const columns: {[index: number]:ColumnUserConfig} = {7: {width:30, wrapWord: true}};

        return {columns: columns};
    }

    override filterItems(): void {
        throw new Error("Method not implemented.");
    }

    override getReportName(): string {
        return 'All activities';
    }
}

export {ConsoleAllActivitiesReport};