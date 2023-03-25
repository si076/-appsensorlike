import { Response, Utils } from "../../../core/core.js";
import { ResponseHandler, RESPONSES, UserManager } from "../../../core/response/response.js";

class LocalResponseHandler implements ResponseHandler {

	/** Logger */
	// private Logger logger;
	
	// @Inject
	private userManager: UserManager;
	
    constructor(userManager: UserManager) {
        this.userManager = userManager;
    }
	/**
	 * {@inheritDoc}
	 */
	// @Override
	public handle(response: Response) {
        let userName = Utils.getUserName(response.getUser());
		
		if (RESPONSES.LOG === response.getAction()) {
			console.warn("Response executed for user:" + userName + 
					", Action: Increased Logging");
		} else if (RESPONSES.LOGOUT === response.getAction()) {
			console.warn(`Response executed for user ${userName}, `
					+ "Action: Logging out malicious account, delegating to configured user manager "
					+ this.userManager.constructor.name);
			
			this.userManager.logout(response.getUser());
		} else if (RESPONSES.DISABLE_USER === response.getAction()) {
			console.warn(`Response executed for user ${userName}, `
					+ "Action: Disabling malicious account, delegating to configured user manager "
					+ this.userManager.constructor.name);
			
			this.userManager.disable(response.getUser());
		} else if (RESPONSES.DISABLE_COMPONENT_FOR_SPECIFIC_USER === response.getAction()) {
			console.warn("Response executed for user:" + userName + 
					", Action: Disabling Component for Specific User");
			
			//TODO: fill in real code for disabling component for specific user
		} else if (RESPONSES.DISABLE_COMPONENT_FOR_ALL_USERS === response.getAction()) {
			console.warn("Response executed for user:" + userName + 
					", Action: Disabling Component for All Users");
			
			//TODO: fill in real code for disabling component for all users
		} else {
			throw new Error("There has been a request for an action " +
					"that is not supported by this response handler.  The requested action is: " + response.getAction());
		}
		
	}
	
}

export {LocalResponseHandler};