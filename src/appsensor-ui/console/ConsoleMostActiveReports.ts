import { TableUserConfig } from "table";

import { DetectionPoint } from "../../core/core.js";
import { DetectionPointReport } from "../reports/DetectionPointReport.js";
import { UserReport } from "../reports/UserReport.js";
import { AppSensorUIConsoleSettings } from "./appsensor-console-ui.js";
import { ConsoleReport } from "./ConsoleReport.js";

class ConsoleMostActiveUsersReport extends ConsoleReport {

    private userReport: UserReport;
    private earliest?: string;
    private topUsers: string[] = [];

    constructor(userReport: UserReport) {
        super();
        this.userReport = userReport;
        this.header = ["", "User Name (count of events)"];
    }

    override async loadItems(settings: AppSensorUIConsoleSettings): Promise<void> {
        const lastCheckStr = settings.lastCheck!.toISOString();
        if (this.earliest !== lastCheckStr) {
            this.startSpinner();

            this.earliest = lastCheckStr;
            const userEventCount = await this.userReport.topUsers(this.earliest);

            this.adjustColMaxCharacters(this.header);

            this.data = [];

            let index = 0;
            for (let key in userEventCount) {
                const line = `${key}  (${userEventCount[key]} events)`;
                this.topUsers.push(line);

                const indexStr = new Number(index + 1).toString();

                //["", "User Name (count of events)"]
                const row = [indexStr, line];

                this.adjustColMaxCharacters(row);

                this.data.push(row);

                index++;
            }
        
            this.itemCount = this.topUsers.length;

            this.stopSpinner();
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

class ConsoleMostActiveDetectionPointsReport extends ConsoleReport {

    private detectionPointReport: DetectionPointReport;
    private earliest?: string;
    private topDetectionPoints: string[] = [];

    constructor(detectionPointReport: DetectionPointReport) {
        super();
        this.detectionPointReport = detectionPointReport;
        this.header = ["", "Detection Point Label(Category) (count of events)"];
    }

    override async loadItems(settings: AppSensorUIConsoleSettings): Promise<void> {
        const lastCheckStr = settings.lastCheck!.toISOString();
        if (this.earliest !== lastCheckStr) {
            this.startSpinner();

            this.earliest = lastCheckStr;
            const detPointEventCount = await this.detectionPointReport.topDetectionPoints(this.earliest);

            this.adjustColMaxCharacters(this.header);

            this.data = [];

            let index = 0;
            for (let key in detPointEventCount) {
                const detPoint: DetectionPoint = JSON.parse(key);
                Object.setPrototypeOf(detPoint, DetectionPoint.prototype);
                
                const line = `${detPoint.getLabel()}(${detPoint.getCategory()}) (${detPointEventCount[key]} events)`;
                this.topDetectionPoints.push(line);

                const indexStr = new Number(index + 1).toString();

                //["", "Detection Point Label(Category) (count of events)"]
                const row = [indexStr, line];

                this.adjustColMaxCharacters(row);

                this.data.push(row);

                index++;
            }

            this.itemCount = this.topDetectionPoints.length;
    
            this.stopSpinner();
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

export {ConsoleMostActiveUsersReport, ConsoleMostActiveDetectionPointsReport}
