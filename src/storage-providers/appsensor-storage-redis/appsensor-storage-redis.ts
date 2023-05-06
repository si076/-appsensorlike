import { Attack, AppSensorEvent, Response } from "../../core/core";
import { SearchCriteria } from "../../core/criteria/criteria";
import { AttackStore, EventStore, ResponseStore } from "../../core/storage/storage";

class RedisAttackStore extends AttackStore {

    public addAttack(attack: Attack): Promise<void> {
        throw new Error("Method not implemented.");
    }
    public findAttacks(criteria: SearchCriteria): Promise<Attack[]> {
        throw new Error("Method not implemented.");
    }

    public countAttacks(criteria: SearchCriteria): Promise<number> {
        throw new Error("Method not implemented.");
    }

}

class RedisEventStore extends EventStore {
    public addEvent(event: AppSensorEvent): Promise<void> {
        throw new Error("Method not implemented.");
    }
    public findEvents(criteria: SearchCriteria): Promise<AppSensorEvent[]> {
        throw new Error("Method not implemented.");
    }

    public countEvents(criteria: SearchCriteria): Promise<number> {
        throw new Error("Method not implemented.");
    }
    
}

class RedisResponseStore extends ResponseStore {
    public addResponse(response: Response): Promise<void> {
        throw new Error("Method not implemented.");
    }
    public findResponses(criteria: SearchCriteria): Promise<Response[]> {
        throw new Error("Method not implemented.");
    }

    public countResponses(criteria: SearchCriteria): Promise<number> {
        throw new Error("Method not implemented.");
    }

}