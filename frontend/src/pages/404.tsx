import {Link} from "react-router-dom";
import {Button, Result} from 'antd';
import React from 'react';

const NoFoundPage: React.FC = () => (
    <Result
        status="404"
        title="404"
        subTitle="Sorry, the page you visited does not exist."
        extra={
            <Link to={'/login'}>
                <Button type="primary">
                    Go Back
                </Button>
            </Link>
        }
    />
);

export default NoFoundPage;
