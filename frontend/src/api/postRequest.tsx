import axios from "axios";
import qs_stringify from "qs-stringify";
import {API} from "../common/constants";
import {auth} from '../config/firebase';

export const postRequest = async (endpoint: string, data: any = null, stringify: boolean = true) => {

    if (data != null && stringify)
        data = qs_stringify(data)

    const session_url = API + endpoint
    // console.log(`sending request to: ${endpoint}`)

    const token = await auth.currentUser?.getIdToken()
    // console.log({token})
    return axios.post(session_url, data, {
        headers: {
            Accept: '*/*',
            'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
            Authorization: `Bearer ${token}`
        }
    });
};