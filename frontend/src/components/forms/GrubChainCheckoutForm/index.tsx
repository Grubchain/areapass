import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { InputGroup } from "../../common/InputGroup";
import { t } from "@lingui/macro";
import { Alert, Skeleton, Radio, Text, Checkbox, Group, TextInput, Stack, NativeSelect } from "@mantine/core";
import { LoadingMaskPlain } from "../../common/LoadingMaskPlain/index.tsx";
import { DatePicker } from "@mantine/dates";
import { useGetOrderPublic } from "../../../queries/useGetOrderPublic.ts";
import { Card } from "../../common/Card";
import { CheckoutContent } from "../../layouts/Checkout/CheckoutContent";
import { HomepageInfoMessage } from "../../common/HomepageInfoMessage";
import { eventCheckoutPath, eventHomepagePath, eventHomepageUrl } from "../../../utilites/urlHelper.ts";
import { formatCard, formatPhone, validateExpDate, validateCard, validateCvv, validateBankAccount, validateBankCode, validateInternationalPhone } from "../../../utilites/formatInputs.ts";
import { Event } from "../../../types.ts";
import "./GrubchainCheckoutForm.module.scss"
import { Button } from "../../common/Button/index.tsx";
import { gapi, clientSecretsApi, pskChargeCardData, grubchainPostRequestDecorator, completeGrubchainPaymentHelper, detectPaymentApiResponse } from "../../../api/grubchainApiClient.tsx";
import { getToken } from "../../../api/grubchainTokenizerApiClient.ts";
import { orderClientPublic, orderClient } from "../../../api/order.client.ts";
import { getConfig } from "../../../utilites/config.ts";
import banks from "../../../utilites/nigerian-banks.json";

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

  const [agreeToTerms, setAgreeToTerms] = useState(true);
  const [notifyCryptoAvailable, setNotifyCryptoAvailable] = useState(false);
  const [allowEmails, setAllowEmails] = useState(true);

  const [paymentToken, setPaymentToken] = useState("");
  const [businessId, setBusinessId] = useState("");

  const [transferBankName, setTransferBankName] = useState("");
  const [transferBankAcc, setTransferBankAcc] = useState("");
  const [transferBankAmount, setTransferBankAmount] = useState("");

  const [payWithBankAmount, setPayWithBankAmount] = useState("");
  const [payWithBankAccount, setPayWithBankAccount] = useState("");
  const [payWithBankCode, setPayWithBankCode] = useState("");
  const [payWithBankName, setPayWithBankName] = useState("");

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

  const [ussdType, setUssdType] = useState(" ");
  const [ussdCode, setUssdCode] = useState(" ");
  const [ussdText, setUssdText] = useState(" ");

  const [otpCode, setOtpCode] = useState(" ");
  const [pin, setPin] = useState("");
  const [phone, setPhone] = useState("");
  const [payerBirthday, setPayerBirthday] = useState(" ");
  const [txReference, setTxReference] = useState(" ");
  const [authenticateBankUrl, setAuthenticateBankUrl] = useState("");
  const [paystackCheckoutUrl, setPaystackCheckoutUrl] = useState("");
  const [enc, setEnc] = useState({});

  const [tosLink, setTosLink] = useState("");
  const [privacyLink, setPrivacyLink] = useState("");
  const [cancelPolLink, setCancelPolLink] = useState("");

  const [isLoading, setIsLoading] = useState(Boolean);

  const allPaymentMethods = getConfig("VITE_AREAPASS_PAYMENT_MODE") == "paystack" ? [] : ["card", "bank"]; //"transfer", "USSD","kuda", 
  const allBanks = banks.data;

  if (getConfig("VITE_AREAPASS_PAYMENT_MODE") == "paystack") {
    useEffect(() => {
      const theBID = getConfig('VITE_GRUBCHAIN_BUSINESS_ID');
      setBusinessId(theBID);
      setTxReference(orderShortId);
      setCancelPolLink(getConfig('VITE_CANCELATION_URL'));
      setTosLink(getConfig('VITE_GRUBCHAIN_TOS'));
      setPrivacyLink(getConfig('VITE_GRUBCHAIN_PRIVACY'));

      if (setSubmitHandler) {
        setSubmitHandler(() => handleSubmit);
      }
    }, [setSubmitHandler, order]);
  } else {
    useEffect(() => {
      const theBID = getConfig('VITE_GRUBCHAIN_BUSINESS_ID');
      setBusinessId(theBID);
      setTxReference(orderShortId);
      setCancelPolLink(getConfig('VITE_CANCELATION_URL'));
      setTosLink(getConfig('VITE_GRUBCHAIN_TOS'));
      setPrivacyLink(getConfig('VITE_GRUBCHAIN_PRIVACY'));

      orderClientPublic.getGrubchainJwtToken(eventId, orderShortId, "client_secrets")
        .then((jwtToken) => {
          return clientSecretsApi({
            jwt: jwtToken,
            params: { "business_id": theBID, "expires_in": 600 }
          });
        })
        .then((response) => { setEnc(response) });

      if (setSubmitHandler) {
        setSubmitHandler(() => handleSubmit);
      }
    }, [setSubmitHandler, order]);
  }

  const handleSubmit = async () => {

  };

  //  validation
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
    //if (!validateInternationalPhone(phone)) {
    //setPhoneNumErr("Invalid Phone Number");
    //} else {
    //setPhoneNumErr("");
    //}
  }

  const validateKudaToken = (token: string) => {
    if (token.length < 1) {
      setKudaTokenErr("Invalid Token");
    } else {
      setKudaTokenErr("");
    }
  }

  //  handle different payment methods
  const setTheCheckoutState = () => {
    if (getConfig("VITE_AREAPASS_PAYMENT_MODE") === "paystack") {
      payCheckout();
    }
    else {
      setIsLoading(true);
      setCheckoutState(paymentMethod);
      setIsLoading(false);
    }
  }

  const resetTheCheckoutState = () => {
    setCheckoutState("");
    setPayWithBankAccount("");
    setPayWithBankCode("");
    setCardExp("");
    setCardNum("")
    setBankAccountCodeErr("Invalid Bank");
    setBankAccountNumErr("Invalid Bank Account");
  }

  const payCheckout = async () => {
    setCheckoutState("waiting");
    try {
      setIsLoading(true);
      setPayWithBankAmount(order.total_gross * 100);
      const theBID = getConfig('VITE_GRUBCHAIN_BUSINESS_ID');
      setBusinessId(theBID);
      setIsLoading(true);
      const body = {
        "amount": order.total_gross * 100,
        "email": order.email,
        "order_id": orderShortId,
        "event_id": eventId,
        "business_id": businessId,
        "agree_to_terms": agreeToTerms,
        "allow_promotions": allowEmails,
        "notify_crypto": notifyCryptoAvailable
      }

      grubchainPostRequestDecorator(
        "/api/v1/psk/purchase/redirect",
        body,
        eventId,
        orderShortId,
        orderClientPublic.getGrubchainHeaders
      ).then(({ data }) => {
        setPaystackCheckoutUrl(data.authorization_url);
        setCheckoutState("paystack_checkout")
      }).catch(error => {
        throw error;
      });

    } catch (error) {
      setIsLoading(false);
      setCheckoutState("ERROR");
      console.log(error);
    }
  }

  //  pay APIs
  const payCard = async () => {
    try {
      setIsLoading(true);
      orderClientPublic.getGrubchainJwtToken(eventId, orderShortId).then((jwtToken) => {
        let month = parseInt(cardExp.slice(0, 2), 10);
        let year = parseInt(cardExp.slice(2), 10);
        setIsLoading(true);
        return pskChargeCardData({
          cardData: { "business_id": businessId, "card_number": cardNum.replace(/\s+/g, ""), "expiry_year": year, "expiry_month": month },
          enc,
          jwt: jwtToken
        })
      }).then(({ jwtToken, enc, encryptedData }) => {
        setIsLoading(true);
        getToken(
          jwtToken,
          enc,
          encryptedData,
          businessId
        ).then(response => {
          const resp = detectPaymentApiResponse(response);
          if (resp == "ERROR") {
            setCheckoutState("ERROR");
          }
          setPaymentToken(response.data.token);
          setBusinessId(response.business_id);

          const body = {
            "token": response.data.token,
            "amount": order.total_gross * 100,
            "email": order.email,
            "cvv": cardCvv,
            "business_id": businessId,
            order_id: orderShortId,
            event_id: eventId,
            "agree_to_terms": agreeToTerms,
            "allow_promotions": allowEmails,
            "notify_crypto": notifyCryptoAvailable
          }

          grubchainPostRequestDecorator(
            "/api/v1/psk/purchase/card",
            body,
            eventId,
            orderShortId,
            orderClientPublic.getGrubchainHeaders
          ).then(response => {
            setPin("");
            setPhone("");
            setOtpCode("");
            setPayerBirthday("");
            completeGrubchainPaymentHelper({
              response,
              order,
              eventId,
              orderShortId,
              jwtTokenFn: orderClientPublic.getGrubchainJwtToken,
              completeGrubchainOrderFn: orderClientPublic.payGrubchainOrder
            }).then(({ state, reference, authenticateBankUrl }) => {
              setTxReference(reference);
              setAuthenticateBankUrl(authenticateBankUrl);
              state === "summary" ? navigate(eventCheckoutPath(eventId, orderShortId, 'summary')) : setCheckoutState(state);
              setIsLoading(false);
            })
          }).catch(error => {
            setIsLoading(false);
            setCheckoutState("ERROR");
            console.log(error);
          });
        }).catch(error => {
          setIsLoading(false);
          setCheckoutState("ERROR");
          console.log(error);
        });
      }).catch(error => {
        setIsLoading(false);
        setCheckoutState("ERROR");
        console.log(error);
      });
    } catch (error) {
      console.log(error);
      setCheckoutState("ERROR");
    }
  }

  const payBank = async () => {
    setPayWithBankAmount(order.total_gross * 100);
    const theBID = getConfig('VITE_GRUBCHAIN_BUSINESS_ID');
    setBusinessId(theBID);
    setIsLoading(true);
    const body = {
      "amount": order.total_gross * 100,
      "email": order.email,
      "bank_code": payWithBankCode,
      "bank_account_number": payWithBankAccount,
      "order_id": orderShortId,
      "event_id": eventId,
      "business_id": businessId,
      "agree_to_terms": agreeToTerms,
      "allow_promotions": allowEmails,
      "notify_crypto": notifyCryptoAvailable
    }

    grubchainPostRequestDecorator(
      "/api/v1/psk/purchase/bank",
      body,
      eventId,
      orderShortId,
      orderClientPublic.getGrubchainHeaders
    ).then((response: any) => {
      setPin("");
      setPhone("");
      setOtpCode("");
      setPayerBirthday("");
      completeGrubchainPaymentHelper({
        response,
        order,
        eventId,
        orderShortId,
        jwtTokenFn: orderClientPublic.getGrubchainJwtToken,
        completeGrubchainOrderFn: orderClientPublic.payGrubchainOrder
      }).then(({ state, reference, authenticateBankUrl }) => {
        setTxReference(reference);
        setAuthenticateBankUrl(authenticateBankUrl);
        state === "summary" ? navigate(eventCheckoutPath(eventId, orderShortId, 'summary')) : setCheckoutState(state);
        setIsLoading(false);
      }).catch(error => {
        setIsLoading(false);
        console.log(error);
        setCheckoutState("ERROR");
      });
    }).catch(error => {
      setIsLoading(false);
      console.log(error);
      setCheckoutState("ERROR");
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

  const initPayUssd = async (ussd_type: string) => {
    setUssdType(ussd_type);
    const theBID = getConfig('VITE_GRUBCHAIN_BUSINESS_ID');
    setBusinessId(theBID);
    gapi.post('api/v1/psk/purchase/ussd', {
      "amount": order.total_gross * 100,
      "email": order.email,
      "ussd_type": ussd_type,
      "business_id": businessId,
      "agree_to_terms": agreeToTerms,
      "allow_promotions": allowEmails,
      "notify_crypto": notifyCryptoAvailable
    }).then((response: any) => {
      if (response?.status !== 'success') {
        setCheckoutState("ERROR");
      }
      setTxReference(response?.reference);
      setUssdCode(response?.ussd_code);
      setUssdText(response?.display_text);
      setCheckoutState("USSDConfirm");
    });
  }

  const finishTx = async (reference: string) => {
    gapi.post('api/v1/psk/transaction/refresh', {
      "reference": reference
    }).then((response: any) => {
      if (response?.status === 'success') {
        //orderClientPublic.getGrubchainJwtToken(eventId, orderShortId).then((jwtToken) => {
        //const products = [order.attendees[0]];
        //const orderDetails = orderClientPublic.payGrubchainOrder(eventId, orderShortId, jwtToken, { order, products });
        //if (orderDetails.payment_status === 'PAYMENT_RECEIVED') {
        //navigate(eventCheckoutPath(eventId, orderShortId, 'summary'));
        //} else {
        //setCheckoutState("ERROR");
        //}
        //});
      }
    });
  }

  const handleWaitingButton = async () => {
    orderClientPublic.getGrubchainJwtToken(eventId, orderShortId).then(async (jwtToken) => {
      const products = order.attendees;
      const { data: orderDetails } = await orderClientPublic.awaitGrubchainPayment(eventId, orderShortId, jwtToken, { order, products });

      if (orderDetails.payment_status === 'AWAITING_PAYMENT') {
        navigate(eventCheckoutPath(eventId, orderShortId, 'summary'));
      } else {
        setCheckoutState("ERROR");
      }
    });
  }

  const sendPin = async (pin: string, reference: string) => {
    const body = { pin, reference };
    setIsLoading(true);
    grubchainPostRequestDecorator(
      "/api/v1/psk/submit/pin",
      body,
      eventId,
      orderShortId,
      orderClientPublic.getGrubchainHeaders
    ).then((response: any) => {
      setPin("");
      setPhone("");
      setOtpCode("");
      setPayerBirthday("");
      completeGrubchainPaymentHelper({
        response,
        order,
        eventId,
        orderShortId,
        jwtTokenFn: orderClientPublic.getGrubchainJwtToken,
        completeGrubchainOrderFn: orderClientPublic.payGrubchainOrder
      }).then(({ state, reference, authenticateBankUrl }) => {
        txReference ?? setTxReference(reference);

        setAuthenticateBankUrl(authenticateBankUrl);
        state === "summary" ? navigate(eventCheckoutPath(eventId, orderShortId, 'summary')) : setCheckoutState(state);
        setIsLoading(false);
      }).catch(error => {
        setCheckoutState("ERROR");
        setIsLoading(false);
        console.log(error);
      });
    }).catch(error => {
      setCheckoutState("ERROR");
      setIsLoading(false);
      console.log(error);
    });
  }

  const sendOtp = async (otp: string, reference: string) => {
    const body = { otp, reference };
    setIsLoading(true);
    grubchainPostRequestDecorator(
      "/api/v1/psk/submit/otp",
      body,
      eventId,
      orderShortId,
      orderClientPublic.getGrubchainHeaders
    ).then((response: any) => {
      setPin("");
      setPhone("");
      setOtpCode("");
      setPayerBirthday("");
      completeGrubchainPaymentHelper({
        response,
        order,
        eventId,
        orderShortId,
        jwtTokenFn: orderClientPublic.getGrubchainJwtToken,
        completeGrubchainOrderFn: orderClientPublic.payGrubchainOrder
      }).then(({ state, reference, authenticateBankUrl }) => {
        txReference ?? setTxReference(reference);

        setAuthenticateBankUrl(authenticateBankUrl);
        state === "summary" ? navigate(eventCheckoutPath(eventId, orderShortId, 'summary')) : setCheckoutState(state);
        setIsLoading(false);
      })
    }).catch(error => {
      setCheckoutState("ERROR");
      setIsLoading(false);
      console.log(error);
    });
  }

  const sendPhone = async (phone: string, reference: string) => {
    const body = { phone, reference };
    setIsLoading(true);
    grubchainPostRequestDecorator(
      "/api/v1/psk/submit/phone",
      body,
      eventId,
      orderShortId,
      orderClientPublic.getGrubchainHeaders
    ).then((response: any) => {
      setPin("");
      setPhone("");
      setOtpCode("");
      setPayerBirthday("");
      completeGrubchainPaymentHelper({
        response,
        order,
        eventId,
        orderShortId,
        jwtTokenFn: orderClientPublic.getGrubchainJwtToken,
        completeGrubchainOrderFn: orderClientPublic.payGrubchainOrder
      }).then(({ state, reference, authenticateBankUrl }) => {
        txReference ?? setTxReference(reference);

        setAuthenticateBankUrl(authenticateBankUrl);
        state === "summary" ? navigate(eventCheckoutPath(eventId, orderShortId, 'summary')) : setCheckoutState(state);
        setIsLoading(false);
      }).catch(error => {
        setCheckoutState("ERROR");
        setIsLoading(false);
        console.log(error);
      });
    }).catch(error => {
      setCheckoutState("ERROR");
      setIsLoading(false);
      console.log(error);
    });
  }

  const sendBirthday = async (birthday: string, reference: string) => {
    const body = {
      "reference": reference,
      "birthday": birthday
    }
    setTxReference(reference);
    setIsLoading(true);
    grubchainPostRequestDecorator(
      "/api/v1/psk/submit/birthday",
      body,
      eventId,
      orderShortId,
      orderClientPublic.getGrubchainHeaders
    ).then((response: any) => {
      setPin("");
      setPhone("");
      setOtpCode("");
      setPayerBirthday("");
      completeGrubchainPaymentHelper({
        response,
        order,
        eventId,
        orderShortId,
        jwtTokenFn: orderClientPublic.getGrubchainJwtToken,
        completeGrubchainOrderFn: orderClientPublic.payGrubchainOrder
      }).then(({ state, reference, authenticateBankUrl }) => {
        txReference ?? setTxReference(reference);

        setAuthenticateBankUrl(authenticateBankUrl);
        state === "summary" ? navigate(eventCheckoutPath(eventId, orderShortId, 'summary')) : setCheckoutState(state);
        setIsLoading(false);
      }).catch(error => {
        setCheckoutState("ERROR");
        setIsLoading(false);
        console.log(error);
      });
    }).catch(error => {
      setCheckoutState("ERROR");
      setIsLoading(false);
      console.log(error);
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

  if (order?.payment_status === 'ERROR') {
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

  //  checkout states
  if ((checkoutState === "OTP")) {
    return (
      <form
        id="payment-otp-form"
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
          }
        }}
      >
        <h2>
          {t`OTP`}
        </h2>

        <LoadingMaskPlain active={isLoading} />
        <Card>
          <TextInput
            withAsterisk
            label={t`Enter the code`}
            onChange={(e) => { setOtpCode(e.currentTarget.value); }}
            placeholder={t`OTP`}
            value={otpCode.trim()}
          />
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
              onClick={() => { sendOtp(otpCode, txReference); }}
              className={"checkout"}>
              {t`Next`}
            </Button>
          </Group>
        </Card>
      </form >
    );
  }

  if ((checkoutState === "pin")) {
    return (
      <form id="payment-pin-form" action="#">
        <h2>
          {t`PIN`}
        </h2>

        <LoadingMaskPlain active={isLoading} />
        <Card>
          <TextInput
            withAsterisk
            label={t`Enter the PIN`}
            onChange={(e) => { setPin(e.currentTarget.value); }}
            placeholder={t`PIN`}
            value={pin.trim()}
          />
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
              onClick={() => { sendPin(pin, txReference); }}
              className={"checkout"}>
              {t`Next`}
            </Button>
          </Group>
        </Card>
      </form >
    );
  }

  if ((checkoutState === "phone")) {
    return (
      <form id="payment-phone-form" action="#">
        <h2>
          {t`Phone`}
        </h2>

        <LoadingMaskPlain active={isLoading} />
        <Card>
          <TextInput
            withAsterisk
            label={t`Phone number`}
            placeholder={t`Phone Number`}
            maxLength={20}
            value={phone}
            onChange={(e) => { setPhone(e.currentTarget.value); validatePhoneNum(e.currentTarget.value); }}
          />
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
              onClick={() => { sendPhone(phone, txReference); }}
              className={"checkout"}>
              {t`Next`}
            </Button>
          </Group>
        </Card>
      </form >
    );
  }


  if ((checkoutState === "birthday")) {
    return (
      <form id="payment-birthday-form"

        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
          }
        }}
      >
        <h2>
          {t`Enter your birthday`}
        </h2>

        <LoadingMaskPlain active={isLoading} />
        <Card>
          <DatePicker
            label={t`Birthday`}
            required
            size="md"
            placeholder={t`Select your birthday`}
            valueFormat="MMM DD, YYYY"
            clearable
            dropdownType="modal"
            onChange={(value) => {
              setPayerBirthday(value);
            }}
          />
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
              onClick={() => { sendBirthday(payerBirthday, txReference); }}
              className={"checkout"}>
              {t`Next`}
            </Button>
          </Group>
        </Card>
      </form >
    );
  }


  {
    (order?.payment_status === 'PAYMENT_FAILED' || window?.location.search.includes('payment_failed')) && (
      <Alert mb={20} color={'red'}>{t`Your payment was unsuccessful. Please try again.`}</Alert>
    )
  }

  if (checkoutState === 'ERROR') {
    return (
      <HomepageInfoMessage
        message={t`Transaction processing error. Please try again`}
        linkText={t`View order details`}
        link={eventCheckoutPath(eventId, orderShortId, 'payment')}
      />
    );
  }

  if (checkoutState === '') {
    return (
      <div className="checkout-container">
        <form
          className="checkout-form"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
            }
          }}
        >
          <h2>{t`Checkout`}</h2>

          <Card>
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
                radius="lg"
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
                  label={
                    <>
                      I agree to the{" "}
                      <a href={tosLink} target="_blank" style={{ textDecoration: "underline", color: "blue" }}>
                        Terms & Conditions
                      </a>,{" "}
                      <a href={privacyLink} target="_blank" style={{ textDecoration: "underline", color: "blue" }}>
                        Privacy policy
                      </a>{" "} and {" "}
                      <a href={cancelPolLink} target="_blank" style={{ textDecoration: "underline", color: "blue" }}>
                        Cancellation policy
                      </a>
                    </>
                  }
                  className="checkAgree" />
                <Checkbox
                  name="allowEmail"
                  defaultChecked
                  color="#000"
                  onChange={(e: any) => setAllowEmails(e.currentTarget.checked)}
                  label="Allow Areapass to send me promotional emails"
                  className="checkAllow" />
              </Stack>

              <Group spacing="lg" m="10px" justify="space-between">
                <Button
                  size="md"
                  onClick={() => { navigate(eventHomepageUrl(event)); }}
                  variant="outline"
                  className={"cancel"}>
                  {t`Cancel`}
                </Button>
                <Button
                  size="md"
                  color="#0e0cff"
                  variant="filled"
                  onClick={() => {
                    if (agreeToTerms) {
                      setTheCheckoutState();
                    }
                  }}
                  className={"checkout"}>
                  {t`Next`}
                </Button>
              </Group>
            </Stack>
          </Card>
        </form>
      </div >
    );
  }

  //  card
  if (checkoutState === 'card') {
    return (
      <form id="payment-form"
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
          }
        }}
      >
        <h2>
          {t`Pay with Card`}
        </h2>
        <LoadingMaskPlain active={isLoading} />
        <Stack>
          <Card>
            <TextInput
              withAsterisk
              value={cardNum}
              maxLength={19}
              label={t`Card Number`}
              placeholder={t`Card Number`}
              onChange={(e) => { setCardNum(e.currentTarget.value.replace(/[^0-9]/g, '')); validateCardNum(e.currentTarget.value.replace(/[^0-9]/g, '')); }}
              error={cardNumError}
            />
            <InputGroup>
              <TextInput
                withAsterisk
                label={t`Expiry Date`}
                placeholder={t`MMYY`}
                value={cardExp}
                maxLength={4}
                onChange={(e) => { setCardExp(e.currentTarget.value.replace(/[^0-9]/g, '')); validateCardExpDate(e.currentTarget.value.replace(/[^0-9]/g, '')); }}
                error={cardExpDateError}
              />
              <TextInput
                withAsterisk
                label={t`CVV`}
                placeholder={t`123`}
                maxLength={3}
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
      <form id="payment-form"

        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
          }
        }}
      >
        <h2>
          {t`Payment`}
        </h2>
        <LoadingMaskPlain active={isLoading} />
        <Stack>
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

  //  transfer
  if (checkoutState === 'transfer') {
    return (
      <form id="payment-form"

        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
          }
        }}
      >
        <h2>
          {t`Payment by Transfer`}
        </h2>

        <LoadingMaskPlain active={isLoading} />
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

  //  bank
  if (checkoutState === 'bank') {
    return (
      <form id="payment-form"

        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
          }
        }}
      >
        <h2>
          {t`Pay with Bank`}
        </h2>

        <LoadingMaskPlain active={isLoading} />
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
            <NativeSelect
              withAsterisk
              label={t`Bank Code`}
              data={allBanks}
              onChange={(e) => {
                setPayWithBankCode(e.currentTarget.value);
                setPayWithBankName(e.currentTarget.options[e.currentTarget.selectedIndex].text);
                validateBankCodeNum(e.currentTarget.value);
              }}
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
      <form id="payment-form"

        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
          }
        }}
      >
        <h2>
          {t`Pay with Bank`}
        </h2>
        <LoadingMaskPlain active={isLoading} />
        <Card>
          <h3>Confirm bank details</h3>
          <InputGroup>
            <span className={"card-detail-label"}>Bank Name</span><Text>{payWithBankName}</Text>
          </InputGroup>
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
            onClick={() => { payBank(); }}
            className={"checkout"}>
            {t`Checkout`}
          </Button>
        </Group>
      </form >
    );
  }

  //  Kuda
  if (checkoutState === 'kuda') {
    return (
      <form id="payment-form"

        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
          }
        }}
      >
        <h2>
          {t`Pay with Kuda`}
        </h2>

        <LoadingMaskPlain active={isLoading} />
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
      <form id="payment-form"

        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
          }
        }}
      >
        <h2>
          {t`Pay with Kuda`}
        </h2>
        <LoadingMaskPlain active={isLoading} />
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

  //  USSD
  if (checkoutState === 'USSD') {
    return (
      <form id="payment-form">
        <h2>
          {t`USSD Payment`}
        </h2>
        <h3>
          {t`Choose your bank to start the payment process`}
        </h3>

        <LoadingMaskPlain active={isLoading} />
        <Stack>
          <Button
            size="md"
            color="#0e0cff"
            variant="filled"
            onClick={() => { initPayUssd("737"); }}
            className={"checkout"}>
            {t`Guaranty Trust Bank`}
          </Button>
          <Button
            size="md"
            color="#0e0cff"
            variant="filled"
            onClick={() => { initPayUssd("919"); }}
            className={"checkout"}>
            {t`United Bank for Africa`}
          </Button>
          <Button
            size="md"
            color="#0e0cff"
            variant="filled"
            onClick={() => { initPayUssd("966"); }}
            className={"checkout"}>
            {t`Zenith Bank`}
          </Button>
          <Group spacing="lg" m="10px" justify="space-between">
            <Button
              size="md"
              onClick={resetTheCheckoutState}
              variant="outline"
              className={"cancel"}>
              {t`Cancel`}
            </Button>
          </Group>
        </Stack>
      </form >
    );
  }

  if (checkoutState === 'paystack_checkout') {
    return (
      <Stack>
        <Card>
          <h2>
            {t`Continue with the link below for payment`}
          </h2>
          <p>
            <a href={paystackCheckoutUrl} onClick={(e) => { setCheckoutState("waiting"); handleWaitingButton(); }} target="_blank" style={{ color: "blue", textDecoration: "underline" }}> Click to here to complete payment</a>
          </p>
        </Card>
      </Stack>
    );
  }

  if (checkoutState === 'url') {
    return (
      <Stack>
        <Card>
          <h2>
            {t`Bank Authentication`}
          </h2>
          <p>
            <a href={authenticateBankUrl} onClick={(e) => { setCheckoutState("waiting"); handleWaitingButton(); }} target="_blank" style={{ color: "blue", textDecoration: "underline" }}> Click to authenticate with your bank</a>
          </p>
        </Card>
      </Stack>
    );
  }

  if (checkoutState === 'USSDConfirm') {
    return (
      <form id="payment-form">
        <h2>
          {t`Payment`}
        </h2>

        <LoadingMaskPlain active={isLoading} />
        <Stack>
          <Text>
            {ussdText}
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
              onClick={() => { finishTx(orderShortId); }}
              className={"checkout"}>
              {t`I completed my payment.`}
            </Button>
          </Group>
        </Stack>
      </form >
    );
  }

  if (checkoutState === 'waiting') {
    return (
      <Stack>
        <Card>
          <form id="payment-form">
            <h2>
              {t`We're waiting to confirm your transfer. This can take a few minutes`}
            </h2>

            <LoadingMaskPlain active={isLoading} />
            <Group spacing="lg" m="10px" justify="space-between">
              <Button
                size="md"
                color="#0e0cff"
                variant="filled"
                onClick={(e) => handleWaitingButton()}
                className={"checkout"}>
                {t`Next`}
              </Button>
            </Group>
          </form >
        </Card>
      </Stack>
    );
  }
}
