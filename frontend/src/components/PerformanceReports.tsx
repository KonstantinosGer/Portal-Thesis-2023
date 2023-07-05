import React, {useRef, useState} from "react";
import {Button, Col, ConfigProvider, notification, Row, Space, Tag, Tooltip} from 'antd';
import {ActionType, PageContainer, ProColumns, ProForm, ProFormDateRangePicker} from '@ant-design/pro-components';
import {ProTable} from '@ant-design/pro-table';
import enUSIntl from "antd/es/locale/en_US";
import {FileExcelTwoTone, FilePdfTwoTone, FilePptTwoTone, FileTextOutlined, FileTwoTone} from '@ant-design/icons';
import moment from "moment";
import {ReactComponent as GoogleDriveLogo} from '../../src/assets/google_drive_icon.svg';
import dayjs from "dayjs";
import axiosApiInstance from "../api/axiosClientPortal";

const GOOGLE_SPREADSHEET_MIME_TYPE = "application/vnd.google-apps.spreadsheet"
const PPT_FILE_MIME_TYPE = "application/vnd.ms-powerpoint"
const PPTX_FILE_MIME_TYPE = "application/vnd.openxmlformats-officedocument.presentationml.presentation"

const GOOGLE_SLIDE_MIME_TYPE = "application/vnd.google-apps.presentation"
const XLS_FILE_MIME_TYPE = "application/vnd.ms-excel"
const XLSX_FILE_MIME_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
const CSV_FILE_MIME_TYPE = "text/csv"

const PDF_FILE_MIME_TYPE = "application/pdf"

type Props = {};

type PerformanceReportsDataSourceType = {
    id: string,
    name: string
    type: string
    creation_date: string
    url: string
    mime_type: string
    date: string
};

interface PerformanceReportsFilterDateType {
    startDate: string
    endDate: string
}


