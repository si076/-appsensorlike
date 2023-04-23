import { ResponseAnalysisEngine } from "../../../core/analysis/analysis.js";
import { Response, Utils } from "../../../core/core.js";
import { ResponseHandler, RESPONSES } from "../../../core/response/response.js";

class LocalResponseAnalysisEngine extends ResponseAnalysisEngine {

	// private Logger logger;
	
	// @Inject
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
	// @Override
	public override async analyze(response: Response): Promise<void> {
		if(response == null) {
			return;
		}

        let userName = Utils.getUserName(response.getUser());
        
		if (RESPONSES.LOG === response.getAction()) {
			console.info(`Handling <log> response for user ${userName}`);
		} else {

			console.info(`Delegating response for user ${userName} to configured response handler ` + this.responseHandler.constructor.name);

			this.responseHandler.handle(response);
		}
		
	}
	
}

export {LocalResponseAnalysisEngine};