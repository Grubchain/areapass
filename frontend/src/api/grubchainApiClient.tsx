import axios from "axios";
import { getConfig } from "../utilites/config.ts";
import { encryptCardData, importEncryptionKeyFromClientSecret } from "../utilites/signer.ts";

const GRUBCHAIN_URL = getConfig('VITE_GRUBCHAIN_URL');
const TOKENIZER_URL = getConfig('VITE_GRUBCHAIN_TOKENIZER_URL');

export const gapi = axios.create({
  baseURL: GRUBCHAIN_URL,
  withCredentials: true,
});

export const tapi = axios.create({
  baseURL: TOKENIZER_URL,
  withCredentials: true,
})

axios.defaults.withCredentials = true;

export const clientSecretsApi = async ({ jwt, params }) => {
  tapi.defaults.headers.common["Authorization"] = `Bearer ${jwt}`;

  const clientSecretsResponse = await tapi.post('api/v1/vault/client_secrets', params);
  const { client_secret, expires_at } = clientSecretsResponse.data;

  const key = await importEncryptionKeyFromClientSecret(client_secret)

  return { key, client_secret };
}

export const pskChargeCardData = async ({ cardData, enc, jwt }) => {
  const encryptedCard = await encryptCardData(cardData, enc.key);

  return {
    jwtToken: jwt,
    enc,
    encryptedData: encryptedCard,
  }
}
