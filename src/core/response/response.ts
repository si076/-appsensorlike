import { Logger } from "../../logging/logging.js";
import { Response, User } from "../core.js";

enum RESPONSES {
	/** provide increased logging for this specific user */
	LOG  = "log",
	/** logout this specific user */
	LOGOUT = "logout", 
	/** disable this specific user */
	DISABLE_USER = "disableUser",
	/** disable a component for this specific user */
	DISABLE_COMPONENT_FOR_SPECIFIC_USER = "disableComponentForSpecificUser",
	/** disable a component for all users */
	DISABLE_COMPONENT_FOR_ALL_USERS = "disableComponentForAllUsers",

}

interface ResponseHandler {
	

	/**
	 * The handle method is called when a given {@link org.owasp.appsensor.core.Response} should be processed. 
	 * It is the responsibility of the handle method to actually execute the intented {@link org.owasp.appsensor.core.Response}.
	 * 
	 * @param response {@link org.owasp.appsensor.core.Response} object that should be processed
	 */
	handle(response: Response): void;
	
}

interface UserManager {
	
	/**
	 * Logout the {@link org.owasp.appsensor.core.User}
	 * 
	 * @param user User to logout
	 */
	logout(user: User | null | undefined): void;
	
	/**
	 * Disable (lock) the {@link org.owasp.appsensor.core.User}
	 * 
	 * @param user User to disable (lock)
	 */
	disable(user: User | null | undefined): void;
	
}

class NoopUserManager implements UserManager {

	/**
	 * {@inheritDoc}
	 */
	public logout(user: User): void {
        Logger.getClientLogger().trace("NoopUserManager.logout:", "The no-op user manager did not logout the user as requested.");
	}

	/**
	 * {@inheritDoc}
	 */
	public disable(user: User): void {
        Logger.getClientLogger().trace("NoopUserManager.disable:", "The no-op user manager did not disable the user as requested.");
	}

}

export {RESPONSES, ResponseHandler, UserManager, NoopUserManager};