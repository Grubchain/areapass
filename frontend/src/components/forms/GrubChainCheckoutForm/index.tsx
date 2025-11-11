import { useEffect, useState } from "react";
import { InputGroup } from "../../common/InputGroup";
import { TextInput, Stack } from "@mantine/core";
import { useParams } from "react-router";
import { t } from "@lingui/macro";
import { Alert, Skeleton, Radio, Text, Checkbox, Group } from "@mantine/core";
import { LoadingMask } from "../../common/LoadingMask";
import { useGetOrderPublic } from "../../../queries/useGetOrderPublic.ts";
import { Card } from "../../common/Card";
import { CheckoutContent } from "../../layouts/Checkout/CheckoutContent";
import { HomepageInfoMessage } from "../../common/HomepageInfoMessage";
import { eventCheckoutPath, eventHomepagePath, eventHomepageUrl } from "../../../utilites/urlHelper.ts";
import { Event } from "../../../types.ts";
import "./GrubchainCheckoutForm.module.scss"
import { Button } from "../../common/Button/index.tsx";
import { gapi } from "../../../api/grubchainApiClient.tsx";

export default function GrubChainCheckoutForm({ setSubmitHandler }: {
  setSubmitHandler: (submitHandler: () => () => Promise<void>) => void
}) {
  const { eventId, orderShortId } = useParams();
  const [message, setMessage] = useState<string | undefined>('');
  const { data: order, isFetched: isOrderFetched } = useGetOrderPublic(eventId, orderShortId, ['event']);
  const event = order?.event;
  const [paymentMethod, setPaymentMethod] = useState("");
  const [checkoutState, setCheckoutState] = useState("");
  const [ussdCode, setUssdCode] = useState(0);

  const [transferBankName, setTransferBankName] = useState("");
  const [transferBankAcc, setTransferBankAcc] = useState("");
  const [transferBankAmount, setTransferBankAmount] = useState("");

  const [cardNum, setCardNum] = useState("");
  const [cardExp, setCardExp] = useState("");
  const [cardCvv, setCardCvv] = useState("");

  const allPaymentMethods = ["card", "transfer", "USSD"];//"bank",

  const handleSubmit = async () => {

  };

  const setTheCheckoutState = () => {
    setCheckoutState(paymentMethod);
  }

  const resetTheCheckoutState = () => {
    setCheckoutState("");
  }

  const payCard = async () => {
    try {
      const response = await gapi.post('vault/charge', {
        card_number: cardNum,
        expiry_year:parseInt(cardExp.slice(0, 2), 10),
        expiry_month:parseInt(cardExp.slice(2), 10)
      });
    } catch (error) {
    }
  }

  useEffect(() => {
    if (setSubmitHandler) {
      setSubmitHandler(() => handleSubmit);
    }
  }, [setSubmitHandler]);

  if (!isOrderFetched || !order?.payment_status) {
    return (
      <CheckoutContent>
        <Skeleton height={300} mb={20} />
      </CheckoutContent>
    );
  }

  if (order?.payment_status === 'PAYMENT_RECEIVED') {
    return (
      <HomepageInfoMessage
        message={t`This order has already been paid.`}
        linkText={t`View order details`}
        link={eventCheckoutPath(eventId, orderShortId, 'summary')}
      />
    );
  }

  if (order?.payment_status !== 'AWAITING_PAYMENT' && order?.payment_status !== 'PAYMENT_FAILED') {
    return (
      <HomepageInfoMessage
        message={t`This order page is no longer available.`}
        linkText={t`View order details`}
        link={eventHomepagePath(event as Event)}
      />
    );
  }
  if (order?.payment_status === 'OTP') {
    return (
      <form id="payment-otp-form">
        <h2>
          {t`OTP`}
        </h2>

        <LoadingMask />
        <Card>
          <TextInput
            withAsterisk
            label={t`Enter the OTP code`}
            placeholder={t`OTP`}
          />

        </Card>
      </form >
    );
  }

  {
    (order?.payment_status === 'PAYMENT_FAILED' || window?.location.search.includes('payment_failed')) && (
      <Alert mb={20} color={'red'}>{t`Your payment was unsuccessful. Please try again.`}</Alert>
    )
  }

  if (checkoutState === '') {
    return (
      <div className="checkout-container">
        <form className="checkout-form">
          <h2>{t`Checkout`}</h2>

          <h4>Pay with</h4>

          <Stack className="payment-options">
            <Stack gap="lg" m="15px">
              {allPaymentMethods.map((method) => (
                <Radio
                  key={method}
                  className="payment-option"
                  color="#000000"
                  name="payment"
                  value={method}
                  checked={paymentMethod === method}
                  onChange={() => setPaymentMethod(method)}
                  label={'Pay with ' + method.charAt(0).toUpperCase() + method.slice(1)}
                />
              ))}
            </Stack>
            <Stack
              pl="22px"
              mb="20px"
              bg="#F4EBFF"
              radius="xl"
            >
              <Text>
                Pay With Crypto &nbsp;&rarr; <strong>Coming Soon</strong>
              </Text>
              <Checkbox
                m="7px"
                color="#000"
                name="notifyMe"
                label="Notify me when crypto payments are available"
                className="notify" />
            </Stack>
          </Stack>
          <Stack gap="lg" m="15px">
            <Stack className="agreements">
              <Checkbox
                color="#000"
                defaultChecked
                name="agree"
                label="I agree to the Areapass's terms and conditions"
                className="checkAgree" />
              <Checkbox
                name="allowEmail"
                color="#000"
                label="Allow Areapass to send me promotional emails"
                className="checkAllow" />
            </Stack>

            <Group spacing="lg" m="10px" justify="space-between">
              <Button
                size="md"
                onClick={() => { eventHomepageUrl(event) }}
                variant="outline"
                className={"cancel"}>
                {t`Cancel`}
              </Button>
              <Button
                size="md"
                color="#0e0cff"
                variant="filled"
                onClick={setTheCheckoutState}
                className={"checkout"}>
                {t`Next`}
              </Button>
            </Group>
          </Stack>
        </form>
      </div>
    );
  }


  if (checkoutState === 'card') {
    return (
      <form id="payment-form">
        <h2>
          {t`Payment`}
        </h2>
        <Stack>
          <LoadingMask />
          <Card>
            <TextInput
              withAsterisk
              value={cardNum}
              maxLength={16}
              label={t`Card Number`}
              placeholder={t`Card Number`}
              keyboardType="number-pad"
              onChange={(e) => setCardNum(e.currentTarget.value.replace(/[^0-9]/g, ''))}
            />
            <InputGroup>
              <TextInput
                withAsterisk
                label={t`Expiry Date`}
                placeholder={t`MMYY`}
                value={cardExp}
                maxLength={4}
                keyboardType="number-pad"
                onChange={(e) => setCardExp(e.currentTarget.value.replace(/[^0-9]/g, ''))}
              />
              <TextInput
                withAsterisk
                label={t`CVV`}
                placeholder={t`123`}
                maxLength={3}
                keyboardType="number-pad"
                value={cardCvv}
                onChange={(e) => setCardCvv(e.currentTarget.value.replace(/[^0-9]/g, ''))}
              />
            </InputGroup>
          </Card>
          <Group spacing="lg" m="10px" justify="space-between">
            <Button
              size="md"
              onClick={resetTheCheckoutState}
              variant="outline"
              className={"cancel"}>
              {t`Cancel`}
            </Button>
            <Button
              size="md"
              color="#0e0cff"
              variant="filled"
              onClick={() => { setCheckoutState("cardConfirm"); }}
              className={"checkout"}>
              {t`Next`}
            </Button>
          </Group>
        </Stack>
      </form >
    );
  }

  if (checkoutState === 'cardConfirm') {
    return (
      <form id="payment-form">
        <h2>
          {t`Payment`}
        </h2>
        <Stack>
          <LoadingMask />
          <Card>
            <h3>Confirm card details</h3>
            <h4>Card</h4>
            <Text>{cardNum}</Text>
            <InputGroup>
              <h4>Expiry Date</h4>
              <Text>{cardExp}</Text>
              <h4>CVV</h4>
              <Text>{cardCvv}</Text>
            </InputGroup>
          </Card>
          <Group spacing="lg" m="10px" justify="space-between">
            <Button
              size="md"
              onClick={() => { setCheckoutState("card"); }}
              variant="outline"
              className={"cancel"}>
              {t`Cancel`}
            </Button>
            <Button
              size="md"
              color="#0e0cff"
              variant="filled"
              onClick={payCard}
              className={"checkout"}>
              {t`Checkout`}
            </Button>
          </Group>
        </Stack>
      </form >
    );
  }

  if (checkoutState === 'transfer') {
    return (
      <form id="payment-form">
        <h2>
          {t`Payment by Transfer`}
        </h2>

        <LoadingMask />
        <Card>
          <InputGroup>
            <h4>Bank Name</h4>
            <Text>
              {transferBankName}
            </Text>
            <h4>Account Number</h4>
            <Text>
              {transferBankAcc}
            </Text>
            <h4>Amount</h4>
            <Text>
              {transferBankAmount}
            </Text>
          </InputGroup>
        </Card>
        <Group spacing="lg" m="10px" justify="space-between">
          <Button
            size="md"
            onClick={resetTheCheckoutState}
            variant="outline"
            className={"cancel"}>
            {t`Cancel`}
          </Button>
          <Button
            size="md"
            color="#0e0cff"
            variant="filled"
            onClick={setTheCheckoutState}
            className={"checkout"}>
            {t`I have sent the money`}
          </Button>
        </Group>
      </form >
    );
  }

  if (checkoutState === 'bank') {
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
              label={t`Account Number`}
              placeholder={t`Account Number`}
            />
          </InputGroup>

          <Group spacing="lg" m="10px" justify="space-between">
            <Button
              size="md"
              onClick={resetTheCheckoutState}
              variant="outline"
              className={"cancel"}>
              {t`Cancel`}
            </Button>
            <Button
              size="md"
              color="#0e0cff"
              variant="filled"
              onClick={setTheCheckoutState}
              className={"checkout"}>
              {t`Next`}
            </Button>
          </Group>

        </Card>
      </form >
    );
  }

  if (checkoutState === 'USSD') {
    return (
      <form id="payment-form">
        <h2>
          {t`Payment`}
        </h2>

        <LoadingMask />
        <Stack>
          <Text>
            {t`Dial the code below to complete this transaction with GTBank's`}
          </Text>
          <Text>
            {ussdCode}
          </Text>
          <Group spacing="lg" m="10px" justify="space-between">
            <Button
              size="md"
              onClick={resetTheCheckoutState}
              variant="outline"
              className={"cancel"}>
              {t`Cancel`}
            </Button>
            <Button
              size="md"
              color="#0e0cff"
              variant="filled"
              onClick={setTheCheckoutState}
              className={"checkout"}>
              {t`Next`}
            </Button>
          </Group>
        </Stack>
      </form >
    );
  }


  if (checkoutState === 'waiting') {
    return (
      <form id="payment-form">
        <h2>
          {t`We're waiting to confirm your transfer. This can take a few minutes`}
        </h2>

        <LoadingMask />
        <Group spacing="lg" m="10px" justify="space-between">
          <Button
            size="md"
            color="#0e0cff"
            variant="filled"
            className={"checkout"}>
            {t`Ok`}
          </Button>
        </Group>
      </form >
    );
  }
}
