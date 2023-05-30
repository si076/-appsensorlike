import { ReportingEngine } from "../core/reporting/reporting.js";
import { JSONConfigReadValidate } from "../utils/Utils.js";

import fs from 'fs';

interface ReportingEngineExt extends ReportingEngine {

	countEventsByCategoryLabel(earliest: string, category: string, label: string): Promise<number>;
	
	countAttacksByCategoryLabel(earliest: string, category: string, label: string): Promise<number>;
	
	countResponsesByCategoryLabel(earliest: string, category: string, label: string): Promise<number>;

}

class ReportingSettings {
    lastCheck?: Date;
    viewRefreshTimeMs?: number;
    maxDisplayedItems?: number;

    loadDefaultForNotSpecified() {
        if (!this.lastCheck) {
            this.lastCheck = new Date(0);
        }

        if (!this.viewRefreshTimeMs) {
            this.viewRefreshTimeMs = 10000;
        }

        if (!this.maxDisplayedItems) {
            this.maxDisplayedItems = 10;
        }
    }
}

class ReportingSettingsLoader extends JSONConfigReadValidate {
    static DEFAULT_FILE: string = './reporting-engines/reporting-settings.json'; 

    protected settingsFile?: string

    constructor(settingsFile?: string) {
        super(ReportingSettingsLoader.DEFAULT_FILE, null, ReportingSettings.prototype);

        this.settingsFile = settingsFile;
    }

    public loadSettings(): ReportingSettings {
        const settings: ReportingSettings = super.read(this.settingsFile);
        settings.loadDefaultForNotSpecified();
        return settings;
    }

    public saveSettings(settings: ReportingSettings) {
        let file = this.settingsFile;
        if (!file) {
            file = ReportingSettingsLoader.DEFAULT_FILE;
        }
        fs.writeFileSync(file, JSON.stringify(settings), {encoding: 'utf8'});
    }
}

class DetectionPointDescriptions {
    IDs: {
        [id: string]:string
    } = {};
    Categorization: {
        Suspicious: { description: string, one_user: string[], all_users: string[] },
        Attack: { description: string, one_user: string[], all_users: string[] },
        Discrete: { description: string, one_user: string[], all_users: string[] },
        Aggregating: { description: string, one_user: string[], all_users: string[] },
        Modifying: { description: string, one_user: string[], all_users: string[] },
    } = {
        Suspicious: {description: '', one_user:[], all_users: []},
        Attack: {description: '', one_user:[], all_users: []},
        Discrete: {description: '', one_user:[], all_users: []},
        Aggregating: {description: '', one_user:[], all_users: []},
        Modifying: {description: '', one_user:[], all_users: []}
        };
}

class DetectionPointDescriptionsReader extends JSONConfigReadValidate {
    constructor() {
        super('appsensor-detection-point-descriptions.json', null, DetectionPointDescriptions.prototype);
    }
}

class ResponseDescriptions {
    IDs: {
        [id: string]:string
    } = {};
    Categorization: {
        Purpose: {
            Logging: { always: string[], sometimes: string[] },
            Notifying: { always: string[], sometimes: string[] },
            Disrupting: { always: string[], sometimes: string[] },
            Blocking: { always: string[], sometimes: string[] },
        },
        Target_User: {
            One: { always: string[], sometimes: string[] },
            All: { always: string[], sometimes: string[] }
        },
        Response_Duration: {
            Instantaneous: { always: string[], sometimes: string[] },
            Period: { always: string[], sometimes: string[] },
            Permanent: { always: string[], sometimes: string[] }
        }
    } = {
        Purpose: {
            Logging: { always: [], sometimes: [] },
            Notifying: { always: [], sometimes: [] },
            Disrupting: { always: [], sometimes: [] },
            Blocking: { always: [], sometimes: [] }
        },
        Target_User: {
            One: { always: [], sometimes: [] },
            All: { always: [], sometimes: [] },
        },
        Response_Duration: {
            Instantaneous: { always: [], sometimes: [] },
            Period: { always: [], sometimes: [] },
            Permanent: { always: [], sometimes: [] },
        }
    };
}

class ResponseDescriptionsReader extends JSONConfigReadValidate {
    constructor() {
        super('appsensor-responses-descriptions.json', null, ResponseDescriptions.prototype);
    }
}

export {ReportingEngineExt, ReportingSettingsLoader, ReportingSettings, 
        DetectionPointDescriptions, DetectionPointDescriptionsReader,
        ResponseDescriptions, ResponseDescriptionsReader};