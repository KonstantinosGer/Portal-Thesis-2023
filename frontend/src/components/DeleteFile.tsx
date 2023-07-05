import * as React from 'react';
import {useRef} from 'react';
import {Button, Tooltip} from "antd";
import {ModalForm} from '@ant-design/pro-components';
import {DeleteOutlined} from "@ant-design/icons";
import type {ActionType} from "@ant-design/pro-components";
import {postRequest} from "../api/postRequest";

type Props = {
    id: string
    name: string
    // refFilesTable: React.RefObject<ActionType>
    refFilesTable: React.MutableRefObject<ActionType | undefined>
};

const DeleteFile = (props: Props) => {
    // const StatisticsFilesTableRef = useRef<ActionType>();

    return (
        <ModalForm
            width={400}
            title={"Delete File"}
            trigger={
                <Tooltip title="Delete" color={"#595959"}>
                    <Button style={{fontSize: '16px'}} type={"text"} icon={<DeleteOutlined/>} danger/>
                </Tooltip>
            }
            submitter={{submitButtonProps: {danger: true}}}
            autoFocusFirstInput
            modalProps={{
                destroyOnClose: true,
                okText: 'Delete',
                cancelText: 'No'
            }}
            onFinish={async (values) => {

                return postRequest(`/api/reports/delete/${props.id}`,{
                    name: props.name
                })
                    .then(res => {
                        props.refFilesTable?.current?.reload()

                        return true
                    }).catch(reason => false)

            }}
        >
            Are you sure you want to delete this file?
        </ModalForm>
    );
};

export default DeleteFile;