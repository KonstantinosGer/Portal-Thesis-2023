import {Link} from "react-router-dom";
import {Button, Result} from 'antd';
import React from 'react';

type Props = {
    message?: string
};

const UnauthorizedPage = (props: Props) => (
    <Result
        status="403"
        title="403"
        subTitle={props.message || "Sorry, you are not authorized to access this page."}
        extra={
            <Link to={'/login'}>
                <Button type="primary">
                    Go Back
                </Button>
            </Link>
        }
    />
);

export default UnauthorizedPage;
