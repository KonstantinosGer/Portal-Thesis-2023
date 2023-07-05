import {Button, Menu, Modal, notification} from "antd";
import {EditOutlined, LogoutOutlined} from "@ant-design/icons";
import * as React from "react";
import {useState} from "react";
import {useNavigate} from "react-router-dom";
import {UserAuth} from "../context/AuthContext";
import {postRequest} from "../api/postRequest";
import {Access} from "./Access";
import {ItemType} from "antd/es/menu/hooks/useItems";

export const AvatarDropdownMenu = () => {

    const {can, user, logout} = UserAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
            console.log('You are logged out')
        } catch (err: any) {
            //TODO handle error
            console.log(err.message);
        }
    };

    const [isModalOpen, setIsModalOpen] = useState(false);

    const showModal = () => {
        setIsModalOpen(true);
    };

    const handleCancel = () => {
        setIsModalOpen(false);
    };

    const changePassword = async () => {
        try {
            const res = await postRequest('/api/customers/changepassword')
            let link = res.data
            window.location = link

            setIsModalOpen(false);
        } catch (e: any) {
            notification.error({message: e.response.data.message})
        }
    };

    // Initialize items
    let itemGroup: ItemType[] | undefined = []

    if (can('read', 'portal::data::customer')) {
        itemGroup.push(
            {
                key: 'user.name',
                label: user?.displayName,
                style: {pointerEvents: "none"}
            },
            {
                key: 'user.email',
                label: user?.email,
                style: {pointerEvents: "none", color: '#9d9a9a', fontSize: 14}
            },
            {
                type: "divider"
            },
            {
                key: 'password',
                icon: <EditOutlined/>,
                label: 'Change Password',
                onClick: showModal
            },
            {
                type: 'divider' as const,
            },
            {
                key: 'logout',
                icon: <LogoutOutlined/>,
                label: 'Logout',
                onClick: handleLogout
            },
        )
    } else if (can('read', 'portal::data::manager')) {
        itemGroup.push(
            {
                key: 'user.name',
                label: user?.displayName,
                style: {pointerEvents: "none"}
            },
            {
                key: 'user.email',
                label: user?.email,
                style: {pointerEvents: "none", color: '#9d9a9a', fontSize: 14}
            },
            {
                type: 'divider' as const,
            },
            {
                key: 'logout',
                icon: <LogoutOutlined/>,
                label: 'Logout',
                onClick: handleLogout
            },
        )
    }


    return <>
        <Modal title="Change Password" open={isModalOpen}
               onCancel={handleCancel}
               footer={[
                   <Button key="back" onClick={handleCancel}>
                       Cancel
                   </Button>,
                   <Button type="primary" onClick={changePassword}>
                       Change Password
                   </Button>,
               ]}
        >
                    <p>Click here to change your password</p>
        </Modal>

        <Menu items={itemGroup}/>
    </>
}