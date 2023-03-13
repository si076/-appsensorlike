import { AppSensorEvent, Attack, Response } from "../core.js";
import { AttackListener, EventListener, ResponseListener } from "../listener/listener.js";

// @AttackStoreListener
abstract class AttackAnalysisEngine implements AttackListener {
	
	public onAdd(attack: Attack): void {
		this.analyze(attack);
	}
	
	public abstract analyze(attack: Attack): void;
	
}

// @EventStoreListener
abstract class EventAnalysisEngine implements EventListener {

	public onAdd(event: AppSensorEvent): void {
		this.analyze(event);
	}
	
	public abstract analyze(event: AppSensorEvent): void;
	
}

// @ResponseStoreListener
abstract class ResponseAnalysisEngine implements ResponseListener {

	public onAdd(response: Response): void {
		this.analyze(response);
	}
	
	public abstract analyze(response: Response): void;
	
}

export {AttackAnalysisEngine, EventAnalysisEngine, ResponseAnalysisEngine};