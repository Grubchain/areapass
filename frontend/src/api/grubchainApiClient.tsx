import axios from "axios";
import crypto from 'crypto-js';
import { getConfig } from "../utilites/config.ts";

const GRUBCHAIN_URL = getConfig('GRUBCHAIN_URL');
const GRUBCHAIN_APP_KEY = getConfig('GRUBCHAIN_APP_KEY');
const GRUBCHAIN_SECRET_KEY = getConfig('GRUBCHAIN_SECRET_KEY');


export const gapi = axios.create({
    baseURL: GRUBCHAIN_URL,
    headers: {
        'X-HMAC-VERSION': 'v1',
        'X-HMAC-ALG': 'HMAC-SHA256',
        'X-HMAC-KID': GRUBCHAIN_APP_KEY,
        'X-HMAC-TS': 'v1',
        'X-HMAC-NONCE': 'v1',
        'X-HMAC-BODY-DIGEST': 'v1',
        'X-HMAC-SIGNATURE': 'application/json',
        'Content-Type': 'application/json'
    },
    withCredentials: true,
});

gapi.interceptors.response.use(
    (response) => response,
    (error) => {
        const { status } = error.response;
        const currentPath = window?.location.pathname;
        const isAllowedUnauthenticatedPath = ALLOWED_UNAUTHENTICATED_PATHS.some(path => currentPath.includes(path));
        const isManageEventPath = currentPath.startsWith('/manage/event/');
        const isAuthError = status === 401 || status === 403;

        if (isAuthError && (!isAllowedUnauthenticatedPath || isManageEventPath)) {
            // Store the current URL before redirecting to the login page
            window?.localStorage?.setItem(PREVIOUS_URL_KEY, window?.location.href);
            window?.location?.replace(LOGIN_PATH);
        }

        return Promise.reject(error);
    }
);

axios.defaults.withCredentials = true;