import React, {useEffect, useState} from 'react';
import {LockOutlined, UserOutlined} from '@ant-design/icons';
import {LoginFormPage, ProFormText,} from '@ant-design/pro-components';
import {Button, Divider, notification, Tabs, Typography} from 'antd';
import {ReactComponent as Logo} from '../assets/dm_logo_long.svg';
import {useLocation, useNavigate} from "react-router-dom";
import {UserAuth} from "../context/AuthContext";
import "./UserLoginStyle.css";

type Props = {};

type LoginType = 'phone' | 'account';

type LoginUserCredentials = {
    email: string,
    password: string
}


export function UserLogin(props: Props) {

    const [loginType, setLoginType] = useState<LoginType>('account');
    const [authenticating, setAuthenticating] = useState<boolean>(false);
    const [error, setError] = useState<string | undefined>(undefined);
    const navigate = useNavigate();
    const location = useLocation();

    const {signInWithGoogle, signInEmailPassword, user} = UserAuth();

    const handleEmailPasswordSignIn = async ({email, password}: LoginUserCredentials) => {
        if (authenticating) return

        setAuthenticating(true)
        setError(undefined)
        // setError('')
        try {
            await signInEmailPassword(email, password)
            const origin = location.state?.from?.pathname || '/';
            navigate(origin);
        } catch (e: any) {
            // setError(e.message)
            // console.log(e.message)
            //TODO handle error
            if (e.code == 'auth/wrong-password') {
                setError('The password is invalid or the user does not have a password.')
            } else if (e.code == 'auth/too-many-requests') {
                setError('Access to this account has been temporarily disabled due to many failed login attempts. You can immediately restore it by resetting your password or you can try again later.')
            } else if ('auth/invalid-email') {
                setError('The email address is badly formatted.')
            } else if ('auth/user-not-found') {
                setError('No user found with this email.')
            } else {
                console.log({e})
                setAuthenticating(false)
                notification.error({message: 'Could not login.'})
            }
        }
        setAuthenticating(false)
    };

    const handleGoogleSignIn = async () => {
        if (authenticating) return

        setAuthenticating(true)
        try {
            await signInWithGoogle();
            const origin = location.state?.from?.pathname || '/';
            navigate(origin);

        } catch (e) {
            //TODO handle error
            console.log(e);
            notification.error({message: 'Could not login.'})
            setAuthenticating(false)
        }
        setAuthenticating(false)
    };

    const handleForgotPassword = async () => {
        // Navigate to another route
        navigate('/forgot-password');
    };

    useEffect(() => {
        if (user != null) {
            // console.log(location.state)
            const origin = location.state?.from?.pathname || '/';
            navigate(origin);
        }
    }, [user]);

    return (
        // <div style={{backgroundColor: 'white', height: 'calc(100vh - 48px)', margin: 0}}>
        <div style={{backgroundColor: '#fafafa', minHeight: "100vh"}}>
            <LoginFormPage
                backgroundImageUrl="https://gw.alipayobjects.com/zos/rmsportal/FfdJeJRQWjEeGTpqgBKj.png"
                // style={{backgroundSize: "100vh"}}
                onFinish={async (formData: LoginUserCredentials) => handleEmailPasswordSignIn(formData)}
                logo={<Logo fill='#006d75'
                            style={{width: 400, height: 200, marginTop: -70, marginLeft: -170}}/>}

                submitter={{submitButtonProps: {style: {width: '100%', backgroundColor: '#006d75'}}}}

                actions={
                    // <div style={{marginTop: -42}}> TODO fix empty margin when logging out !!
                    <div>
                        <Button
                            type={"link"}
                            style={{
                                pointerEvents: authenticating ? 'none' : 'auto',
                                color: '#8c8c8c',
                                marginTop: "8px"
                            }}
                            // style={{pointerEvents: authenticating ? 'none' : 'auto'}}
                            disabled={authenticating}
                            onClick={handleForgotPassword}
                        >Forgot Password?</Button>
                        <br/><br/>
                        <Divider plain>
                            {/*<Divider plain={false}  >*/}
                            <span style={{color: '#CCC', fontWeight: 'normal', fontSize: 14}}>Other login methods</span>
                        </Divider>

                        <Button
                            type={"link"}
                            style={{pointerEvents: authenticating ? 'none' : 'auto'}}
                            disabled={authenticating}
                            onClick={handleGoogleSignIn}
                        >Sign in as Digital Minds manager</Button>
                    </div>
                }
            >
                <br/>
                <Tabs
                    centered
                    activeKey={loginType}
                    onChange={(activeKey) => setLoginType(activeKey as LoginType)}
                >
                    <Tabs.TabPane key={'account'} tab={'Sign in with Email and Password'}/>
                </Tabs>


                <ProFormText
                    name="email"
                    placeholder={"Enter your email"}
                    fieldProps={{
                        size: 'large',
                        prefix: <UserOutlined className={'prefixIcon'}/>,
                    }}
                    rules={[
                        {
                            required: true,
                        },
                    ]}
                />

                <ProFormText.Password
                    name="password"
                    placeholder={"Enter your password"}
                    fieldProps={{
                        size: 'large',
                        prefix: <LockOutlined className={'prefixIcon'}/>,
                    }}
                    rules={[
                        {
                            required: true,
                        },
                    ]}
                />

                <div
                    style={{
                        marginBlockEnd: 24,
                    }}
                >
                    {error && (
                        <Typography.Text type={'danger'}>{error}</Typography.Text>
                    )}
                </div>
            </LoginFormPage>
        </div>
    );


}