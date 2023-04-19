import { SearchCriteria } from "../../core/criteria/criteria.js";
import { AttackStore, EventStore, ResponseStore } from "../../core/storage/storage.js";
import { Utils } from './utils.js'
import { AppSensorEvent, Attack, Response, Utils as coreUtils } from "../../core/core.js";
import { DOP } from "./DOP.js";


import _ from 'underscore';

class MySQLAttackStore extends AttackStore {

    public override addAttack(attack: Attack): void {
        let userName = coreUtils.getUserName(attack.getUser());;
        
		console.warn("Security attack " + attack.getName() + " triggered by user: " + userName);


        Utils.executeInTransaction(attack, DOP.persist)
        .then((res) => {
            super.notifyListeners(attack);
        })
        .catch((error) => {
            console.error(error);
        });

    }
    
    public override findAttacks(criteria: SearchCriteria): Attack[] {
        throw new Error("Method not implemented.");
    }

}

class MySQLEventStore extends EventStore {
    
    public override addEvent(event: AppSensorEvent): void {
        const detPointLabel = coreUtils.getDetectionPointLabel(event.getDetectionPoint());

        const userName = coreUtils.getUserName(event.getUser());

		console.warn("Security event " + detPointLabel + " triggered by user: " + userName);
		

        Utils.executeInTransaction(event, DOP.persist)
        .then((res) => {
            super.notifyListeners(event);
        })
        .catch((error) => {
            console.error(error);
        });

    }

    public override findEvents(criteria: SearchCriteria): AppSensorEvent[] {
        throw new Error("Method not implemented.");
    }

}

class MySQLResponseStore extends ResponseStore {

    public override addResponse(response: Response): void {
        let userName = coreUtils.getUserName(response.getUser());

		console.warn("Security response " + response.getAction() + " triggered for user: " + userName);

        Utils.executeInTransaction(response, DOP.persist)
        .then((res) => {
            super.notifyListeners(response);
        })
        .catch((error) => {
            console.error(error);
        });

    }

    public override findResponses(criteria: SearchCriteria): Response[] {
        throw new Error("Method not implemented.");
    }

}


export {MySQLAttackStore, MySQLEventStore, MySQLResponseStore};