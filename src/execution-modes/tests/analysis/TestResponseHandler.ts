import { ResponseAnalysisEngine } from "../../../core/analysis/analysis.js";
import { Response, Utils } from "../../../core/core.js";
import { ResponseHandler, RESPONSES, UserManager } from "../../../core/response/response.js";
import { Logger } from "../../../logging/logging.js";

class TestResponseAnalysisEngine extends ResponseAnalysisEngine {

    constructor() {
        super();
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
        
		Logger.getServerLogger().info("TestResponseAnalysisEngine.analyze:", `Just log response's action '${response.getAction()}' for user '${userName}'`);
	}
	
}

class TestResponseHandler implements ResponseHandler {

	private userManager: UserManager;
	
    constructor(userManager: UserManager) {
        this.userManager = userManager;
    }
	/**
	 * {@inheritDoc}
	 */
	// @Override
	public handle(response: Response) {
		Logger.getResponsesLogger().trace("TestResponseHandler.handle:");
		Logger.getResponsesLogger().trace(response);

        let userName = Utils.getUserName(response.getUser());
		
		if (RESPONSES.LOG === response.getAction()) {
			Logger.getResponsesLogger().warn("TestResponseHandler.handle: ",
											 `Response executed for user: ${userName}, `,
											 "Action: Increased Logging");
		} else if (RESPONSES.LOGOUT === response.getAction()) {
			Logger.getResponsesLogger().warn("TestResponseHandler.handle: ",
											 `Response executed for user: ${userName}, `,
											 `Action: Logging out malicious account, delegating to configured user manager ${this.userManager.constructor.name}`);
			
			this.userManager.logout(response.getUser());
		} else if (RESPONSES.DISABLE_USER === response.getAction()) {
			Logger.getResponsesLogger().warn("TestResponseHandler.handle: ",
											 `Response executed for user: ${userName}, `,
											 `Action: Disabling malicious account, delegating to configured user manager ${this.userManager.constructor.name}`);
			
			this.userManager.disable(response.getUser());
		} else if (RESPONSES.DISABLE_COMPONENT_FOR_SPECIFIC_USER === response.getAction()) {
			Logger.getResponsesLogger().warn("TestResponseHandler.handle: ",
											 `Response executed for user: ${userName}, `, 
											 "Action: Disabling Component for Specific User");
			
			//TODO: fill in real code for disabling component for specific user
		} else if (RESPONSES.DISABLE_COMPONENT_FOR_ALL_USERS === response.getAction()) {
			Logger.getResponsesLogger().warn("TestResponseHandler.handle: ",
											 `Response executed for user: ${userName}, `, 
											 "Action: Disabling Component for All Users");
			
			//TODO: fill in real code for disabling component for all users
		} else {
			Logger.getResponsesLogger()
					.error(new Error("There has been a request for an action " +
									 "that is not supported by TestResponseHandler." +
									 `The requested action is: ${response.getAction()}`));
		}
		
	}
}

export {TestResponseAnalysisEngine, TestResponseHandler};