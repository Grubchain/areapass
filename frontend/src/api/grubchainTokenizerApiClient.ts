import axios from "axios";
import crypto from 'crypto-js';
import jose from 'jose';
import { getConfig } from "../utilites/config.ts";

const GRUBCHAIN_TOKENIZER_URL = getConfig('GRUBCHAIN_TOKENIZER_URL');

const GRUBCHAIN_APP_KEY = getConfig('GRUBCHAIN_APP_KEY');
const GRUBCHAIN_SECRET_KEY = getConfig('GRUBCHAIN_SECRET_KEY');
const GRUBCHAIN_ISS = getConfig('GRUBCHAIN_ISS');
const GRUBCHAIN_KID = getConfig('GRUBCHAIN_KID');
const GRUBCHAIN_AUD = getConfig('GRUBCHAIN_AUD');
const GRUBCHAIN_SCOPE = getConfig('GRUBCHAIN_SCOPE');

const now = Math.floor(Date.now()/1000);
const payload = {
    GRUBCHAIN_ISS,
    GRUBCHAIN_AUD,
    sub: 'grubchain',
    scope: GRUBCHAIN_SCOPE,
    iat: now,
    nbf: now - 5,
    exp: now + 60,
    jti: crypto.randomUUID()
};
const jwt = await new jose.SignJWT(payload)
    .setProtectedHeader({ alg: 'RS256', GRUBCHAIN_KID })
    .sign(GRUBCHAIN_SECRET_KEY);

export const gTokenizerApi = axios.create({
    baseURL: GRUBCHAIN_TOKENIZER_URL,
    headers: {
        'Authorization': 'Bearer ' + jwt,
        'Idempotency-Key': crypto.randomUUID(),
        'Content-Type': 'application/json'
    },
    withCredentials: true,
});

gTokenizerApi.interceptors.response.use(
    (response) => response,
    (error) => {
        return Promise.reject(error);
    }
);

axios.defaults.withCredentials = true;