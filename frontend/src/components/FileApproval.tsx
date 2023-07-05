import React, {useRef, useState} from "react";
import {postRequest} from '../api/postRequest';
import {Button, Checkbox, Col, ConfigProvider, Modal, notification, Row, Space, Switch, Tag, Tooltip} from 'antd';
import {ActionType, PageContainer, ProColumns, ProForm, ProFormDateRangePicker} from '@ant-design/pro-components';
import {ProTable} from '@ant-design/pro-table';
import enUSIntl from "antd/es/locale/en_US";
import {
    CheckOutlined,
    ClockCircleOutlined,
    CloseOutlined,
    FileExcelTwoTone,
    FilePdfTwoTone,
    FilePptTwoTone,
    FileTextOutlined,
    FileTwoTone,
    MailOutlined
} from '@ant-design/icons';
import dayjs from "dayjs";
import axiosApiInstance from "../api/axiosClientPortal";
import DeleteFile from "./DeleteFile";
import EditFile from "./EditFile";
import {ReactComponent as GoogleDriveLogo} from '../../src/assets/google_drive_icon.svg';
import {CheckboxChangeEvent} from "antd/es/checkbox";

type Props = {};


const GOOGLE_SPREADSHEET_MIME_TYPE = "application/vnd.google-apps.spreadsheet"
const PPT_FILE_MIME_TYPE = "application/vnd.ms-powerpoint"
const PPTX_FILE_MIME_TYPE = "application/vnd.openxmlformats-officedocument.presentationml.presentation"

const GOOGLE_SLIDE_MIME_TYPE = "application/vnd.google-apps.presentation"
const XLS_FILE_MIME_TYPE = "application/vnd.ms-excel"
const XLSX_FILE_MIME_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
const CSV_FILE_MIME_TYPE = "text/csv"

const PDF_FILE_MIME_TYPE = "application/pdf"

type DataSourceType = {
    id: string,
    name: string
    type: string
    creation_date: string
    url: string
    mime_type: string
    approved: boolean
    date: string
    customer: string
    customer_id: string
};

interface FilterDateType {
    startDate: string
    endDate: string
}

