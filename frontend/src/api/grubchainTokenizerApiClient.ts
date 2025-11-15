import axios from "axios";
import { getConfig } from "../utilites/config.ts";

const GRUBCHAIN_TOKENIZER_URL = getConfig('VITE_GRUBCHAIN_TOKENIZER_URL');

export const gTokenizerApi = axios.create({
    baseURL: GRUBCHAIN_TOKENIZER_URL,
    withCredentials: true,
});

axios.defaults.withCredentials = true;

export const getToken = async (jwt: string, params: any) => {
    gTokenizerApi.defaults.headers.common['Authorization'] = 'Bearer ' + jwt;
    gTokenizerApi.defaults.headers.common['Content-Type'] = 'application/json';
    gTokenizerApi.defaults.headers.common['Idempotency-Key'] = crypto.randomUUID();
    return gTokenizerApi.post('vault/tokenize', params);
}