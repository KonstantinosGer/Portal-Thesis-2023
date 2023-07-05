import * as React from 'react';
import {useRef} from 'react';
import {Button, notification, Tooltip} from "antd";
import {ModalForm, ProForm, ProFormDatePicker, ProFormSelect, ProFormText} from '@ant-design/pro-components';
import {EditTwoTone} from "@ant-design/icons";
import type {ActionType} from "@ant-design/pro-components";
import {postRequest} from "../api/postRequest";

type Props = {
    id: string
    customer: string
    type: string
    month: string
    year: string
    // refFilesTable: React.RefObject<ActionType>
    refFilesTable: React.MutableRefObject<ActionType | undefined>
};

const EditFile = (props: Props) => {
    // const StatisticsFilesTableRef = useRef<ActionType>();

    return (
        <ModalForm

            request={async (params) => {
                // return {data: res.data, success: true, total: res.data.length}
                return {
                    customer: props.customer,
                    type: props.type,
                    month: props.month,
                    year: props.year
                };
            }}


            title="Form"
            trigger={<Tooltip title="Edit" color={"#595959"}>
                {/*<SettingTwoTone style={{fontSize: '20px'}}/>*/}
                <Button style={{fontSize: '16px'}} type={"text"} icon={<EditTwoTone />} />
            </Tooltip>}
            autoFocusFirstInput
            // modalProps={{
            //     onCancel: () => console.log('run'),
            // }}
            onFinish={async (values) => {
                try {
                    const res = await postRequest('/api/files/updatefile/' + props.id, values);
                    // console.log(res)
                    // console.log(entity.id)
                    // console.log(values)
                    notification.success({message: 'Success'});
                    props.refFilesTable?.current?.reload()
                } catch (e: any) {
                    notification.error({message: e.response.data.message});
                }
                return true;
            }}
        >

            <ProForm.Group>
                <ProFormText
                    width="md"
                    name="customer"
                    label="Customer name"
                    // tooltip = "up to 24 digits"
                    placeholder="Please enter a name"/>
            </ProForm.Group>
            <ProForm.Group>
                <ProFormSelect
                    request={async () => [
                        {
                            text: 'finance',
                            value: 'finance',
                        },
                        {
                            text: 'performance',
                            value: 'performance',
                        },
                    ]}
                    width="md"
                    name="type"
                    label="Type of report"/>
            </ProForm.Group>
            <ProForm.Group>
                <ProFormDatePicker.Month name="month" id="monthPicker" className="monthPicker"
                                         label="Month of report" fieldProps={{
                    format: 'MM',
                }}/>
                <ProFormDatePicker.Year name="year" label="Year of report"/>
            </ProForm.Group>
        </ModalForm>
    );
};

export default EditFile;