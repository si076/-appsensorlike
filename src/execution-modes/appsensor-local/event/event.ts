import { AppSensorEvent, Attack, Response } from "../../../core/core.js";
import { EventManager } from "../../../core/event/event.js";
import { Logger } from "../../../logging/logging.js";
import { LocalRequestHandler } from "../handler/handler.js";

import log from "log4js";

class LocalEventManager implements EventManager {
	
	private requestHandler: LocalRequestHandler;
	
    constructor(requestHandler: LocalRequestHandler) {
        this.requestHandler = requestHandler;
    }
	/**
	 * {@inheritDoc}
	 */
	public async  addEvent(event: AppSensorEvent): Promise<void> {
		Logger.getClientLogger().trace('LocalEventManager.addEvent:');
		Logger.getClientLogger().trace(event);

		try {
			await this.requestHandler.addEvent(event);
		} catch (error) {

			Logger.getClientLogger().error(error);
			return Promise.reject(error);
		}
		
	}
	
	/**
	 * {@inheritDoc}
	 */
	public async addAttack(attack: Attack): Promise<void> {
		Logger.getClientLogger().trace('LocalEventManager.addAttack:');
		Logger.getClientLogger().trace(attack);

		try {
			await this.requestHandler.addAttack(attack);
		} catch (error) {

			Logger.getClientLogger().error(error);
			return Promise.reject(error);
		}
	}
	
	/**
	 * {@inheritDoc}
	 */
	public getResponses(earliest: Date): Promise<Response[]> {
		Logger.getClientLogger().trace('LocalEventManager.getResponses:');
		Logger.getClientLogger().trace(`earliest: ${earliest}`);

		try {
			return this.requestHandler.getResponses(earliest);
		} catch (error) {

			Logger.getClientLogger().error(error);
			return Promise.reject(error);
		}
	}
	
}

export {LocalEventManager};