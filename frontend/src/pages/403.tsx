import {useNavigate} from "react-router-dom";
import {Button, Result} from 'antd';
import React from 'react';
import {UserAuth} from "../context/AuthContext";

type Props = {
    message?: string
};

function UnauthorizedPage(props: Props) {
    const navigate = useNavigate();
    const {logout} = UserAuth();
    const {permissions} = UserAuth();

    const handleGoBack = async () => {
        try {
            // If user has no permissions, logout first, so you can navigate to Login Page when "Go Back" is pressed
            if (permissions.length == 0) {
                await logout();
            }
            navigate('/');
        } catch (err: any) {
            console.log(err.message);
        }
    };

    return (
        <Result
            status="403"
            title="403"
            subTitle={props.message || "Sorry, you are not authorized to access this page."}
            extra={
                <Button onClick={handleGoBack} type="primary">
                    Go Back
                </Button>
            }
        />
    );

}

export default UnauthorizedPage;