const FileApproval = (props: Props) => {
    const currDate = new Date();

    //
    // Initialize State
    //
    const [syncing, setSyncing] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [enableDatePicker, setEnableDatePicker] = useState<boolean>(false);
    const [triggerEnableDatePicker, setTriggerEnableDatePicker] = useState<boolean>(false);
    const refFilesTable = useRef<ActionType>();
    const [search, setSearch] = useState<string>('');

    //
    //Filters
    //
    //Customer
    // Parameter "filterCustomer" is of type "{text: string, value: string}[]", which is an array of "{text: string, value: string}" things
    const [filterCustomer, setFilterCustomer] = useState<{ text: string, value: string }[]>([]);
    //Customer id
    const [filterCustomerId, setFilterCustomerId] = useState<{ text: string, value: string }[]>([]);
    //Type
    const [filterType, setFilterType] = useState<{ text: string, value: string }[]>([]);
    //Date
    const [tmpFilterDate, setTmpFilterDate] = useState<FilterDateType>({
        startDate: currDate.getFullYear() - 1 + '-' + (currDate.getMonth() + 1 < 10 ? '0' : '') + (currDate.getMonth() + 1) + '-01',
        endDate: currDate.getFullYear() + '-' + (currDate.getMonth() + 1 < 10 ? '0' : '') + (currDate.getMonth() + 1) + '-01',
    });
    const [filterDate, setFilterDate] = useState<FilterDateType>({
        startDate: currDate.getFullYear() - 1 + '-' + (currDate.getMonth() + 1 < 10 ? '0' : '') + (currDate.getMonth() + 1) + '-01',
        endDate: currDate.getFullYear() + '-' + (currDate.getMonth() + 1 < 10 ? '0' : '') + (currDate.getMonth() + 1) + '-01',
    });
    //Approved
    const [filterApproved, setFilterApproved] = useState<{ text: string, value: string }[]>([]);


    //
    // Methods
    //
    const onToggleApproved = async (fileId: string, checked: boolean) => {
        try {
            const res = await postRequest('/api/files/updateapprovedstate/' + fileId, {
                approvedChanged: checked
            })
            notification.success({message: 'Success'})

            //Refresh
            if (!checked) {
                refFilesTable.current?.reload()
            }
        } catch (e: any) {
            notification.error({message: e.response.data.message})
        }
    }


    const onUpdateFilesCache = async () => {
        try {
            setSyncing(true)
            notification.info({message: 'Started update'})
            const res = await postRequest('/api/files/updatefilescache')
            notification.success({message: 'Successfully updated', duration: 0})
            setSyncing(false)

            //Refresh
            refFilesTable.current?.reload()
        } catch (e: any) {
            notification.error({message: e.response.data.message})
        }
    }

    const getFilters = (dataSource: DataSourceType[]) => {
        //Customer Filter
        setFilterCustomer(getUniqueValues('customer', dataSource))
        //Customer Id Filter
        setFilterCustomerId(getUniqueValues('customer_id', dataSource))
        //Type Filter
        setFilterType(getUniqueValues('type', dataSource))
        //Approved Filter
        setFilterApproved(getUniqueValues('approved', dataSource))
    }

    const getUniqueValues = (field: string, dataSource: DataSourceType[]): { text: string; value: string; }[] => {
        let distinct = Array.from(
            new Set<string>(dataSource.map((record: any) => record[field])).values()
        ).sort();

        let filters: { text: string; value: string; }[] = [];

        if (field == 'approved') {
            distinct.forEach((item) => {
                var formattedApproved = "";
                if (item.toString() == "true") {
                    formattedApproved = "Approved"
                } else if (item.toString() == "false") {
                    formattedApproved = "Not Approved"
                }
                filters.push({text: formattedApproved, value: item});
            });
        } else {
            distinct.forEach((item) => {
                filters.push({text: item, value: item});
            });
        }

        return filters;
    }


    // Here lies render() method


    // Since the date strings are in the format 'YYYY-MM',
    // a direct string comparison works because the dates are in a format that allows lexicographical ordering.
    const compareByDate = (a: { date: string }, b: { date: string }) => {
        if (a.date < b.date) {
            return -1;
        }
        if (a.date > b.date) {
            return 1;
        }
        return 0;
    };

    const onEnableDateFiltering = (e: CheckboxChangeEvent) => {
        setEnableDatePicker(e.target.checked)

        if (!(e.target.checked)) {
            setTriggerEnableDatePicker(e.target.checked)
        }
    };

    //
    //Initialize Columns
    //
    const columns: ProColumns<DataSourceType> [] = [
        {
            title: 'Name', dataIndex: 'name', editable: false, width: '30%', ellipsis: true,
            render: (dom, entity) => {
                return <a href={entity.url} target={"_blank"} style={{color: "black"}}>{entity.name}</a>
            }
        },

        {
            title: 'Customer', dataIndex: 'customer', editable: false, align: "center", width: '11%', ellipsis: true,
            //Filtering column
            filters: filterCustomer,
            // specify the condition of filtering result
            // here is that finding the name started with `value`
            onFilter: (value, record) => record.customer === value,
        },

        {
            title: 'Customer Id', dataIndex: 'customer_id', editable: false, align: "center", width: '9%',
            //Filtering column
            filters: filterCustomerId,
            // specify the condition of filtering result
            // here is that finding customer's id that starts with `value`
            onFilter: (value, record) => record.customer_id === value,
        },

        {
            title: 'Type',
            dataIndex: 'type',
            editable: false,
            align: "center",
            width: '10%',
            render: (dom, entity) => {
                if (entity.type == "finance") {
                    //Color:  Dark Spring Green
                    return <Tag color={"#1D6F42"}>{entity.type}</Tag>
                } else if (entity.type == "performance") {
                    //Color: Plochere's Vermilion
                    return <Tag color={"#D04423"}>{entity.type}</Tag>
                } else {
                    return <Tag color={"#A4B9CE"}>{entity.type}</Tag>
                }
            },
            //Filtering column
            filters: filterType,
            // specify the condition of filtering result
            // here is that finding the name started with `value`
            onFilter: (value, record) => record.type === value

        },

        {
            title: 'Date', dataIndex: 'date', editable: false, align: "center", width: '9%',

            render: (dom, entity) => {
                if (entity.date.includes('unknown')) {
                    // return entity.date
                    return "unknown"
                } else {
                    // var formattedDate = dayjs(entity.date.padStart(2, '0'), 'MM').format('MMMM');
                    var formattedDate = dayjs(entity.date, 'YYYY-MM').format('MMMM YYYY');
                    return formattedDate
                }


                return entity.date
            },

            //Sorting column
            sorter: (a, b) => compareByDate(a, b)

        },

        {
            title: 'Creation Date',
            dataIndex: 'creation_date',
            editable: false,
            align: "center",
            width: '9%',
            defaultSortOrder: 'descend',
            sorter: (a, b) => {
                //
                //Sorting column
                //
                //Compare two dates to sort antd's pro table
                var first_date = dayjs(a.creation_date, "DD/MM/YYYY").toDate()
                var second_date = dayjs(b.creation_date, "DD/MM/YYYY").toDate()

                if (first_date > second_date) {
                    return 1
                } else if (first_date < second_date) {
                    return -1
                } else {
                    return 0
                }
            }
        },

        {
            title: 'File Type',
            dataIndex: 'extension',
            editable: false,
            align: "center",
            width: '7%',
            render: (dom, entity) => {
                if (entity.mime_type == GOOGLE_SLIDE_MIME_TYPE || entity.mime_type == PPT_FILE_MIME_TYPE || entity.mime_type == PPTX_FILE_MIME_TYPE) {
                    //Color: Plochere's Vermilion
                    return <a href={entity.url} target={"_blank"}><FilePptTwoTone twoToneColor={"#D04423"}
                                                                                  style={{fontSize: '26px'}}/></a>
                } else if (entity.mime_type == GOOGLE_SPREADSHEET_MIME_TYPE || entity.mime_type == XLS_FILE_MIME_TYPE || entity.mime_type == XLSX_FILE_MIME_TYPE || entity.mime_type == CSV_FILE_MIME_TYPE) {
                    //Color:  Dark Spring Green
                    return <a href={entity.url} target={"_blank"}><FileExcelTwoTone twoToneColor={"#1D6F42"}
                                                                                    style={{fontSize: '26px'}}/></a>
                } else if (entity.mime_type == PDF_FILE_MIME_TYPE) {
                    //Color: Candy Apple Red
                    return <a href={entity.url} target={"_blank"}><FilePdfTwoTone twoToneColor={"#F40F02"}
                                                                                  style={{fontSize: '26px'}}/></a>
                } else {
                    //Color: #A9A9A9
                    return <a href={entity.url} target={"_blank"}><FileTwoTone twoToneColor={"#A9A9B9"}
                                                                               style={{fontSize: '26px'}}/></a> //twoToneColor={""}
                }
            }
        },

        {
            title: 'Approved',
            dataIndex: 'approved',
            valueType: 'switch',
            align: "center",
            width: '7%',

            //Filtering column
            filters: filterApproved,
            // specify the condition of filtering result
            // here is that finding the name started with `value`
            onFilter: (value, record) => record.approved === value,

            render: ((dom, entity, index) => {
                    return <Switch checked={entity.approved} onChange={checked => {
                        onToggleApproved(entity.id, checked)

                        if (checked) {

                            Modal.confirm({
                                title: 'Notify customer via email?',
                                icon: <MailOutlined/>,
                                // type: "success",
                                // content: 'Bla bla ...',
                                okText: "Yes",
                                cancelText: "No",
                                onCancel: () => {
                                    refFilesTable.current?.reload()
                                },
                                onOk: async () => {
                                    try {
                                        const res = await postRequest('/api/files/sendemail/' + entity.id)

                                        notification.success({message: 'Email sent successfully!'})
                                        refFilesTable.current?.reload()
                                    } catch (e: any) {
                                        notification.error({message: e.response.data.message})
                                        refFilesTable.current?.reload()
                                    }
                                }
                            });

                        }
                    }} checkedChildren={<CheckOutlined/>} unCheckedChildren={<CloseOutlined/>}/>
                }
            )
        },

        {
            title: '',
            dataIndex: 'edit',
            editable: false,
            align: "center",
            width: '8%',
            render: (dom, entity) => {
                return <Row justify={"space-around"}>
                    <Col span={8}>
                        <Tooltip title="Open in Google Drive" color={"#595959"}>
                            <Button href={entity.url} target={"_blank"} type={"text"}
                                    icon={<GoogleDriveLogo fontStretch={"true"}
                                                           style={{width: '17px', paddingTop: '5px'}}/>}
                            />
                        </Tooltip>
                    </Col>

                    <Col span={8}>
                        <EditFile id={entity.id}
                                  customer={entity.customer}
                                  type={entity.type}
                                  month={entity.date.split('-')[1]}
                                  year={entity.date.split('-')[0]}
                                  refFilesTable={refFilesTable}
                        />
                    </Col>

                    <Col span={8}>
                        <DeleteFile id={entity.id}
                                    name={entity.name}
                                    refFilesTable={refFilesTable}
                        />
                    </Col>
                </Row>
            }
        },
    ];

    return (
        <PageContainer>
            <Row justify={"space-between"}>

                <Col span={20}>
                    <ProForm<FilterDateType> layout={"inline"}

                                             onValuesChange={(changedValues, values) => {

                                                 setTmpFilterDate((prevFilters) => ({
                                                     ...prevFilters, ...changedValues
                                                 }));

                                             }}

                                             initialValues={{
                                                 startDate: currDate.getFullYear() - 1 + '-' + (currDate.getMonth() + 1 < 10 ? '0' : '') + (currDate.getMonth() + 1) + '-01',
                                                 endDate: currDate.getFullYear() + '-' + (currDate.getMonth() + 1 < 10 ? '0' : '') + (currDate.getMonth() + 1) + '-01',
                                             }}

                                             submitter={{
                                                 resetButtonProps: false,
                                                 submitButtonProps: {
                                                     style: {marginLeft: 8},
                                                     disabled: isLoading || syncing || !enableDatePicker,
                                                 },
                                             }}

                                             onFinish={async () => {
                                                 setFilterDate(tmpFilterDate)
                                                 setTriggerEnableDatePicker(enableDatePicker)
                                             }}
                    >


                        <Space align={"baseline"}>
                            <Checkbox onChange={onEnableDateFiltering} disabled={isLoading || syncing}>Filter by
                                Date</Checkbox>

                            <ProFormDateRangePicker
                                width='md'
                                name='monthRange'
                                initialValue={[currDate.getFullYear() - 1 + '-' + (currDate.getMonth() + 1 < 10 ? '0' : '') + (currDate.getMonth() + 1) + '-01', currDate.getFullYear() + '-' + (currDate.getMonth() + 1 < 10 ? '0' : '') + (currDate.getMonth() + 1) + '-01']}
                                fieldProps={{
                                    format: 'YYYY-MM',
                                    picker: 'month',
                                    placeholder: ['Start month', 'End month'],
                                    value: [dayjs(tmpFilterDate.startDate, 'YYYY-MM'), dayjs(tmpFilterDate.endDate, 'YYYY-MM')],
                                    disabled: isLoading || syncing || !enableDatePicker,
                                }}
                                transform={(values: string[]) => {
                                    return {
                                        startDate: values[0].substring(0, 7) + '-01' || undefined,
                                        endDate: values[1].substring(0, 7) + '-01' || undefined,
                                    };
                                }}
                                style={{flex: 1}}
                            />
                        </Space>


                    </ProForm>

                </Col>


                <Col span={4}>
                    <Button icon={<ClockCircleOutlined/>} disabled={isLoading || syncing} onClick={() => {
                        //Refresh table's data from google drive
                        onUpdateFilesCache()
                    }}>Sync with Drive</Button>
                </Col>

            </Row>
            <br/>
            <Row>
                <Col span={24}>
                    <ConfigProvider locale={enUSIntl}>

                        <ProTable<DataSourceType>
                            params={{
                                dateFilter: {startDate: filterDate.startDate, endDate: filterDate.endDate},
                                enableDateFilter: triggerEnableDatePicker,
                                keyword: search,
                            }}

                            request={async (params, sort, filter) => {
                                try {
                                    setIsLoading(true)

                                    // Get approved user's files (reports)
                                    // In get method must pass "params" name. In post is different
                                    const res = await axiosApiInstance.get('/api/files/getall', {
                                        params: {
                                            // For Filtering
                                            ...filter,
                                            keyword: params.keyword,
                                            enableDateFilter: params.enableDateFilter,
                                            startDate: params.dateFilter.startDate,
                                            endDate: params.dateFilter.endDate,
                                            // For Sorting
                                            sort_date: sort.date,
                                            sort_creation_date: sort.creation_date,
                                        }
                                    })

                                    setIsLoading(false)

                                    return {data: res.data, success: true, total: res.data.length}
                                } catch (e: any) {
                                    notification.error({message: e.response.data.message})
                                    //Το return να είναι της μορφής αυτού που όντως επιστρέφεται
                                    return {data: [], success: false, total: 0}
                                }

                            }}

                            actionRef={refFilesTable}
                            columns={columns}
                            rowKey="id"

                            onLoad={(dataSource) => {
                                getFilters(dataSource)
                            }}

                            pagination={{
                                hideOnSinglePage: true,
                                showQuickJumper: true
                            }}

                            search={false}
                            locale={{
                                emptyText: <Space direction={'vertical'}> <FileTextOutlined/>No files</Space>
                            }}
                            toolbar={{style: {marginBottom: 20, textAlign: "end"}}}
                            options={{
                                // search: {placeholder: 'Please enter keyword', allowClear: true},
                                search: {
                                    value: search,
                                    onChange: (value) => {
                                        setSearch(value.target.value);
                                    },
                                    allowClear: true,
                                    style: {width: 300},
                                },
                            }}
                            debounceTime={500}

                            bordered

                            columnsState={{
                                persistenceKey: 'file-approval-reports',
                                persistenceType: 'localStorage',
                            }}
                        />

                    </ConfigProvider>
                </Col>
            </Row>
        </PageContainer>
    );

};

export default FileApproval;