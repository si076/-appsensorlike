import { JSONConfigReadValidate } from "../../utils/Utils.js";

type RESPONSE_CATEGORIZATION_EXECUTION = { always: string[], sometimes: string[] };

class ResponseDescriptions {
    IDs: {
        [id: string]:string
    } = {};
    Categorization: {
        Purpose: {
            Logging: RESPONSE_CATEGORIZATION_EXECUTION,
            Notifying: RESPONSE_CATEGORIZATION_EXECUTION,
            Disrupting: RESPONSE_CATEGORIZATION_EXECUTION,
            Blocking: RESPONSE_CATEGORIZATION_EXECUTION,
        },
        Target_User: {
            One: RESPONSE_CATEGORIZATION_EXECUTION,
            All: RESPONSE_CATEGORIZATION_EXECUTION
        },
        Response_Duration: {
            Instantaneous: RESPONSE_CATEGORIZATION_EXECUTION,
            Period: RESPONSE_CATEGORIZATION_EXECUTION,
            Permanent: RESPONSE_CATEGORIZATION_EXECUTION
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
        super(import.meta.url,
              'appsensor-responses-descriptions.json', 
              null, 
              ResponseDescriptions.prototype);
    }
}

export {RESPONSE_CATEGORIZATION_EXECUTION, ResponseDescriptions, ResponseDescriptionsReader};