import { ClientApplication } from "../core.js";

/**
 * This enum gives the options of the types of actions that can be 
 * performed and for which access control needs to be considered.
 * 
 * This works in conjunction with the {@link AccessController}.
 */
 enum Action {
	UNKNOWN = "UNKNOWN",
	ADD_EVENT = "ADD_EVENT",
	ADD_ATTACK = "ADD_ATTACK",
	GET_RESPONSES = "GET_RESPONSES",
	EXECUTE_REPORT = "EXECUTE_REPORT",
	//ADDITION TO THE ORIGINAL
	FIND_EVENTS = "FIND_EVENTS",
	FIND_ATTACKS = "FIND_ATTACKS",
}

/**
 * Role is the standard attribution of an access to be used by the {@link AccessController} 
 * to determine {@link ClientApplication} access to the different pieces of functionality.
 */
 enum Role { 
	ADD_EVENT = "ADD_EVENT",
	ADD_ATTACK = "ADD_ATTACK",
	GET_RESPONSES = "GET_RESPONSES",
	EXECUTE_REPORT = "EXECUTE_REPORT"
}

/**
 * This class is intended to represent the "context" portion of 
 * a context-based {@link AccessController} . Conceptually, you would add 
 * attributes that you would like to evaluate to this object. 
 * Normal examples might include things like timestamps, geolocation, etc.
 */
 class Context {
}

/**
 * This interface is meant to gate access to the different {@link Action} 
 * that can be performed to ensure a {@link ClientApplication} has appropriate permissions.
 */
 interface AccessController {

	isAuthorized(clientApplication: ClientApplication, action: Action, context: Context): boolean;
	
	assertAuthorized(clientApplication: ClientApplication, action: Action, context: Context): void;
	
}

export {Action, Role, Context, AccessController};