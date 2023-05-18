import { AccessController, Action, Context } from "../../core/accesscontrol/accesscontrol";
import { ClientApplication } from "../../core/core";

class NotAuthorizedException extends Error {
    constructor(message: string) {
        super(message);
    }
}

/**
 * This particular {@link AccessController} implementation simply checks the {@link ClientApplication}s 
 * role(s) to see if it matches the expected {@link Action}. If there is a match found, 
 * then the access is considered valid.
 * 
 */
class ReferenceAccessController implements AccessController {
     
     
     /**
      * {@inheritDoc}
      */
     public isAuthorized(clientApplication: ClientApplication, action: Action, context: Context): boolean {
         let authorized = false;
 
        for (const role of clientApplication.getRoles()) {
            
            //simple check to make sure that 
            //the value of the action matches the value of one of the roles (exact match)
            if (role.toString() === action.toString()) {
                authorized = true; 
                break;
            }
        }
         
         return authorized;
     }
     
     /**
      * {@inheritDoc}
      */
     public assertAuthorized(clientApplication: ClientApplication, action: Action, context: Context): void {
         if (! this.isAuthorized(clientApplication, action, context)) {
             throw new NotAuthorizedException("Access is not allowed for client application: " + clientApplication + 
                                              " when trying to perform action : " + action + 
                                              " using context: " + context);
         }
     }
     
 }

 export {ReferenceAccessController};