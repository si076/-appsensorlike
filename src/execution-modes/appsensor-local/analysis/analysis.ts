import { ResponseAnalysisEngine } from "../../../core/analysis/analysis.js";
import { Response, Utils } from "../../../core/core.js";
import { ResponseHandler, RESPONSES } from "../../../core/response/response.js";
import { Logger } from "../../../logging/logging.js";

class LocalResponseAnalysisEngine extends ResponseAnalysisEngine {

	private responseHandler: ResponseHandler;
	
    constructor(responseHandler: ResponseHandler) {
        super();
        this.responseHandler = responseHandler;
    }
	/**
	 * This method simply logs or executes responses.
	 * 
	 * @param response {@link Response} that has been added to the {@link ResponseStore}.
	 */
	public override async analyze(response: Response): Promise<void> {
		if(response === null) {
			return;
		}

        let userName = Utils.getUserName(response.getUser());
        
		if (RESPONSES.LOG === response.getAction()) {
			//we log here with the client logger as with local implementation everyting happens on one side
			Logger.getClientLogger().trace("LocalResponseAnalysisEngine.analyze:", `Handling <log> response for user ${userName}`);
		} 
		// else {

			//in all cases allow configured response handler to handle the response


			Logger.getClientLogger().trace("LocalResponseAnalysisEngine.analyze:", `Delegating response for user ${userName} to configured response handler ${this.responseHandler.constructor.name}`);

			this.responseHandler.handle(response);
		// }
		
	}
	
}

export {LocalResponseAnalysisEngine};