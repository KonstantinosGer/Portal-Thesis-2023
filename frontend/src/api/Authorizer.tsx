import {postRequestRBAC} from "./postRequestRBAC";

class Authorizer {
    //fields
    user?: string;
    permissions?: string[][];

    //function
    disp(): void {
        if (!this.user)
            console.log("No user selected")

        console.log("User is  :   " + this.user)
        console.log("Permissions are  :   " + this.permissions)
    }

    can(action: string, object: string): boolean {

        if (!this.permissions)
            return false

        for (const permission of this.permissions) {
            const permRole = permission[0]
            const permObject = permission[1]
            const permAction = permission[2]
            if (permAction == action && permObject == object)
                return true
        }

        return false

    }
}

// const authorizer = new Authorizer()

export default Authorizer