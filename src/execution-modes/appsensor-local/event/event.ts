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
	public async addEvent(event: AppSensorEvent): Promise<void> {
		await this.requestHandler.addEvent(event);
	}
	
	/**
	 * {@inheritDoc}
	 */
	// @Override
	public async addAttack(attack: Attack): Promise<void> {
		await this.requestHandler.addAttack(attack);
	}
	
	/**
	 * {@inheritDoc}
	 */
	// @Override
	public getResponses(earliest: Date): Promise<Response[]> {
		return this.requestHandler.getResponses(earliest);
	}
	
}

export {LocalEventManager};