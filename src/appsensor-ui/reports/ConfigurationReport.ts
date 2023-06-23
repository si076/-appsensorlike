import { ReportingEngineExt } from "../../reporting-engines/reporting-engines.js";
import { BaseReport } from "./BaseReport.js";

class ConfigurationReport extends BaseReport {

    constructor(reportingEngine: ReportingEngineExt) {
        super(reportingEngine);
    }

    public async getServerConfiguration(): Promise<string> {
            return this.reportingEngine.getServerConfigurationAsJson();
	}

}

export {ConfigurationReport}