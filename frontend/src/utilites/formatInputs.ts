export const formatPhone = (value: string) => {
    let digits = value.replace(/\D/g, "").slice(0, 10);

    if (digits.length > 6) {
        return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
    }
    if (digits.length > 3) {
        return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    }

    return digits;
};
export const formatCard = (value: string) => {
    const digits = value.replace(/\D/g, "");
    const formatted = digits
        .replace(/(.{4})/g, "$1 ")
        .trim();
    return formatted.substring(0, 19);
};

export const hideCvv = (cvv: string) => {
    return cvv.replace(/./g, '*');
}

export const validateCard = (card: string) => {
    return (card.length > 0) && (card.length == 19);
}

export const validateCvv = (cvv: string) => {
    return (cvv.length > 0) && (cvv.length == 3);
}

export const validateExpDate = (date: string) => {
    let curYear = parseInt(new Date().getFullYear().toString().slice(-2));
    let month = parseInt(date.slice(0, 2), 10);
    let year = parseInt(date.slice(2), 10);
    if (month > 12) {
        return false;
    }
    if (year < curYear) {
        return false;
    }
    return true;
}

export const validateBankAccount = (account: string) => {
    return (account.length > 0) && (account.length < 20) && /^\d+$/.test(account);
}

export const validateBankCode = (code: string) => {
    return (code.length > 0) && ("" || /^\d+$/.test(code));
}

export const validateInternationalPhone = (phone: string): boolean => {
    return /^\+?[1-9]\d{1,14}$/.test(phone);
};