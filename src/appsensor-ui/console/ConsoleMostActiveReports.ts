import { TableUserConfig } from "table";

import { AppSensorEvent, Attack, DetectionPoint, Response, Utils } from "@appsensorlike/appsensorlike/core/core.js";
import { ReportingEngineExt } from "@appsensorlike/appsensorlike/reporting-engines/reporting-engines.js";

import { DetectionPointReport } from "@appsensorlike/appsensorlike_ui/appsensor-ui/reports/DetectionPointReport.js";
import { NAME_EVENT_COUNT } from "@appsensorlike/appsensorlike_ui/appsensor-ui/reports/Reports.js";
import { UserReport } from "@appsensorlike/appsensorlike_ui/appsensor-ui/reports/UserReport.js";

import { AppSensorUIConsoleSettings } from "./appsensor-ui-console.js";
import { ConsoleReport } from "./ConsoleReport.js";

class ConsoleMostActiveUsersReport extends ConsoleReport {
    public static ID = 'MostActiveUsers';

    private userReport: UserReport;
    private userEventCount: NAME_EVENT_COUNT = {};

    constructor(reportingEngine: ReportingEngineExt) {
        super(reportingEngine);
        this.userReport = new UserReport(reportingEngine);
        this.setHeader(["", "User Name (count of events)"]);
    }

    override async loadItems(earliest: string,
                             settings: AppSensorUIConsoleSettings): Promise<void> {
        if (this.earliest !== earliest || this.hasToReload || this.newItemReceived) {
            
            this.initData();
            
            this.startSpinner();

            //consider that all of the flags could be set till this report was not touched
            //if only newItemReceived is set, do not reload 
            if (this.earliest !== earliest || this.hasToReload) {
                this.earliest = earliest;
                this.userEventCount = await this.userReport.topUsers(this.earliest);
            }

            this.hasToReload = false;
            this.newItemReceived = false;

            let index = 0;
            for (let key in this.userEventCount) {
                const line = `${key}  (${this.userEventCount[key]} events)`;

                const indexStr = new Number(index + 1).toString();

                //["", "User Name (count of events)"]
                const row = [indexStr, line];

                this.addDataRow(row);

                index++;
            }

            this.stopSpinner();
        }
    }

    onAdd(event: AppSensorEvent | Attack | Response): void {
        super.onAdd(event);

        if (event instanceof AppSensorEvent) {
            const userName = Utils.getUserName(event.getUser());
            if (!(userName in this.userEventCount)) {
                this.userEventCount[userName] = 0;
            } 
    
            this.userEventCount[userName]++;
        }
    }

    protected getDisplayTableConfig(columnCount: number, 
                                    displayedDataRowCount: number,
                                    specificWidths?: { [index: number]: number; }): TableUserConfig {
        return super.getDisplayTableConfig(columnCount, displayedDataRowCount, {0: 4});
    }

    override filterItems(): void {
        throw new Error("Method not implemented.");
    }

    override getReportName(): string {
        return 'Most Active Users';
    }

}

class ConsoleMostActiveDetPointsReport extends ConsoleReport {
    public static ID = 'MostActiveDetPoints';

    private detectionPointReport: DetectionPointReport;
    private detPointEventCount: NAME_EVENT_COUNT = {};

    constructor(reportingEngine: ReportingEngineExt) {
        super(reportingEngine);
        this.detectionPointReport = new DetectionPointReport(reportingEngine);
        this.setHeader(["", "Detection Point Label(Category) (count of events)"]);
    }

    override async loadItems(earliest: string,
                             settings: AppSensorUIConsoleSettings): Promise<void> {
        if (this.earliest !== earliest || this.hasToReload || this.newItemReceived) {

            this.initData();

            this.startSpinner();

            //consider that all of the flags could be set till this report was not touched
            //if only newItemReceived is set, do not reload 
            if (this.earliest !== earliest || this.hasToReload) {
                this.earliest = earliest;
                this.detPointEventCount = await this.detectionPointReport.topDetectionPoints(this.earliest);
            }
            
            this.hasToReload = false;
            this.newItemReceived = false;

            let index = 0;
            for (let key in this.detPointEventCount) {
                const detPoint: DetectionPoint = JSON.parse(key);
                Object.setPrototypeOf(detPoint, DetectionPoint.prototype);
                
                const line = `${detPoint.getLabel()}(${detPoint.getCategory()}) (${this.detPointEventCount[key]} events)`;

                const indexStr = new Number(index + 1).toString();

                //["", "Detection Point Label(Category) (count of events)"]
                const row = [indexStr, line];

                this.addDataRow(row);

                index++;
            }
    
            this.stopSpinner();
        }
    }

    onAdd(event: AppSensorEvent | Attack | Response): void {
        super.onAdd(event);

        if (event instanceof AppSensorEvent) {
            const key = JSON.stringify(event.getDetectionPoint());
            if (!(key in this.detPointEventCount)) {
                this.detPointEventCount[key] = 0;
            } 
    
            this.detPointEventCount[key]++;
        }
    }

    protected getDisplayTableConfig(columnCount: number,
                                    displayedDataRowCount: number,
                                    specificWidths?: { [index: number]: number; }): TableUserConfig {
        return super.getDisplayTableConfig(columnCount, displayedDataRowCount, {0: 4});
    }

    override filterItems(): void {
        throw new Error("Method not implemented.");
    }

    override getReportName(): string {
        return 'Most Active Detection Points';
    }

}

export {ConsoleMostActiveUsersReport, ConsoleMostActiveDetPointsReport}
