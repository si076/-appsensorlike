import { AppSensorEvent, Attack, Response } from "../../../core/core.js";
import { EventManager } from "../../../core/event/event.js";
import { Logger } from "../../../logging/logging.js";
import { LocalRequestHandler } from "../handler/handler.js";

class LocalEventManager implements EventManager {
	
	private requestHandler: LocalRequestHandler;
	
    constructor(requestHandler: LocalRequestHandler) {
        this.requestHandler = requestHandler;
    }

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
	
	getEvents(earliest: Date): Promise<AppSensorEvent[]> {
		Logger.getClientLogger().trace('LocalEventManager.getEvents:');
		Logger.getClientLogger().trace(`earliest: ${earliest}`);

		try {
			return this.requestHandler.getEvents(earliest);
		} catch (error) {

			Logger.getClientLogger().error(error);
			return Promise.reject(error);
		}
	}

	getAttacks(earliest: Date): Promise<Attack[]> {
		Logger.getClientLogger().trace('LocalEventManager.getAttack:');
		Logger.getClientLogger().trace(`earliest: ${earliest}`);

		try {
			return this.requestHandler.getAttacks(earliest);
		} catch (error) {

			Logger.getClientLogger().error(error);
			return Promise.reject(error);
		}
	}
}

export {LocalEventManager};