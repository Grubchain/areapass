import {useQuery} from "@tanstack/react-query";
import {orderClientPublic} from "../api/order.client.ts";
import {IdParam, GrubchainPaymentIntent} from "../types.ts";

export const GET_ORDER_GRUBCHAIN_PAYMENT_INTENT_PUBLIC_QUERY_KEY = 'getOrderGrubchainPaymentIntentPublic';

export const useGetOrderGrubchainPaymentIntentPublic = (eventId: IdParam, orderShortId: IdParam, enabled: boolean) => {
    return useQuery<GrubchainPaymentIntent>({
        queryKey: [GET_ORDER_GRUBCHAIN_PAYMENT_INTENT_PUBLIC_QUERY_KEY, eventId, orderShortId],

        queryFn: async () => {
            const {data} = await orderClientPublic.findOrderGrubchain(Number(eventId), String(orderShortId));
            return data;
        },

        enabled: enabled
    });
}
