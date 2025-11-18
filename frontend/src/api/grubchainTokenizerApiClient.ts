import axios from "axios";
import { getConfig } from "../utilites/config.ts";

const GRUBCHAIN_TOKENIZER_URL = getConfig("VITE_GRUBCHAIN_TOKENIZER_URL");

export const gTokenizerApi = axios.create({
  baseURL: GRUBCHAIN_TOKENIZER_URL,
  withCredentials: true,
});

axios.defaults.withCredentials = true;

export const getToken = async (
  jwt: string,
  enc: any,
  encryptedData: any,
  businessId: string,
) => {
  gTokenizerApi.defaults.headers.common["Authorization"] = "Bearer " + jwt;
  gTokenizerApi.defaults.headers.common["Content-Type"] = "application/json";
  gTokenizerApi.defaults.headers.common["Idempotency-Key"] =
    crypto.randomUUID();
  gTokenizerApi.defaults.headers.common["X-Client-Secret"] = enc.client_secret;
  const payload = {
    business_id: businessId,
    enc_alg: "AES-256-GCM",
    encrypted_payload: encryptedData,
  };
  return gTokenizerApi.post("api/v1/vault/tokenize", payload);
};

