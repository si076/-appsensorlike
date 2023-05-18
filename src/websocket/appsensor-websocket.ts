
class AccessDeniedError extends Error {
    constructor(message: string = "Access denied") {
        super(message);
    }
}

class UnAuthorizedActionError extends Error {
    constructor(actionName: string) {
        super(`Unauthorized action ${actionName}`);
    }
}

interface IActionRequest {
    id: string;
    actionName: string;
    parameters?: {
        [propertyName: string]: string | Object;
    }

}

interface IActionResponse {
    id: string;
    actionName: string;
    result: number | Object | null | string;
    error?: string;
}

class ActionRequest implements IActionRequest {
    id: string;
    actionName: string;
    parameters?: { [propertyName: string]: string | Object; };

    constructor(id: string, actionName: string, parameters?: { [propertyName: string]: string | Object; }) {
        this.id = id;
        this.actionName = actionName;
        this.parameters = parameters;
    }
}

class ActionResponse implements IActionResponse {
    id: string;
    actionName: string;
    result: number | Object | null | string;
    resultElementClass: string | null;
    error?: string;
    accessDenied: boolean;
    unauthorizedAction: boolean;

    constructor(id: string, 
                actionName: string, 
                result: number | Object | null | string,
                resultElementClass: string | null,
                error?: string,
                accessDenied: boolean = false,
                unauthorizedAction: boolean = false ) {
        this.id = id;
        this.actionName = actionName;
        this.result = result;
        this.resultElementClass = resultElementClass;
        this.error = error;
        this.accessDenied = accessDenied;
        this.unauthorizedAction = unauthorizedAction;
    }
}

export {ActionRequest, ActionResponse, AccessDeniedError, UnAuthorizedActionError};