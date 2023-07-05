import {useContext} from 'react';
import React from "react";
import { Navigate } from 'react-router-dom';
import {AuthorizerContext} from "../../App";

export interface IAuthorizedRouteProps {
    action: string
    resource: string
}

const AuthorizedRoute: React.FunctionComponent<IAuthorizedRouteProps> = (props) => {
    const {children} = props;
    const {action} = props;
    const {resource} = props;
    // let history = useHistory();

    const authorizer = useContext(AuthorizerContext)
    // console.log(authorizer)
    // authorizer?.disp()
    const hasAccessGranted = authorizer?.can(action, resource)
    // console.log('can', action, ' ', resource, ':', hasAccessGranted)

    if (hasAccessGranted) {
        // console.log('Granted access');
        return <>{children}</>
    } else {
        // console.log('Could not grant access');
        return <Navigate to="/unauthorized" replace state={{ path: location.pathname }}/>;
        // history.push("/unauthorized");
        // return null
    }

};

export default AuthorizedRoute;
