import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { InputGroup } from "../../common/InputGroup";
import { t } from "@lingui/macro";
import { Alert, Skeleton, Radio, Text, Checkbox, Group, TextInput, Stack } from "@mantine/core";
import { LoadingMask } from "../../common/LoadingMask";
import { useGetOrderPublic } from "../../../queries/useGetOrderPublic.ts";
import { Card } from "../../common/Card";
import { CheckoutContent } from "../../layouts/Checkout/CheckoutContent";
import { HomepageInfoMessage } from "../../common/HomepageInfoMessage";
import { eventCheckoutPath, eventHomepagePath, eventHomepageUrl } from "../../../utilites/urlHelper.ts";
import { formatCard, formatPhone, validateExpDate, validateCard, validateCvv, validateBankAccount, validateBankCode, validateInternationalPhone } from "../../../utilites/formatInputs.ts";
import { Event } from "../../../types.ts";
import "./GrubchainCheckoutForm.module.scss"
import { Button } from "../../common/Button/index.tsx";
import { gapi } from "../../../api/grubchainApiClient.tsx";
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
  const [businessId, setBusinessId] = useState("");

  const [transferBankName, setTransferBankName] = useState("");
  const [transferBankAcc, setTransferBankAcc] = useState("");
  const [transferBankAmount, setTransferBankAmount] = useState("");

  const [payWithBankAmount, setPayWithBankAmount] = useState("");
  const [payWithBankAccount, setPayWithBankAccount] = useState("");
  const [payWithBankCode, setPayWithBankCode] = useState("");

  const [payWithKudaAccount, setPayWithKudaAccount] = useState("");
  const [payWithKudaCode, setPayWithKudaCode] = useState("");
  const [payWithKudaToken, setPayWithKudaToken] = useState("");
  const [payWithKudaPhone, setPayWithKudaPhone] = useState("");

  const [cardNum, setCardNum] = useState("");
  const [cardExp, setCardExp] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardExpDateError, setCardExpDateError] = useState("");
  const [cardCvvError, setCardCvvError] = useState("");
  const [cardNumError, setCardNumError] = useState(" ");

  const [bankAccountNumError, setBankAccountNumErr] = useState(" ");
  const [bankAccountCodeErr, setBankAccountCodeErr] = useState(" ");
  const [phoneNumErr, setPhoneNumErr] = useState(" ");
  const [kudaTokenErr, setKudaTokenErr] = useState(" ");


  const allPaymentMethods = ["card", "bank", "kuda", "USSD"]; //"transfer",

  useEffect(() => {
    console.log(order);
    setTransferBankName(getConfig('VITE_GRUBCHAIN_BANK_ACCOUNT_TRANSFER'));
    setTransferBankAcc(getConfig('VITE_GRUBCHAIN_BANK_ACCOUNT_NUMBER'));
    setTransferBankAmount(order.total_gross * 100);
    if (setSubmitHandler) {
      setSubmitHandler(() => handleSubmit);
    }
  }, [setSubmitHandler, order]);

  const handleSubmit = async () => {

  };

  const validateCardExpDate = (date: string) => {
    if (!validateExpDate(date)) {
      setCardExpDateError("Invalid expiry date");
    } else {
      setCardExpDateError("");
    }
  }

  const validateCardNum = (card: string) => {
    if (!validateCard(card)) {
      setCardNumError("Invalid Card Number");
    } else {
      setCardNumError("");
    }
  }

  const validateCvvNum = (cvv: string) => {
    if (!validateCvv(cvv)) {
      setCardCvvError("Invalid CVV");
    } else {
      setCardCvvError("");
    }
  }

  const validateBankAccountNum = (bankAccount: string) => {
    if (!validateBankAccount(bankAccount)) {
      setBankAccountNumErr("Invalid Bank Account");
    } else {
      setBankAccountNumErr("");
    }
  }

  const validateBankCodeNum = (bankCode: string) => {
    if (!validateBankCode(bankCode)) {
      setBankAccountCodeErr("Invalid Bank Code");
    } else {
      setBankAccountCodeErr("");
    }
  }

  const validatePhoneNum = (phone: string) => {
    if (!validateInternationalPhone(phone)) {
      setPhoneNumErr("Invalid Phone Number");
    } else {
      setPhoneNumErr("");
    }
  }

  const validateKudaToken = (token: string) => {
    if (token.length < 1) {
      setKudaTokenErr("Invalid Token");
    } else {
      setKudaTokenErr("");
    }
  }

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
          { "card_number": cardNum.replace(/\s+/g, ""), "expiry_year": year, "expiry_month": month }
        ).then(response => {
          setPaymentToken(response.token);
          setBusinessId(response.business_id);
          gapi.post('api/v1/psk/purchase/card', {
            "token": paymentToken,
            "amount": order.total_gross * 100,
            "email": order.email,
            "cvv": cardCvv,
            "business_id": businessId,
            "agree_to_terms": agreeToTerms,
            "allow_promotions": allowEmails,
            "notify_crypto": notifyCryptoAvailable
          }).then(response => {
            // if success, areapass order is complete
            const products =  order.attendees;
            const orderDetails = orderClientPublic.payGrubchainOrder(eventId, orderShortId, jwtToken, { order, products});
            if (orderDetails.payment_status === 'PAYMENT_RECEIVED') {
              window.location = `/checkout/${eventId}/${orderShortId}/summary`
            }
          });
        });
      });
    } catch (error) {

    }
  }

  const payBank = async () => {
    orderClientPublic.getGrubchainJwtToken(eventId, orderShortId).then((jwtToken) => {

      getToken(
        jwtToken,
        { "card_number": cardNum, "expiry_year": year, "expiry_month": month }
      ).then(response => {
        setPaymentToken(response.token);
        setBusinessId(response.business_id);
        setPayWithBankAmount(order.total_gross * 100);

        gapi.post('api/v1/psk/purchase/bank', {
          "token": paymentToken,
          "amount": payWithBankAmount,
          "email": order.email,
          "bank_code": payWithBankCode,
          "bank_account_number": payWithBankAccount,
          "business_id": businessId,
          "agree_to_terms": agreeToTerms,
          "allow_promotions": allowEmails,
          "notify_crypto": notifyCryptoAvailable
        }).then(response => {
          // if success, areapass order is complete
        });
      });
    });
  }

  const payKuda = async () => {
    orderClientPublic.getGrubchainJwtToken(eventId, orderShortId).then((jwtToken) => {

      getToken(
        jwtToken,
        { "card_number": cardNum, "expiry_year": year, "expiry_month": month }
      ).then(response => {
        setPaymentToken(response.token);
        setBusinessId(response.business_id);

        gapi.post('api/v1/psk/purchase/kuda', {
          "token": paymentToken,
          "amount": order.total_gross * 100,
          "email": order.email,
          "bank_code": payWithKudaCode,
          "phone_number": payWithKudaPhone,
          "business_id": businessId,
          "agree_to_terms": agreeToTerms,
          "allow_promotions": allowEmails,
          "notify_crypto": notifyCryptoAvailable
        }).then(response => {
          // if success, areapass order is complete
        });
      });
    });
  }

  const payUssd = async () => {
    orderClientPublic.getGrubchainJwtToken(eventId, orderShortId).then((jwtToken) => {

      getToken(
        jwtToken,
        { "card_number": cardNum, "expiry_year": year, "expiry_month": month }
      ).then(response => {
        setPaymentToken(response.token);
        setBusinessId(response.business_id);

        gapi.post('api/v1/psk/purchase/kuda', {
          "token": paymentToken,
          "amount": order.total_gross * 100,
          "email": order.email,
          "ussd_type": "",
          "business_id": businessId,
          "agree_to_terms": agreeToTerms,
          "allow_promotions": allowEmails,
          "notify_crypto": notifyCryptoAvailable
        }).then(response => {
          // if success, areapass order is complete
        });
      });
    });
  }

  const payTransfer = async () => {
    orderClientPublic.transitionToOfflinePayment(eventId, orderShortId);
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
          {t`Pay with Card`}
        </h2>
        <Stack>
          <LoadingMask />
          <Card>
            <TextInput
              withAsterisk
              value={cardNum}
              maxLength={19}
              label={t`Card Number`}
              placeholder={t`Card Number`}
              keyboardType="number-pad"
              onChange={(e) => { setCardNum(formatCard(e.currentTarget.value.replace(/[^0-9]/g, ''))); validateCardNum(formatCard(e.currentTarget.value.replace(/[^0-9]/g, ''))); }}
              error={cardNumError}
            />
            <InputGroup>
              <TextInput
                withAsterisk
                label={t`Expiry Date`}
                placeholder={t`MMYY`}
                value={cardExp}
                maxLength={4}
                keyboardType="number-pad"
                onChange={(e) => { setCardExp(e.currentTarget.value.replace(/[^0-9]/g, '')); validateCardExpDate(e.currentTarget.value.replace(/[^0-9]/g, '')); }}
                error={cardExpDateError}
              />
              <TextInput
                withAsterisk
                label={t`CVV`}
                placeholder={t`123`}
                maxLength={3}
                keyboardType="number-pad"
                value={cardCvv}
                onChange={(e) => { setCardCvv(e.currentTarget.value.replace(/[^0-9]/g, '')); validateCvvNum(e.currentTarget.value.replace(/[^0-9]/g, '')); }}
                error={cardCvvError}
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
              onClick={() => { if (!cardCvvError && !cardExpDateError && !cardNumError) setCheckoutState("cardConfirm"); }}
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
            </InputGroup>
            <InputGroup>
              <span className={"card-detail-label"}>CVV</span><Text>***</Text>
            </InputGroup>
            <InputGroup>
              <span className={"card-detail-label"}>Amount</span><Text>{order.total_gross} {order.currency}</Text>
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
          {t`Pay with Bank`}
        </h2>

        <LoadingMask />
        <Card>
          <InputGroup>
            <TextInput
              withAsterisk
              label={t`Account Number`}
              placeholder={t`Account Number`}
              maxLength={20}
              onChange={(e) => { setPayWithBankAccount(e.currentTarget.value); validateBankAccountNum(e.currentTarget.value); }}
              error={bankAccountNumError}
            />
            <TextInput
              withAsterisk
              maxLength={6}
              label={t`Bank Code`}
              placeholder={t`Bank Code`}
              onChange={(e) => { setPayWithBankCode(e.currentTarget.value); validateBankCodeNum(e.currentTarget.value); }}
              error={bankAccountCodeErr}
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
              onClick={() => { if (!bankAccountCodeErr && !bankAccountNumError) setCheckoutState("bankConfirm"); }}
              className={"checkout"}>
              {t`Next`}
            </Button>
          </Group>

        </Card>
      </form >
    );
  }

  if (checkoutState === 'bankConfirm') {
    return (
      <form id="payment-form">
        <h2>
          {t`Pay with Bank`}
        </h2>
        <LoadingMask />
        <Card>
          <h3>Confirm bank details</h3>
          <InputGroup>
            <span className={"card-detail-label"}>Bank Account</span><Text>{payWithBankAccount}</Text>
          </InputGroup>
          <InputGroup>
            <span className={"card-detail-label"}>Bank code</span><Text>{payWithBankCode}</Text>
          </InputGroup>
          <InputGroup>
            <span className={"card-detail-label"}>Amount</span><Text>{order.total_gross} {order.currency}</Text>
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
            onClick={payBank}
            className={"checkout"}>
            {t`Checkout`}
          </Button>
        </Group>
      </form >
    );
  }

  if (checkoutState === 'kuda') {
    return (
      <form id="payment-form">
        <h2>
          {t`Pay with Kuda`}
        </h2>

        <LoadingMask />
        <Card>
          <InputGroup>
            <TextInput
              withAsterisk
              label={t`Account Number`}
              placeholder={t`Account Number`}
              value={payWithKudaAccount}
              onChange={(e) => { setPayWithKudaAccount(e.currentTarget.value); validateBankAccountNum(e.currentTarget.value); }}
              error={bankAccountNumError}
            />
            <TextInput
              withAsterisk
              label={t`Code`}
              placeholder={t`Code`}
              value={payWithKudaCode}
              onChange={(e) => { setPayWithKudaCode(e.currentTarget.value); validateBankCodeNum(e.currentTarget.value) }}
              error={bankAccountCodeErr}
            />
          </InputGroup>

          <InputGroup>
            <TextInput
              withAsterisk
              label={t`Phone number`}
              placeholder={t`Phone Number`}
              maxLength={20}
              value={payWithKudaPhone}
              onChange={(e) => { setPayWithKudaPhone(e.currentTarget.value); validatePhoneNum(e.currentTarget.value); }}
              error={phoneNumErr}
            />
            <TextInput
              withAsterisk
              label={t`Token `}
              placeholder={t`Token`}
              maxLength={20}
              value={payWithKudaToken}
              onChange={(e) => { setPayWithKudaToken(e.currentTarget.value); validateKudaToken(e.currentTarget.value); }}
              error={kudaTokenErr}
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
              onClick={() => { if (!bankAccountCodeErr && !bankAccountNumError && !phoneNumErr && !kudaTokenErr) setCheckoutState("kudaConfirm"); }}
              className={"checkout"}>
              {t`Next`}
            </Button>
          </Group>

        </Card>
      </form >
    );
  }

  if (checkoutState === 'kudaConfirm') {
    return (
      <form id="payment-form">
        <h2>
          {t`Pay with Kuda`}
        </h2>
        <LoadingMask />
        <Card>
          <h3>Confirm Kuda details</h3>
          <InputGroup>
            <span className={"card-detail-label"}>Account</span><Text>{payWithKudaAccount}</Text>
          </InputGroup>
          <InputGroup>
            <span className={"card-detail-label"}>Code</span><Text>{payWithKudaCode}</Text>
          </InputGroup>
          <InputGroup>
            <span className={"card-detail-label"}>Phone</span><Text>{payWithKudaPhone}</Text>
          </InputGroup>
          <InputGroup>
            <span className={"card-detail-label"}>Amount</span><Text>{order.total_gross} {order.currency}</Text>
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
            onClick={payKuda}
            className={"checkout"}>
            {t`Checkout`}
          </Button>
        </Group>
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
