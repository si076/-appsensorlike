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

class DetectionPointsDescription {
    IDs: {
        [id: string]:string
    } = {};
    Categorization: {
        Suspicious: {
            description: string,
            one_user: string[],
            all_users: string[]
        },
        Attack: {
            description: string,
            one_user: string[],
            all_users: string[]
        },
        Discrete: {
            description: string,
            one_user: string[],
            all_users: string[]
        },
        Aggregating: {
            description: string,
            one_user: string[],
            all_users: string[]
        },
        Modifying: {
            description: string,
            one_user: string[],
            all_users: string[]
        }
    } = {Suspicious: {description: '', one_user:[], all_users: []},
         Attack: {description: '', one_user:[], all_users: []},
         Discrete: {description: '', one_user:[], all_users: []},
         Aggregating: {description: '', one_user:[], all_users: []},
         Modifying: {description: '', one_user:[], all_users: []}
        };
}

class DetectionPointsDescriptionReader extends JSONConfigReadValidate {
    constructor() {
        super('appsensor-detection-point-descriptions.json', null, DetectionPointsDescription.prototype);
    }
}

export {ReportingEngineExt, ReportingSettingsLoader, ReportingSettings, 
        DetectionPointsDescription, DetectionPointsDescriptionReader};