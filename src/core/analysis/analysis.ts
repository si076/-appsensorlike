import { AppSensorEvent, Attack, Response } from "../core.js";
import { AttackListener, EventListener, ResponseListener } from "../listener/listener.js";

// @AttackStoreListener
abstract class AttackAnalysisEngine implements AttackListener {
	
	public async onAdd(attack: Attack) {
		await this.analyze(attack);
	}
	
	public abstract analyze(attack: Attack): Promise<void>;
	
}

// @EventStoreListener
abstract class EventAnalysisEngine implements EventListener {

	public async onAdd(event: AppSensorEvent) {
		await this.analyze(event);
	}
	
	public abstract analyze(event: AppSensorEvent): Promise<void>;
	
}

// @ResponseStoreListener
abstract class ResponseAnalysisEngine implements ResponseListener {

	public async onAdd(response: Response) {
		await this.analyze(response);
	}
	
	public abstract analyze(response: Response): Promise<void>;
	
}

export {AttackAnalysisEngine, EventAnalysisEngine, ResponseAnalysisEngine};