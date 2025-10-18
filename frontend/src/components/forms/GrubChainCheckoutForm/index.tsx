import { useEffect, useState } from "react";
import { InputGroup } from "../../common/InputGroup";
import { TextInput } from "@mantine/core";
import { useParams } from "react-router";
import * as stripeJs from "@stripe/stripe-js";
import { t } from "@lingui/macro";
import { LoadingMask } from "../../common/LoadingMask";
import { useGetOrderPublic } from "../../../queries/useGetOrderPublic.ts";
import { Card } from "../../common/Card";
import { CheckoutContent } from "../../layouts/Checkout/CheckoutContent";
import { HomepageInfoMessage } from "../../common/HomepageInfoMessage";
import { eventCheckoutPath, eventHomepagePath } from "../../../utilites/urlHelper.ts";
import { Event } from "../../../types.ts";

export default function GrubChainCheckoutForm({ setSubmitHandler }: {
  setSubmitHandler: (submitHandler: () => () => Promise<void>) => void
}) {
  const { eventId, orderShortId } = useParams();
  const [message, setMessage] = useState<string | undefined>('');
  const { data: order, isFetched: isOrderFetched } = useGetOrderPublic(eventId, orderShortId, ['event']);
  const event = order?.event;

  const handleSubmit = async () => {
  };

  useEffect(() => {
  }, []);


  const paymentElementOptions: stripeJs.StripePaymentElementOptions = {
    layout: {
      type: "accordion",
      defaultCollapsed: false,
      radios: true,
      spacedAccordionItems: true,
    },
  };

  return (
    <form id="payment-form">
      <h2>
        {t`Payment`}
      </h2>

      <LoadingMask />
      <Card>
        <InputGroup>
          <TextInput
            withAsterisk
            label={t`Card Number`}
            placeholder={t`Card Number`}
          />
          <TextInput
            withAsterisk
            label={t`Expiry Date`}
            placeholder={t`Expiry Date`}
          />
        </InputGroup>

        <TextInput
          withAsterisk
          label={t`CVV`}
          placeholder={t`CVV`}
        />

      </Card>
    </form >
  );
}
