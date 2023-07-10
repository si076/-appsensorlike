import e from 'express';

import { TrendsDashboardReport } from "@appsensorlike/appsensorlike_ui/appsensor-ui/reports/TrendsDashboardReport.js";

class TrendsDashboardController {

    private report: TrendsDashboardReport;

    constructor(report: TrendsDashboardReport) {
        this.report = report;        
    }

    byTimeFrame(req: e.Request, res: e.Response, next: e.NextFunction) {
        this.report.countEvents()
        .then(result => {
            res.status(200).send(result);
        })
        .catch(error => {
            res.status(500).send(error.toString());
        });
    }
}

export {TrendsDashboardController}