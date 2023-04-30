import { SearchCriteria } from "../../core/criteria/criteria.js";
import { AttackStore, EventStore, ResponseStore } from "../../core/storage/storage.js";
import { AppSensorEvent, Attack, DetectionPoint, DetectionSystem, Response, User, Utils as coreUtils } from "../../core/core.js";
import { DOP, TYPE_FILTER_FUNCTION } from "./DOP.js";
import { Rule } from "../../core/rule/rule.js";


class MySQLAttackStore extends AttackStore {

    public override async addAttack(attack: Attack): Promise<void> {
        let userName = coreUtils.getUserName(attack.getUser());;
        
		console.warn("Security attack " + attack.getName() + " triggered by user: " + userName);


        await DOP.persist(attack);

        await super.notifyListeners(attack);
    }
    
    public override async findAttacks(criteria: SearchCriteria): Promise<Attack[]> {
		const user: User | null = criteria.getUser();
		const detectionPoint: DetectionPoint | null = criteria.getDetectionPoint();
		const detectionSystemIds: string[] = criteria.getDetectionSystemIds();
		const earliest: Date | null = criteria.getEarliest();
		const rule: Rule | null = criteria.getRule();

        const propFilterFuncMap = new Map<string, TYPE_FILTER_FUNCTION | string>();

        if (user) {
            propFilterFuncMap.set("user", (obj: Object) => {
                return  user.equals(obj);
            });
        }

        if (detectionSystemIds.length > 0) {
            propFilterFuncMap.set("detectionSystem", (obj: Object) => {
                let result = true;
                const detectionSystem = (obj as DetectionSystem);
                if (detectionSystem) {
                    result = detectionSystemIds.indexOf(detectionSystem.getDetectionSystemId()) > -1;
                }
                return result;
            });
        }

        if (detectionPoint !== null) {

            propFilterFuncMap.set("detectionPoint", (obj: Object) => {
                return detectionPoint.typeAndThresholdMatches(obj as DetectionPoint);
            });

        } else if (rule !== null) {

            propFilterFuncMap.set("rule", (obj: Object) => {
                return rule.guidMatches(obj as Rule);
            });
            
        }

        if (earliest !== null) {
            const datetime = earliest.toISOString().replace('T', ' ').replace('Z', '');
            const expre = `timestamp > '${datetime}' OR timestamp = '${datetime}'`;
            propFilterFuncMap.set("timestamp", expre);
        }

		const foundEvents = await DOP.findObjects("Attack", propFilterFuncMap);

        return foundEvents as Attack[];
    }

}

class MySQLEventStore extends EventStore {
    
    public override async addEvent(event: AppSensorEvent): Promise<void> {
        const detPointLabel = coreUtils.getDetectionPointLabel(event.getDetectionPoint());

        const userName = coreUtils.getUserName(event.getUser());

		console.warn("Security event " + detPointLabel + " triggered by user: " + userName);
		

        await DOP.persist(event);

        await super.notifyListeners(event);

    }

    public override async findEvents(criteria: SearchCriteria): Promise<AppSensorEvent[]> {
		const user: User | null = criteria.getUser();
		const detectionPoint: DetectionPoint | null = criteria.getDetectionPoint();
		const detectionSystemIds: string[] = criteria.getDetectionSystemIds();
		const earliest: Date | null = criteria.getEarliest();
		const rule: Rule | null = criteria.getRule();

        const propFilterFuncMap = new Map<string, TYPE_FILTER_FUNCTION | string>();

        if (user) {
            propFilterFuncMap.set("user", (obj: Object) => {
                return  user.equals(obj);
            });
        }

        if (detectionSystemIds.length > 0) {
            propFilterFuncMap.set("detectionSystem", (obj: Object) => {
                let result = true;
                const detectionSystem = (obj as DetectionSystem);
                if (detectionSystem) {
                    result = detectionSystemIds.indexOf(detectionSystem.getDetectionSystemId()) > -1;
                }
                return result;
            });
        }

        if (detectionPoint !== null) {

            propFilterFuncMap.set("detectionPoint", (obj: Object) => {
                return detectionPoint.typeAndThresholdMatches(obj as DetectionPoint);
            });

        } else if (rule !== null) {

            propFilterFuncMap.set("detectionPoint", (obj: Object) => {
                return rule.typeAndThresholdContainsDetectionPoint(obj as DetectionPoint);
            });

        }

        if (earliest !== null) {
            const datetime = earliest.toISOString().replace('T', ' ').replace('Z', '');
            const expre = `timestamp > '${datetime}' OR timestamp = '${datetime}'`;
            propFilterFuncMap.set("timestamp", expre);
        }

		const foundEvents = await DOP.findObjects("AppSensorEvent", propFilterFuncMap);

        return foundEvents as AppSensorEvent[];
    }

}

class MySQLResponseStore extends ResponseStore {

    public override async addResponse(response: Response): Promise<void> {
        let userName = coreUtils.getUserName(response.getUser());

		console.warn("Security response " + response.getAction() + " triggered for user: " + userName);

        await DOP.persist(response);

        await super.notifyListeners(response);

    }

    public override async findResponses(criteria: SearchCriteria): Promise<Response[]> {
		const user: User | null = criteria.getUser();
		const detectionSystemIds: string[] = criteria.getDetectionSystemIds();
		const earliest: Date | null = criteria.getEarliest();

        const propFilterFuncMap = new Map<string, TYPE_FILTER_FUNCTION | string>();

        if (user) {
            propFilterFuncMap.set("user", (obj: Object) => {
                return  user.equals(obj);
            });
        }

        if (detectionSystemIds.length > 0) {
            propFilterFuncMap.set("detectionSystem", (obj: Object) => {
                let result = true;
                const detectionSystem = (obj as DetectionSystem);
                if (detectionSystem) {
                    result = detectionSystemIds.indexOf(detectionSystem.getDetectionSystemId()) > -1;
                }
                return result;
            });
        }

        if (earliest !== null) {
            const datetime = earliest.toISOString().replace('T', ' ').replace('Z', '');
            const expre = `timestamp > '${datetime}' OR timestamp = '${datetime}'`;
            propFilterFuncMap.set("timestamp", expre);
        }

		const foundEvents = await DOP.findObjects("Response", propFilterFuncMap);

        return foundEvents as Response[];

    }

}


export {MySQLAttackStore, MySQLEventStore, MySQLResponseStore};