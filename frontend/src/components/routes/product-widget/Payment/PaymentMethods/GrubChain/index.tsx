import { useParams } from "react-router";
import { useCreateGrubchainPaymentData } from "../../../../../../queries/useCreateGrubchainPaymentData.ts";
import { useEffect, useState } from "react";
import { useGetEventPublic } from "../../../../../../queries/useGetEventPublic.ts";
import { CheckoutContent } from "../../../../../layouts/Checkout/CheckoutContent";
import { HomepageInfoMessage } from "../../../../../common/HomepageInfoMessage";
import { t } from "@lingui/macro";
import { eventHomepagePath } from "../../../../../../utilites/urlHelper.ts";
import GrubchainCheckoutForm from "../../../../../forms/GrubChainCheckoutForm"
import { Event } from "../../../../../../types.ts";
import { useGetOrderPublic } from "../../../../../../queries/useGetOrderPublic.ts";

interface GrubChainPaymentMethodProps {
  enabled: boolean;
  setSubmitHandler: (submitHandler: () => () => Promise<void>) => void;
}

export const GrubChainPaymentMethod = ({ enabled, setSubmitHandler }: GrubChainPaymentMethodProps) => {
  const { eventId, orderShortId } = useParams();
  const { orderData: order, isFetched: isOrderFetched } = useGetOrderPublic(eventId, orderShortId, ['event']);
  const {
    data: grubchainData,
    isFetched: isGrubchainFetched,
    error: grubchainPaymentIntentError
  } = useCreateGrubchainPaymentData(eventId, orderShortId);
  const { data: event } = useGetEventPublic(eventId);

  useEffect(() => {
    const grubchainAccount = grubchainData?.business_id;
    const options = grubchainAccount ? {
      grubchainAccount: grubchainAccount
    } : {};

  }, [grubchainData]);

  if (!enabled) {
    return (
      <CheckoutContent>
        <HomepageInfoMessage
          message={t`Grubchain payments are not enabled for this event.`}
          link={eventHomepagePath(event as Event)}
          linkText={t`Return to event page`}
        />
      </CheckoutContent>
    );
  }

  if (grubchainPaymentIntentError && event) {
    return (
      <CheckoutContent>
        <HomepageInfoMessage
          /* @ts-ignore */
          message={grubchainPaymentIntentError.response?.data?.message || t`Sorry, something has gone wrong. Please restart the checkout process.`}
          link={eventHomepagePath(event)}
          linkText={t`Return to event page`}
        />
      </CheckoutContent>
    );
  }

  return (
    <>
      <GrubchainCheckoutForm setSubmitHandler={setSubmitHandler} />
    </>
  )
}
