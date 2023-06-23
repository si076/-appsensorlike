import { AppSensorEvent, Attack, Response, Utils as coreUtils } from "../../core/core.js";
import { Rule } from "../../core/rule/rule.js";
import { BaseReport } from "../reports/BaseReport.js";
import { DetectionPointDescriptions, AppSensorUIConsoleSettings } from "./appsensor-console-ui.js";
import { ConsoleReport } from "./ConsoleReport.js";

import { TableUserConfig, ColumnUserConfig } from 'table';

class ConsoleRecentReport extends ConsoleReport {

    private static SEPARATOR = ':';

    private items: (AppSensorEvent | Attack | Response)[] = [];

    
    private detectionPointDescriptions: DetectionPointDescriptions;

    private baseReport: BaseReport;

    private earliest?: string;

    constructor(baseReport: BaseReport,
                detectionPointDescriptions: DetectionPointDescriptions) {
        super();
        this.baseReport = baseReport;
        this.detectionPointDescriptions = detectionPointDescriptions;

        this.header = ["", "Type", "Category", "Id", "From", "To", "Timestamp", "Description"];
    }

    override async loadItems(settings: AppSensorUIConsoleSettings): Promise<void> {
        const lastCheckStr = settings.lastCheck!.toISOString();
        if (this.earliest !== lastCheckStr) {
            this.startSpinner();

            this.earliest = lastCheckStr;
            this.items = await this.baseReport.getRecent(this.earliest);

            this.itemCount = this.items.length;

            this.adjustColMaxCharacters(this.header);

            this.data = [];

            this.items.forEach((item, index) => {

                const detSystem = item.getDetectionSystem();
                const detSystemId = detSystem ? detSystem.getDetectionSystemId(): "unknown detection system";
    
                const userName = coreUtils.getUserName(item.getUser());
    
                const detPoint = item.getDetectionPoint();
                let rule: Rule | null = null;
    
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
                const row = [indexStr,
                             type, 
                             category,
                             id, 
                             from,
                             to, 
                             timestampStr,
                             detectionPointDescr];
                
                this.adjustColMaxCharacters(row);
                
                this.data.push(row);
    
            });

            this.stopSpinner();
        }
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

export {ConsoleRecentReport};