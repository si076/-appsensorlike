import { JSONConfigReadValidate } from "../../utils/Utils.js";

type DET_POINT_CATEGORIZATION_DESCR = { description: string, one_user: string[], all_users: string[] };

class DetectionPointDescriptions {
    IDs: {
        [id: string]:string
    } = {};
    Categorization: {
        Suspicious: DET_POINT_CATEGORIZATION_DESCR,
        Attack: DET_POINT_CATEGORIZATION_DESCR,
        Discrete: DET_POINT_CATEGORIZATION_DESCR,
        Aggregating: DET_POINT_CATEGORIZATION_DESCR,
        Modifying: DET_POINT_CATEGORIZATION_DESCR,
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
        super(import.meta.url,
              'appsensor-detection-point-descriptions.json', 
              null, 
              DetectionPointDescriptions.prototype);
    }
}

export {DET_POINT_CATEGORIZATION_DESCR, DetectionPointDescriptions, DetectionPointDescriptionsReader};
