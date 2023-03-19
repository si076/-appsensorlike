import { AppSensorEvent, Attack, Response } from "../../../core/core.js";
import { EventManager } from "../../../core/event/event.js";
import { LocalRequestHandler } from "../handler/handler.js";

class LocalEventManager implements EventManager {
	
	// @SuppressWarnings("unused")
	// private Logger logger;
	
	// @Inject
	private requestHandler: LocalRequestHandler;
	
    constructor(requestHandler: LocalRequestHandler) {
        this.requestHandler = requestHandler;
    }
	/**
	 * {@inheritDoc}
	 */
	// @Override
	public addEvent(event: AppSensorEvent): void {
		this.requestHandler.addEvent(event);
	}
	
	/**
	 * {@inheritDoc}
	 */
	// @Override
	public addAttack(attack: Attack): void {
		this.requestHandler.addAttack(attack);
	}
	
	/**
	 * {@inheritDoc}
	 */
	// @Override
	public getResponses(earliest: Date): Response[] {
		return this.requestHandler.getResponses(earliest);
	}
	
}

export {LocalEventManager};