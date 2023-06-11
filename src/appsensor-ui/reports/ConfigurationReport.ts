import { ReportingEngineExt } from "../../reporting-engines/reporting-engines.js";
import { BaseReport } from "./BaseReport.js";

class ConfigurationReport extends BaseReport {

    constructor(reportingEngine: ReportingEngineExt) {
        super(reportingEngine);
    }

	// @PreAuthorize("hasAnyRole('VIEW_CONFIGURATION', 'EDIT_CONFIGURATION')")
	// @RequestMapping(value="/api/configuration/server-config", method = RequestMethod.GET)
	// @ResponseBody
	// public String getServerConfiguration() {
    public async getServerConfiguration(): Promise<string> {
            return this.reportingEngine.getServerConfigurationAsJson();
	}

}

export {ConfigurationReport}