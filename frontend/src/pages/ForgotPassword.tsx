import React from 'react';
import {Button, Card, notification, Row, Typography} from 'antd';
import {ProForm, ProFormText,} from '@ant-design/pro-components';
import {UserAuth} from "../context/AuthContext";
import {useNavigate} from "react-router-dom";

type Props = {};
const {Title} = Typography;


function ForgotPassword(props: Props) {
    const navigate = useNavigate();
    const {forgotPassword} = UserAuth();

    const handleBackToLoginPage = async () => {
        // Navigate to another route
        navigate('/login');
    };

    return (
        <div style={{background: '#f0f0f0', height: "100vh"}}>
            <Row justify={"center"}>
                <Card bordered={false} style={{width: 500, marginTop: "20px"}}>
                    <Row justify={"center"}>
                        <Title level={3} style={{color: "#006d75", marginTop: "6px"}}>Send Reset Password To Your
                            Email</Title>
                    </Row>

                    <Row justify={"center"}>

                        <ProForm
                            initialValues={{remember: true}}
                            style={{paddingBottom: "20px"}}

                            submitter={{
                                searchConfig: {resetText: 'Clear', submitText: 'Send'},
                                submitButtonProps: {style: {backgroundColor: '#006d75'}}
                            }}

                            onFinish={async (value) => {
                                try {
                                    await forgotPassword(value.email);
                                    notification.success({message: 'Reset password email sent successfully!'})

                                } catch (e: any) {
                                    console.log(e.message)
                                    notification.error({message: e.message})
                                }
                            }}
                        >
                            <br/>
                            <ProFormText width="md" name="email" label="Email"
                                         placeholder={"Enter your email"}
                                         rules={[{required: true, message: 'Please enter your email!'}]}/>

                            <Button onClick={handleBackToLoginPage} style={{marginRight: "9px"}}>
                                Back To Login
                            </Button>
                        </ProForm>
                    </Row>
                </Card>
            </Row>
        </div>
    );

}

export default ForgotPassword;