import axios from 'axios';
import qs_stringify from 'qs-stringify';
import { RBAC_API } from '../common/constants';
import { auth } from '../config/firebase';

export const postRequestRBAC = async (endpoint: string, data?: any) => {
    if (data === undefined) data = null;
    else data = qs_stringify(data);

    const session_url = RBAC_API + endpoint;

    const token = await auth.currentUser?.getIdToken();
    console.log({ token });

    return axios.post(session_url, data, {
        headers: {
            Accept: '*/*',
            'Access-Control-Allow-Origin': RBAC_API!,
            'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
            Authorization: `Bearer ${token}`
        }
    });
};
