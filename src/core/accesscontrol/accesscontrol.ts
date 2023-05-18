import { ClientApplication } from "../core.js";

enum Action {
	UNKNOWN = "UNKNOWN",
	ADD_EVENT = "ADD_EVENT",
	ADD_ATTACK = "ADD_ATTACK",
	GET_RESPONSES = "GET_RESPONSES",
	EXECUTE_REPORT = "EXECUTE_REPORT"
}

enum Role { 
	ADD_EVENT = "ADD_EVENT",
	ADD_ATTACK = "ADD_ATTACK",
	GET_RESPONSES = "GET_RESPONSES",
	EXECUTE_REPORT = "EXECUTE_REPORT"
}

class Context {
}

interface AccessController {

	isAuthorized(clientApplication: ClientApplication, action: Action, context: Context): boolean;
	
	assertAuthorized(clientApplication: ClientApplication, action: Action, context: Context): void;
	
}

export {Action, Role, Context, AccessController};