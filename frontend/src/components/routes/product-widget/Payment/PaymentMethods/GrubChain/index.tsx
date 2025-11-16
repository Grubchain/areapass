import { useParams } from "react-router";
import { useEffect, useState } from "react";
import { useGetEventPublic } from "../../../../../../queries/useGetEventPublic.ts";
import { getConfig } from "../../../../../../utilites/config.ts";
import { CheckoutContent } from "../../../../../layouts/Checkout/CheckoutContent";
import { HomepageInfoMessage } from "../../../../../common/HomepageInfoMessage";
import { t } from "@lingui/macro";
import { eventHomepagePath } from "../../../../../../utilites/urlHelper.ts";
import { LoadingMask } from "../../../../../common/LoadingMask";
import GrubchainCheckoutForm from "../../../../../forms/GrubChainCheckoutForm"
import { Event } from "../../../../../../types.ts";

interface GrubChainPaymentMethodProps {
  enabled: boolean;
  setSubmitHandler: (submitHandler: () => () => Promise<void>) => void;
}

export const GrubChainPaymentMethod = ({ enabled, setSubmitHandler }: GrubChainPaymentMethodProps) => {
  const { eventId, orderShortId } = useParams();

  const { data: event } = useGetEventPublic(eventId);

  useEffect(() => {
  }, []);

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

  return (
    <>
      <GrubchainCheckoutForm setSubmitHandler={setSubmitHandler} />
    </>
  )
}