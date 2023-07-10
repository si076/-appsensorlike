import e from 'express';

import { ConfigurationReport } from "@appsensorlike/appsensorlike_ui/appsensor-ui/reports/ConfigurationReport.js";

class ConfigurationController {

    private report: ConfigurationReport;

    constructor(report: ConfigurationReport) {
        this.report = report;
    }

    getServerConfiguration(req: e.Request, res: e.Response, next: e.NextFunction) {
        
        this.report.getServerConfiguration()
        .then(result => {
            res.status(200).send(result);
        })
        .catch(error => {
            res.status(500).send(error.toString());
        });

    }

}

export {ConfigurationController};