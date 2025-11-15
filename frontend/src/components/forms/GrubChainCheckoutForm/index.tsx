import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { InputGroup } from "../../common/InputGroup";
import { TextInput, Stack } from "@mantine/core";
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
import { gapi, vaultApi } from "../../../api/grubchainApiClient.tsx";
import { getToken } from "../../../api/grubchainTokenizerApiClient.ts";
import { orderClientPublic, orderClient } from "../../../api/order.client.ts";
import { getConfig } from "../../../utilites/config.ts";

export default function GrubChainCheckoutForm({ setSubmitHandler }: {
  setSubmitHandler: (submitHandler: () => () => Promise<void>) => void
}) {
  const { eventId, orderShortId } = useParams();
  const [message, setMessage] = useState<string | undefined>('');
  const { data: order, isFetched: isOrderFetched } = useGetOrderPublic(eventId, orderShortId, ['event']);
  const event = order?.event;
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState("");
  const [checkoutState, setCheckoutState] = useState("");
  const [ussdCode, setUssdCode] = useState(0);

  const [agreeToTerms, setAgreeToTerms] = useState(Boolean);
  const [notifyCryptoAvailable, setNotifyCryptoAvailable] = useState(Boolean);
  const [allowEmails, setAllowEmails] = useState(Boolean);

  const [paymentToken, setPaymentToken] = useState("");

  const [transferBankName, setTransferBankName] = useState("");
  const [transferBankAcc, setTransferBankAcc] = useState("");
  const [transferBankAmount, setTransferBankAmount] = useState("");

  const [cardNum, setCardNum] = useState("");
  const [cardExp, setCardExp] = useState("");
  const [cardCvv, setCardCvv] = useState("");

  const allPaymentMethods = ["card", "transfer", "bank", "USSD"];
  useEffect(() => {
    console.log(order);
    console.log();
    setTransferBankName(getConfig('VITE_GRUBCHAIN_BANK_ACCOUNT_TRANSFER'));
    setTransferBankAcc(getConfig('VITE_GRUBCHAIN_BANK_ACCOUNT_NUMBER'));
    setTransferBankAmount(order.total_gross * 100);
    if (setSubmitHandler) {
      setSubmitHandler(() => handleSubmit);
    }
  }, [setSubmitHandler, order]);

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
      orderClientPublic.getGrubchainJwtToken(eventId, orderShortId).then((jwtToken) => {
        let month = parseInt(cardExp.slice(0, 2), 10);
        let year = parseInt(cardExp.slice(2), 10);
        getToken(
          jwtToken,
          { "card_number": cardNum, "expiry_year": year, "expiry_month": month }
        ).then(response => {
          setPaymentToken(response.token);
          gapi.post('vault/charge', {
            "token_id": paymentToken,
            "amount_cents": order.total_gross * 100,
            "currency": order.currency,
            "merchant_ref": orderShortId,
            "agree_to_terms": orderShortId,
            "allow_promotions": orderShortId,
            "notify_crypto": orderShortId
          });
        });
      });
    } catch (error) {

    }
  }

  const payTransfer = async () => {
    orderClientPublic.transitionToOfflinePayment(eventId,orderShortId);
    order.order_items.map(item => {
      orderClient.markAsPaid(eventId, item.order_id);
    });
    handleSubmit();
    navigate(eventCheckoutPath(eventId, orderShortId, 'summary'));
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
                onChange={(e: any) => setNotifyCryptoAvailable(e.currentTarget.checked)}
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
                onChange={(e: any) => setAgreeToTerms(e.currentTarget.checked)}
                label="I agree to the Areapass's terms and conditions"
                className="checkAgree" />
              <Checkbox
                name="allowEmail"
                color="#000"
                onChange={(e: any) => setAllowEmails(e.currentTarget.checked)}
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
            <InputGroup>
              <TextInput
                withAsterisk
                value={cardNum}
                maxLength={16}
                label={t`Card Number`}
                placeholder={t`Card Number`}
                keyboardType="number-pad"
                onChange={(e) => setCardNum(e.currentTarget.value.replace(/[^0-9]/g, ''))}
              />
              <TextInput
                withAsterisk
                label={t`Expiry Date`}
                placeholder={t`MMYY`}
                value={cardExp}
                maxLength={4}
                keyboardType="number-pad"
                onChange={(e) => setCardExp(e.currentTarget.value.replace(/[^0-9]/g, ''))}
              />
              {/* <TextInput
                withAsterisk
                label={t`CVV`}
                placeholder={t`123`}
                maxLength={3}
                keyboardType="number-pad"
                value={cardCvv}
                onChange={(e) => setCardCvv(e.currentTarget.value.replace(/[^0-9]/g, ''))}
              /> */}
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

            <InputGroup>
              <span className={"card-detail-label"}>Card</span><Text>{cardNum}</Text>
            </InputGroup>
            <InputGroup>
              <span className={"card-detail-label"}>Expiry Date</span><Text>{cardExp}</Text>
              {/* <h4>CVV</h4>
              <Text>{cardCvv}</Text> */}
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
            <span className={"card-detail-label"}>Bank Name</span>
            <Text>
              {transferBankName}
            </Text>
          </InputGroup>
          <InputGroup>
            <span className={"card-detail-label"}>Account Number</span>
            <Text>
              {transferBankAcc}
            </Text>
          </InputGroup>
          <InputGroup>
            <span className={"card-detail-label"}>Amount</span>
            <Text>
              {order.total_gross} {order.currency}
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
            onClick={payTransfer}
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
