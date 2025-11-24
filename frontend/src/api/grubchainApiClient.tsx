import axios from "axios";
import { getConfig } from "../utilites/config.ts";
import { encryptCardData, importEncryptionKeyFromClientSecret } from "../utilites/signer.ts";

const GRUBCHAIN_URL = getConfig('VITE_GRUBCHAIN_URL');
const TOKENIZER_URL = getConfig('VITE_GRUBCHAIN_TOKENIZER_URL');
const TX_STATUS_PENDING = ['ongoing','pending','processing'];

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

export const grubchainPostRequestDecorator = async (path, body, eventId, orderShortId, headerCallback = async () => { }) => {
  const payload = {
    raw_body: body,
    method: "POST",
    url: path,
  }

  return headerCallback(eventId, orderShortId, payload)
    .then(({ headers, payload }) => {
      gapi.defaults.headers.common = { ...gapi.defaults.headers.common, ...headers };

      return gapi.post(path, payload)
    })
}

export const completeGrubchainPaymentHelper = async function ({
  response,
  order,
  eventId,
  orderShortId,
  jwtTokenFn = () => { },
  completeGrubchainOrderFn = () => { }
}) {
  let checkoutState = "ERROR", txReference;

  if (response?.status === 200) {

    const { status, reference } = response.data;
    txReference = reference;

    if (status === "send_birthday") {
      checkoutState = "birthday";
    }
    if (status === "send_pin") {
      checkoutState = "pin";
    }

    if (status === "send_otp") {
      checkoutState = "OTP";
    }

    if (status === "send_phone") {
      checkoutState = "phone";
    }

    if (status === "success") {
      const jwtToken = await jwtTokenFn(eventId, orderShortId);

      const products = [order.attendees[0]];

      const orderDetailsResponse = await completeGrubchainOrderFn(eventId, orderShortId, jwtToken, { order, products });

      if (orderDetailsResponse?.status !== 200) {
        const { data: orderDetails } = orderDetailsResponse;

        if (orderDetails.payment_status === 'PAYMENT_RECEIVED') {
          checkoutState = "summary";
        }
      }
      else checkoutState = "ERROR";

    }
  } else {
    checkoutState = "ERROR";
  }

  return {
    state: checkoutState,
    reference: txReference
  }
}


export const detectPaymentApiResponse = (response:any) => {
  if (!response || !response.status)
    return "ERROR";
  if (response.status == 'abandoned')
    return "ERROR";
  if (response.status == 'failed')
    return "ERROR";
  if (TX_STATUS_PENDING.includes(response.status)) 
    return "PENDING";
  return "SUCCESS";
}