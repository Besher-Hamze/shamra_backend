import { parsePhoneNumberFromString } from 'libphonenumber-js';

export function validatePhoneNumber(phoneNumber: string): boolean {
    const parsed = parsePhoneNumberFromString(phoneNumber);
    return parsed?.isValid() ?? false;
}

export function normalizePhoneNumber(phoneNumber: string): string {
    const trimmed = phoneNumber.trim();
    if (!trimmed) {
        return trimmed;
    }

    const internationalLike = trimmed.startsWith('00')
        ? '+' + trimmed.slice(2).replace(/\D/g, '')
        : trimmed;

    let parsed = parsePhoneNumberFromString(internationalLike);
    if (parsed?.isValid()) {
        return parsed.number;
    }

    parsed = parsePhoneNumberFromString(trimmed, 'SY');
    if (parsed?.isValid()) {
        return parsed.number;
    }

    const digitsOnly = trimmed.replace(/\D/g, '');
    if (digitsOnly.length >= 8 && digitsOnly.length <= 15 && /^[1-9]/.test(digitsOnly)) {
        parsed = parsePhoneNumberFromString('+' + digitsOnly);
        if (parsed?.isValid()) {
            return parsed.number;
        }
    }

    return trimmed;
}
