import { AppSensorEvent, RequestHandler, AppSensorServer, Attack, Response } from "../../../core/core.js";
import { SearchCriteria } from "../../../core/criteria/criteria.js";

class LocalRequestHandler implements RequestHandler {

	private appSensorServer: AppSensorServer;
	
	private static detectionSystemId: string | null = null;	//start with blank
	
    constructor(appSensorServer: AppSensorServer) {
        this.appSensorServer = appSensorServer;
    }

	/**
	 * {@inheritDoc}
	 */
	public async addEvent(event: AppSensorEvent) {
        const detSystem = event.getDetectionSystem();
		if (LocalRequestHandler.detectionSystemId === null && detSystem !== null) {
			LocalRequestHandler.detectionSystemId = detSystem.getDetectionSystemId();
		}
		
        const eventStore = this.appSensorServer.getEventStore();
        if (eventStore) {
            await eventStore.addEvent(event);
        }
		
	}

	/**
	 * {@inheritDoc}
	 */
	public async addAttack(attack: Attack) {
        const detSystem = attack.getDetectionSystem();
		if (LocalRequestHandler.detectionSystemId == null && detSystem !== null) {
			LocalRequestHandler.detectionSystemId = detSystem.getDetectionSystemId();
		}
		
        const attackStore = this.appSensorServer.getAttackStore();
        if (attackStore) {
            await attackStore.addAttack(attack);
        }
		
	}

	/**
	 * {@inheritDoc}
	 */
	public async getResponses(earliest: Date): Promise<Response[]> {
        const detSystem = LocalRequestHandler.detectionSystemId !== null ? LocalRequestHandler.detectionSystemId : "";
		const criteria: SearchCriteria = new SearchCriteria().
				setDetectionSystemIds([detSystem]).
				setEarliest(earliest);
		
        let responses: Response[] = []         

        const responseStore = this.appSensorServer.getResponseStore();
        if (responseStore) {
            responses = await responseStore.findResponses(criteria);
        }
		return responses;
	}

	public async getEvents(earliest: Date): Promise<AppSensorEvent[]> {
        const detSystem = LocalRequestHandler.detectionSystemId !== null ? LocalRequestHandler.detectionSystemId : "";
		const criteria: SearchCriteria = new SearchCriteria().
				setDetectionSystemIds([detSystem]).
				setEarliest(earliest);
		
        let events: AppSensorEvent[] = []         

        const eventStore = this.appSensorServer.getEventStore();
        if (eventStore) {
            events = await eventStore.findEvents(criteria);
        }
		return events;
	}

	public async getAttacks(earliest: Date): Promise<Attack[]> {
        const detSystem = LocalRequestHandler.detectionSystemId !== null ? LocalRequestHandler.detectionSystemId : "";
		const criteria: SearchCriteria = new SearchCriteria().
				setDetectionSystemIds([detSystem]).
				setEarliest(earliest);
		
        let attacks: Attack[] = []         

        const attackStore = this.appSensorServer.getAttackStore();
        if (attackStore) {
            attacks = await attackStore.findAttacks(criteria);
        }
		return attacks;
	}

}

export {LocalRequestHandler};