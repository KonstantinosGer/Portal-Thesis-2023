import React, {Component} from "react";
import {Button, Layout, notification, Row, Space} from "antd";
import {postRequest} from "../api/postRequest";
import { Typography } from 'antd';
import {Content} from "antd/es/layout/layout";
import {PageContainer} from '@ant-design/pro-components';

const { Text, Title } = Typography;

export class UserSettings extends Component {

    async changePassword() {
        try {
            const res = await postRequest('/api/customers/changepassword')
            let link = res.data
            window.location = link
        } catch (e: any) {
            notification.error({message: e.response.data.message})
        }
    }

    render() {
        return (
            <PageContainer>

                <Layout>
                    <Content style={{padding: 10}}>
                        <Row>
                            <Title level={4}>Change Password</Title>
                        </Row>
                        <Row>
                            <Space>
                                <Text type="secondary">Click here to change your password:</Text>

                                <Button type="primary" htmlType="submit" onClick={() => this.changePassword()}>
                                    Change Password
                                </Button>
                            </Space>
                        </Row>
                    </Content>
                </Layout>

            </PageContainer>
        );
    }

}