import { Logger } from "../../logging/logging.js";
import { ClientApplication, Response, User } from "../core.js";

/** Response actions */
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

/**
 * The ResponseHandler is executed when a {@link Response} needs to be executed. 
 * The ResponseHandler is used by the {@link ClientApplication}, or possibly the server 
 * side in a local configuration.
 */
 interface ResponseHandler {
	
	/**
	 * The handle method is called when a given {@link Response} should be processed. 
	 * It is the responsibility of the handle method to actually execute the intented {@link Response}.
	 * 
	 * @param response {@link Response} object that should be processed
	 */
	handle(response: Response): void;
	
}

/**
 * The UserManager is used by the client application as an interface that must
 * be implemented to handle certain {@link Response} actions. 
 */
 interface UserManager {
	
	/**
	 * Logout the {@link User}
	 * 
	 * @param user User to logout
	 */
	logout(user: User | null | undefined): void;
	
	/**
	 * Disable (lock) the {@link User}
	 * 
	 * @param user User to disable (lock)
	 */
	disable(user: User | null | undefined): void;
	
}

/**
 * No-op user manager that is used most likely in test configurations. 
 * It is possible the response handler could handle these actions 
 * directly, but unlikely. 
 */
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