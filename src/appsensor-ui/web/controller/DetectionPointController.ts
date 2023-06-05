import e from 'express';

import { ReportingEngineExt } from "../../../reporting-engines/reporting-engines.js";
import { DetectionPointReport } from "../../reports/DetectionPointReport.js";

class DetectionPointController {

    private report: DetectionPointReport;

    constructor(reportingEngine: ReportingEngineExt) {
        this.report = new DetectionPointReport(reportingEngine);
    }

    allContent(req: e.Request, res: e.Response, next: e.NextFunction) {
        const category = req.params.category;
        const label    = req.params.label;
        const earliest = req.query.earliest as string;
        const limit    = Number.parseInt(req.query.limit as string);
        const slices   = Number.parseInt(req.query.slices as string);

        this.report.allContent(category, label, earliest, limit, slices)
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

    byTimeFrame(req: e.Request, res: e.Response, next: e.NextFunction) {
        const category = req.params.category;
        const label = req.params.label;

        this.report.byTimeFrame(category, label)
        .then(result => {
            res.status(200).send(result);
        })
        .catch(error => {
            res.status(500).send(error.toString());
        });
    }

    configuration(req: e.Request, res: e.Response, next: e.NextFunction) {
        const label = req.params.label;

        this.report.configuration(label)
        .then(result => {
            res.status(200).send(result);
        })
        .catch(error => {
            res.status(500).send(error.toString());
        });
    }

    recentEvents(req: e.Request, res: e.Response, next: e.NextFunction) {
        const label    = req.params.label;
        const earliest = req.query.earliest as string;
        const limit    = Number.parseInt(req.query.limit as string);

        this.report.recentEvents(label, earliest, limit)
        .then(result => {
            res.status(200).send(result);
        })
        .catch(error => {
            res.status(500).send(error.toString());
        });
    }

    recentAttacks(req: e.Request, res: e.Response, next: e.NextFunction) {
        const label    = req.params.label;
        const earliest = req.query.earliest as string;
        const limit    = Number.parseInt(req.query.limit as string);

        this.report.recentAttacks(label, earliest, limit)
        .then(result => {
            res.status(200).send(result);
        })
        .catch(error => {
            res.status(500).send(error.toString());
        });
    }

    byClientApplication(req: e.Request, res: e.Response, next: e.NextFunction) {
        const label    = req.params.label;
        const earliest = req.query.earliest as string;

        this.report.byClientApplication(label, earliest)
        .then(result => {
            res.status(200).send(result);
        })
        .catch(error => {
            res.status(500).send(error.toString());
        });
    }

    topUsers(req: e.Request, res: e.Response, next: e.NextFunction) {
        const label    = req.params.label;
        const earliest = req.query.earliest as string;
        const limit    = Number.parseInt(req.query.limit as string);

        this.report.topUsers(label, earliest, limit)
        .then(result => {
            res.status(200).send(result);
        })
        .catch(error => {
            res.status(500).send(error.toString());
        });
    }

    groupedDetectionPoints(req: e.Request, res: e.Response, next: e.NextFunction) {
        const label    = req.params.label;
        const earliest = req.query.earliest as string;
        const slices   = Number.parseInt(req.query.slices as string);

        this.report.groupedDetectionPoints(label, earliest, slices)
        .then(result => {
            res.status(200).send(result);
        })
        .catch(error => {
            res.status(500).send(error.toString());
        });
    }

    topDetectionPoints(req: e.Request, res: e.Response, next: e.NextFunction) {
        const earliest = req.query.earliest as string;
        const limit    = Number.parseInt(req.query.limit as string);

        this.report.topDetectionPoints(earliest, limit)
        .then(result => {
            res.status(200).send(result);
        })
        .catch(error => {
            res.status(500).send(error.toString());
        });
    }

}

export {DetectionPointController}