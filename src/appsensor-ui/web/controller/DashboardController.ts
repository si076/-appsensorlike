import e from 'express';

import { ReportingEngineExt } from "../../../reporting-engines/reporting-engines.js";
import { DashboardReport } from "../../reports/DashboardReport.js";
import { UserReport } from "../../reports/UserReport.js";

class DashboardController {

    private report: DashboardReport;

    constructor(reportingEngine: ReportingEngineExt) {
        this.report = new DashboardReport(reportingEngine, new UserReport(reportingEngine));
    }

    allContent(req: e.Request, res: e.Response, next: e.NextFunction) {
        const earliest = req.query.earliest as string;
        const limit    = Number.parseInt(req.query.limit as string);
        const slices   = Number.parseInt(req.query.slices as string);

        this.report.allContent(earliest, slices, limit)
        .then(result => {
            const obj: {[key: string]: Object} = {};

            const keys = result.keys();
            for (const key of keys) {
                obj[key] = result.get(key)!;
            }

            res.status(200).send(obj);
        })
        .catch(error => {
            res.status(500).send(error.toString());
        });
    }

    activeResponses(req: e.Request, res: e.Response, next: e.NextFunction) {
        const earliest = req.query.earliest as string;
        const limit    = Number.parseInt(req.query.limit as string);

        this.report.activeResponses(earliest, limit)
        .then(result => {
            res.status(200).send(result);
        })
        .catch(error => {
            res.status(500).send(error.toString());
        });
     }

    byTimeFrame(req: e.Request, res: e.Response, next: e.NextFunction) {
        this.report.byTimeFrame()
        .then(result => {
            res.status(200).send(result);
        })
        .catch(error => {
            res.status(500).send(error.toString());
        });
    }

    byCategory(req: e.Request, res: e.Response, next: e.NextFunction) {
        const earliest = req.query.earliest as string;

        this.report.byCategory(earliest)
        .then(result => {
            res.status(200).send(result);
        })
        .catch(error => {
            res.status(500).send(error.toString());
        });
    }

    groupedEvents(req: e.Request, res: e.Response, next: e.NextFunction) {
        const earliest = req.query.earliest as string;
        const slices   = Number.parseInt(req.query.slices as string);

        this.report.groupedEvents(earliest, slices)
        .then(result => {
            res.status(200).send(result);
        })
        .catch(error => {
            res.status(500).send(error.toString());
        });
    }
}

export {DashboardController}