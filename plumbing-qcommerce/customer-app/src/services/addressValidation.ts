const INDIAN_POSTAL_CODE = /^[0-9]{6}$/;

export function normalizePostalCode(value: string): string {
  return value.trim();
}

export function isValidIndianPostalCode(value: string): boolean {
  return INDIAN_POSTAL_CODE.test(normalizePostalCode(value));
}

export const POSTAL_CODE_ERROR = 'Pincode must be exactly 6 digits.';