const PerformanceReports = (props: Props) => {

    const currDate = new Date();

    //
    // Initialize State
    //
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const refPerformanceReportsTable = useRef<ActionType>();
    const [search, setSearch] = useState<string>('');

    //
    //Filters
    //
    //Date
    const [tmpFilterDate, setTmpFilterDate] = useState<PerformanceReportsFilterDateType>({
        startDate: currDate.getFullYear() - 1 + '-' + (currDate.getMonth() + 1 < 10 ? '0' : '') + (currDate.getMonth() + 1) + '-01',
        endDate: currDate.getFullYear() + '-' + (currDate.getMonth() + 1 < 10 ? '0' : '') + (currDate.getMonth() + 1) + '-01',
    });
    const [filterDate, setFilterDate] = useState<PerformanceReportsFilterDateType>({
        startDate: currDate.getFullYear() - 1 + '-' + (currDate.getMonth() + 1 < 10 ? '0' : '') + (currDate.getMonth() + 1) + '-01',
        endDate: currDate.getFullYear() + '-' + (currDate.getMonth() + 1 < 10 ? '0' : '') + (currDate.getMonth() + 1) + '-01',
    });

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

    //
    //Initialize columns
    //
    const columns: ProColumns<PerformanceReportsDataSourceType>[] = [
        {
            title: 'Name', dataIndex: 'name', editable: false, width: '45%', ellipsis: true,
            render: (dom, entity) => {
                return <a href={entity.url} target={"_blank"} style={{color: "black"}}>{entity.name}</a>
            }
        },

        {
            title: 'Type',
            dataIndex: 'type',
            editable: false,
            align: "center",
            width: '13%',
            render: (dom, entity) => {
                //Color: Plochere's Vermilion
                return <Tag color={"#D04423"}>{entity.type}</Tag>
            },
        },

        {
            title: 'Date', dataIndex: 'date', editable: false, align: "center", width: '13%',

            render: (dom, entity) => {
                if (entity.date.includes('unknown')) {
                    // return entity.date
                    return "unknown"
                } else {
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
            width: '13%',
            defaultSortOrder: 'descend',
            sorter: (a, b) => {
                //
                //Sorting column
                //
                //Compare two dates to sort antd's pro table
                var first_date = moment(a.creation_date, "DD/MM/YYYY").toDate()
                var second_date = moment(b.creation_date, "DD/MM/YYYY").toDate()

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
            width: '9%',
            render: (dom, entity) => {
                if (entity.mime_type == GOOGLE_SLIDE_MIME_TYPE || entity.mime_type == PPT_FILE_MIME_TYPE || entity.mime_type == PPTX_FILE_MIME_TYPE) {
                    //Color: Plochere's Vermilion
                    return <a href={entity.url} target={"_blank"}><FilePptTwoTone twoToneColor={"#D04423"}
                                                                                  style={{fontSize: '24px'}}/></a>
                } else if (entity.mime_type == GOOGLE_SPREADSHEET_MIME_TYPE || entity.mime_type == XLS_FILE_MIME_TYPE || entity.mime_type == XLSX_FILE_MIME_TYPE || entity.mime_type == CSV_FILE_MIME_TYPE) {
                    //Color:  Dark Spring Green
                    return <a href={entity.url} target={"_blank"}><FileExcelTwoTone twoToneColor={"#1D6F42"}
                                                                                    style={{fontSize: '24px'}}/></a>
                } else if (entity.mime_type == PDF_FILE_MIME_TYPE) {
                    //Color: Candy Apple Red
                    return <a href={entity.url} target={"_blank"}><FilePdfTwoTone twoToneColor={"#F40F02"}
                                                                                  style={{fontSize: '24px'}}/></a>
                } else {
                    //Color: #A9A9A9
                    return <a href={entity.url} target={"_blank"}><FileTwoTone twoToneColor={"#A9A9B9"}
                                                                               style={{fontSize: '24px'}}/></a> //twoToneColor={""}
                }
            }
        },

        {
            title: '',
            dataIndex: 'url',
            editable: false,
            width: '9%',
            align: "center",
            render: (dom, entity) => {
                return <Row justify={"space-around"}>
                    <Col span={24}>
                        <Tooltip title="Open in Google Drive" color={"#595959"}>
                            <Button href={entity.url} target={"_blank"} type={"text"}
                                    icon={<GoogleDriveLogo fontStretch={"true"}
                                                           style={{width: '22px', paddingTop: '1px'}}/>}
                            />
                        </Tooltip>
                    </Col>
                </Row>
            }
        },
    ];

    return (
        <PageContainer>

            <Row justify={"space-between"}>

                <Col span={24}>
                    <ProForm<PerformanceReportsFilterDateType> layout={"inline"}

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
                                                     disabled: isLoading,
                                                 },
                                             }}

                                             onFinish={async () => {
                                                 setFilterDate(tmpFilterDate)
                                             }}
                    >
                        <Space align={"baseline"}>
                            <ProFormDateRangePicker
                                width='md'
                                name='monthRange'
                                initialValue={[currDate.getFullYear() - 1 + '-' + (currDate.getMonth() + 1 < 10 ? '0' : '') + (currDate.getMonth() + 1) + '-01', currDate.getFullYear() + '-' + (currDate.getMonth() + 1 < 10 ? '0' : '') + (currDate.getMonth() + 1) + '-01']}
                                fieldProps={{
                                    format: 'YYYY-MM',
                                    picker: 'month',
                                    placeholder: ['Start month', 'End month'],
                                    value: [dayjs(tmpFilterDate.startDate, 'YYYY-MM'), dayjs(tmpFilterDate.endDate, 'YYYY-MM')],
                                    disabled: isLoading,
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

            </Row>
            <br/>
            <Row>
                <Col span={24}>

                    <ConfigProvider locale={enUSIntl}>
                        <ProTable<PerformanceReportsDataSourceType>
                            params={{
                                dateFilter: {startDate: filterDate.startDate, endDate: filterDate.endDate},
                                keyword: search,
                            }}

                            request={async (params, sort, filter) => {
                                try {
                                    setIsLoading(true)

                                    // Get approved user's files (reports)
                                    const res = await axiosApiInstance.get('/api/files/getperformanceapproved', {
                                        params: {
                                            // For Filtering
                                            // ...filter,
                                            keyword: params.keyword,
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

                            actionRef={refPerformanceReportsTable}
                            columns={columns}
                            rowKey="id"
                            // onLoad={(dataSource) => {
                            //     getFilters(dataSource)
                            // }}
                            pagination={{pageSize: 6, hideOnSinglePage: true, showQuickJumper: true}}



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
                                persistenceKey: 'performance-reports-files',
                                persistenceType: 'localStorage',
                            }}
                        />
                    </ConfigProvider>

                </Col>
            </Row>


        </PageContainer>
    );

}

export default PerformanceReports;