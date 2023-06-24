import { AppSensorEvent, Attack, Response } from "../core.js";
import { AttackListener, EventListener, ResponseListener } from "../listener/listener.js";

/**
 * The attack analysis engine is an implementation of the Observer pattern. 
 * 
 * In this case the analysis engines watches the {@link AttackStore} interface.
 * 
 * AnalysisEngine implementations are the components of AppSensor that 
 * constitute the "brain" of the system. 
 * 
 * In contrast to the ORIGINAL code here methods are asynchronous returning Promise<T>.
 */
 abstract class AttackAnalysisEngine implements AttackListener {
	
	public async onAdd(attack: Attack) {
		await this.analyze(attack);
	}
	
	public abstract analyze(attack: Attack): Promise<void>;
	
}

/**
 * The event analysis engine is an implementation of the Observer pattern. 
 * 
 * In this case the analysis engines watches the {@link EventStore} interface.
 * 
 * AnalysisEngine implementations are the components of AppSensor that 
 * constitute the "brain" of the system. 
 * 
 * In contrast to the ORIGINAL code here methods are asynchronous returning Promise<T>.
 */
 abstract class EventAnalysisEngine implements EventListener {

	public async onAdd(event: AppSensorEvent) {
		await this.analyze(event);
	}
	
	public abstract analyze(event: AppSensorEvent): Promise<void>;
	
}

/**
 * The response analysis engine is an implementation of the Observer pattern. 
 * 
 * In this case the analysis engines watches the {@link ResponseStore} interface.
 * 
 * AnalysisEngine implementations are the components of AppSensor that 
 * constitute the "brain" of the system. 
 * 
 * In contrast to the ORIGINAL code here methods are asynchronous returning Promise<T>.
 */
 abstract class ResponseAnalysisEngine implements ResponseListener {

	public async onAdd(response: Response) {
		await this.analyze(response);
	}
	
	public abstract analyze(response: Response): Promise<void>;
	
}

export {AttackAnalysisEngine, EventAnalysisEngine, ResponseAnalysisEngine};