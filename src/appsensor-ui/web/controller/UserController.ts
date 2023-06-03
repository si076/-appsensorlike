import e from 'express';

import { ReportingEngineExt } from '../../../reporting-engines/reporting-engines.js';
import { UserReport } from '../../reports/UserReport.js';

class UserController {

    private userReport: UserReport;

    constructor(reportingEngine: ReportingEngineExt) {
        this.userReport = new UserReport(reportingEngine);
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

            res.sendStatus(200).send(obj);
        })
        .catch(error => {
            res.status(500).send(error.toString());
        });
    }
}

export {UserController};