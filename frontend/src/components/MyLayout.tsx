import * as React from 'react';
import {useState} from 'react';
import {ProLayout} from "@ant-design/pro-layout";
import {
    BarChartOutlined,
    ControlOutlined,
    DashboardOutlined,
    EuroOutlined,
    FileDoneOutlined,
    FileSearchOutlined,
    FormOutlined,
    UserOutlined,
} from "@ant-design/icons";
import {ProSettings} from "@ant-design/pro-components";
import enUS from "antd/es/locale/en_US";
import {Avatar, ConfigProvider, Dropdown} from "antd";
import {Link, Outlet, useLocation} from "react-router-dom";
import {ReactComponent as Logo} from '../assets/dm_logo_long.svg';
import {UserAuth} from "../context/AuthContext";
import {AvatarDropdownMenu} from "./AvatarDropdownMenu";
import {Route} from "@ant-design/pro-layout/es/typing";
import {AppsLogoComponentsAppList} from '@ant-design/pro-layout/es/components/AppsLogoComponents/types';
import {Access} from "./Access";

type Props = {};

export const MyLayout = (props: Props) => {
    const [settings, setSetting] = useState<Partial<ProSettings> | undefined>({
        fixSiderbar: true,
        layout: 'mix',
        splitMenus: true,
    });

    const [num, setNum] = useState(40);
    const location = useLocation();

    const {can, user} = UserAuth();

    let rerouting: AppsLogoComponentsAppList | undefined = []

    // Initialize routes
    let accessibleRoutes: Route = {
        path: '/',
        routes: []
    }

    if (can('read', 'portal::data::customer::finance') && can('read', 'portal::data::customer::performance')) {
        accessibleRoutes.routes.push(
            {
                path: '/reports',
                name: 'Reports',
                icon: <FileSearchOutlined/>,
                routes: [
                    {
                        path: '/reports/performance',
                        name: 'Performance',
                        icon: <BarChartOutlined/>
                    },
                    {
                        path: '/reports/financial',
                        name: 'Financial',
                        icon: <EuroOutlined/>
                    },
                ]
            },
        )

    } else if (can('read', 'portal::data::customer::finance') && !can('read', 'portal::data::customer::performance')) {
        accessibleRoutes.routes.push(
            {
                path: '/reports/financial',
                name: 'Financial Reports',
                icon: <FileSearchOutlined/>,
            },
        )

    } else if (!can('read', 'portal::data::customer::finance') && can('read', 'portal::data::customer::performance')) {
        accessibleRoutes.routes.push(
            {
                path: '/reports/performance',
                name: 'Performance Reports',
                icon: <FileSearchOutlined/>
            },
        )
    } else if (can('read', 'portal::data::manager')) {
        accessibleRoutes.routes.push(
            {
                path: '/fileapproval',
                name: 'File Approval',
                icon: <FileDoneOutlined/>
            },
        )

        rerouting = [
            {
                icon: <></>,
                title: 'RBAC',
                desc: 'Role Based Access Control System',
                url: 'http://localhost:3001/',
                target: '_blank',
            }
        ]

    }

    return (
        <div id="test-pro-layout">
            <ConfigProvider locale={enUS}>

                <ProLayout
                    location={location}
                    menuItemRender={(item: any, defaultDom: any) => {
                        return <Link to={item.path}> {defaultDom} </Link>

                    }}
                    subMenuItemRender={(item: any, defaultDom: any) => <Link to={item.path}> {defaultDom} </Link>}
                    route={accessibleRoutes}
                    appList={
                        rerouting
                    }
                    siderMenuType="group"
                    menu={{
                        collapsedShowGroupTitle: true,
                    }}
                    actionsRender={(props) => {
                        if (props.isMobile) return [];

                        // let avatar: JSX.Element
                        let avatar = <Avatar style={{backgroundColor: '#006d75'}} icon={<UserOutlined/>}/>

                        if (user?.photoURL != null) {
                            avatar = <Avatar src={user?.photoURL}/>
                        }

                        return [
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                marginInlineEnd: 32,
                            }}>
                                <Access accessible={can('read', 'portal::data::customer') || can('read', 'portal::data::manager')} fallback={<></>}>
                                    <Dropdown overlay={<AvatarDropdownMenu/>}>
                                        {avatar}
                                    </Dropdown>
                                </Access>
                            </div>
                        ];
                    }}
                    menuFooterRender={(props) => {
                        if (props?.collapsed) return undefined;
                        return (
                            <div
                                style={{
                                    textAlign: 'center',
                                    paddingBlockStart: 12,
                                }}
                            >
                                <div>© 2023 Digital Minds</div>
                            </div>
                        );
                    }}
                    logo={
                        <Link to="/">
                            <Logo fill='#006d75' width={170}
                                  style={{marginBottom: -20, marginLeft: -20, marginRight: -4}}
                            />
                        </Link>
                    }
                    title={false}
                    // title={'DM Portal'}

                    {...settings}
                >

                    <Outlet/>

                </ProLayout>

            </ConfigProvider>

        </div>
    );
};

