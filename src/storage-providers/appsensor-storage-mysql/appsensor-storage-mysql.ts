import { SearchCriteria } from "../../core/criteria/criteria.js";
import { AttackStore, EventStore, ResponseStore } from "../../core/storage/storage.js";
import { Utils } from './utils.js'
import { AppSensorEvent, Attack, Response, Utils as coreUtils } from "../../core/core.js";
import { DOP } from "./DOP.js";


import _ from 'underscore';
import { ConnectionManager } from "./connection_manager.js";

class MySQLAttackStore extends AttackStore {

    public override async addAttack(attack: Attack): Promise<void> {
        let userName = coreUtils.getUserName(attack.getUser());;
        
		console.warn("Security attack " + attack.getName() + " triggered by user: " + userName);


        DOP.persist(attack)
        .then((res) => {
            super.notifyListeners(attack);
        })
        .catch((error) => {
            console.error(error);
        });

    }
    
    public override findAttacks(criteria: SearchCriteria): Promise<Attack[]> {
        throw new Error("Method not implemented.");
    }

}

class MySQLEventStore extends EventStore {
    
    public override async addEvent(event: AppSensorEvent): Promise<void> {
        const detPointLabel = coreUtils.getDetectionPointLabel(event.getDetectionPoint());

        const userName = coreUtils.getUserName(event.getUser());

		console.warn("Security event " + detPointLabel + " triggered by user: " + userName);
		

        DOP.persist(event)
        .then((res) => {
            super.notifyListeners(event);
        })
        .catch((error) => {
            console.error(error);
        });

    }

    public override findEvents(criteria: SearchCriteria): Promise<AppSensorEvent[]> {
        throw new Error("Method not implemented.");
    }

}

class MySQLResponseStore extends ResponseStore {

    public override async addResponse(response: Response): Promise<void> {
        let userName = coreUtils.getUserName(response.getUser());

		console.warn("Security response " + response.getAction() + " triggered for user: " + userName);

        DOP.persist(response)
        .then((res) => {
            super.notifyListeners(response);
        })
        .catch((error) => {
            console.error(error);
        });

    }

    public override findResponses(criteria: SearchCriteria): Promise<Response[]> {
        throw new Error("Method not implemented.");
    }

}


export {MySQLAttackStore, MySQLEventStore, MySQLResponseStore};