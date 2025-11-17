import axios from "axios";
import { getConfig } from "../utilites/config.ts";

const GRUBCHAIN_URL = getConfig('VITE_GRUBCHAIN_URL');

export const gapi = axios.create({
    baseURL: GRUBCHAIN_URL,
    withCredentials: true,
});

axios.defaults.withCredentials = true;

export const vaultApi = async (jwt: string,req: string, endpoint: string, params: any) => {
    gapi.defaults.headers.common['Authorization'] = 'Bearer ' + jwt;
    gapi.defaults.headers.common['Content-Type'] = 'application/json';
    gapi.defaults.headers.common['Idempotency-Key'] = crypto.randomUUID();
    if (req == 'post') {
        return gapi.post(endpoint, params);
    }
    if (req == 'get') {
        return gapi.get(endpoint, params);
    }
};