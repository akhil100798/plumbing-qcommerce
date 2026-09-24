export interface SendOtpResponse {
  message?: string;
  qaCode?: string;
}

export function extractLocalQaCode(response: unknown): string | undefined {
  if (!response || typeof response !== 'object') {
    return undefined;
  }

  const qaCode = (response as SendOtpResponse).qaCode;
  return typeof qaCode === 'string' && /^\d{6}$/.test(qaCode) ? qaCode : undefined;
}
