import e from 'express';

import { ReportingEngineExt } from '../../../reporting-engines/reporting-engines.js';
import { UserReport } from '../../reports/UserReport.js';

class UserController {

    private userReport: UserReport;

    constructor(userReport: UserReport) {
        this.userReport = userReport;
    }

    allContent(req: e.Request, res: e.Response, next: e.NextFunction) {
        const username = req.params.username;
        const earliest = req.query.earliest as string;
        const limit    = Number.parseInt(req.query.limit as string);
        const slices   = Number.parseInt(req.query.slices as string);

        this.userReport.allContent(username, earliest, limit, slices)
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
        const username = req.params.username;
        const earliest = req.query.earliest as string;

        this.userReport.activeResponses(username, earliest)
        .then(result => {
            res.status(200).send(result);
        })
        .catch(error => {
            res.status(500).send(error.toString());
        });
     }

    byTimeFrame(req: e.Request, res: e.Response, next: e.NextFunction) {
        const username = req.params.username;

        this.userReport.byTimeFrame(username)
        .then(result => {
            res.status(200).send(result);
        })
        .catch(error => {
            res.status(500).send(error.toString());
        });
    }

    recentEvents(req: e.Request, res: e.Response, next: e.NextFunction) {
        const username = req.params.username;
        const earliest = req.query.earliest as string;
        const limit    = Number.parseInt(req.query.limit as string);

        this.userReport.recentEvents(username, earliest, limit)
        .then(result => {
            res.status(200).send(result);
        })
        .catch(error => {
            res.status(500).send(error.toString());
        });
    }

    recentAttacks(req: e.Request, res: e.Response, next: e.NextFunction) {
        const username = req.params.username;
        const earliest = req.query.earliest as string;
        const limit    = Number.parseInt(req.query.limit as string);

        this.userReport.recentAttacks(username, earliest, limit)
        .then(result => {
            res.status(200).send(result);
        })
        .catch(error => {
            res.status(500).send(error.toString());
        });
    }

    recentResponses(req: e.Request, res: e.Response, next: e.NextFunction) {
        const username = req.params.username;
        const earliest = req.query.earliest as string;
        const limit    = Number.parseInt(req.query.limit as string);

        this.userReport.recentResponses(username, earliest, limit)
        .then(result => {
            res.status(200).send(result);
        })
        .catch(error => {
            res.status(500).send(error.toString());
        });
    }

    byClientApplication(req: e.Request, res: e.Response, next: e.NextFunction) {
        const username = req.params.username;
        const earliest = req.query.earliest as string;

        this.userReport.byClientApplication(username, earliest)
        .then(result => {
            res.status(200).send(result);
        })
        .catch(error => {
            res.status(500).send(error.toString());
        });
    }

    groupedUsers(req: e.Request, res: e.Response, next: e.NextFunction) {
        const username = req.params.username;
        const earliest = req.query.earliest as string;
        const slices   = Number.parseInt(req.query.slices as string);

        this.userReport.groupedUsers(username, earliest, slices)
        .then(result => {
            res.status(200).send(result);
        })
        .catch(error => {
            res.status(500).send(error.toString());
        });
    }

    topUsers(req: e.Request, res: e.Response, next: e.NextFunction) {
        const earliest = req.query.earliest as string;
        const limit    = Number.parseInt(req.query.limit as string);

        this.userReport.topUsers(earliest, limit)
        .then(result => {
            res.status(200).send(result);
        })
        .catch(error => {
            res.status(500).send(error.toString());
        });
    }
}

export {UserController};