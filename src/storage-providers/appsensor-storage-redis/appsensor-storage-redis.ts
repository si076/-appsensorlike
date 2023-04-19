import { Attack, AppSensorEvent, Response } from "../../core/core";
import { SearchCriteria } from "../../core/criteria/criteria";
import { AttackStore, EventStore, ResponseStore } from "../../core/storage/storage";

class RedisAttackStore extends AttackStore {

    public addAttack(attack: Attack): void {
        throw new Error("Method not implemented.");
    }
    public findAttacks(criteria: SearchCriteria): Attack[] {
        throw new Error("Method not implemented.");
    }

}

class RedisEventStore extends EventStore {
    
    public addEvent(event: AppSensorEvent): void {
        throw new Error("Method not implemented.");
    }
    public findEvents(criteria: SearchCriteria): AppSensorEvent[] {
        throw new Error("Method not implemented.");
    }

}

class RedisResponseStore extends ResponseStore {

    public addResponse(response: Response): void {
        throw new Error("Method not implemented.");
    }
    public findResponses(criteria: SearchCriteria): Response[] {
        throw new Error("Method not implemented.");
    }

}