import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  login: vi.fn(),
  authFailure: vi.fn((message: string) => ({ type: 'auth/failure', payload: message })),
  dispatch: vi.fn(),
  alert: vi.fn(),
  codeChanged: vi.fn(),
}));

vi.mock('react-native', () => ({
  Alert: { alert: mocks.alert },
  StyleSheet: { create: (styles: unknown) => styles },
  Text: 'Text',
  TouchableOpacity: ({ children, onPress, accessibilityLabel }: any) =>
    React.createElement('button', { onClick: onPress, 'aria-label': accessibilityLabel }, children),
  View: 'View',
}));

vi.mock('react-redux', () => ({
  useDispatch: () => mocks.dispatch,
}));

vi.mock('../../services/auth/authService', () => ({
  authService: { login: mocks.login, sendOtp: vi.fn() },
}));

vi.mock('../../redux/slices/authSlice', () => ({
  authSuccess: (response: unknown) => ({ type: 'auth/success', payload: response }),
  authFailure: mocks.authFailure,
}));

vi.mock('../../components/common/AppHeader', () => ({
  AppHeader: () => React.createElement('header', null, 'Verify Number'),
}));

vi.mock('../../components/common/PrimaryButton', () => ({
  PrimaryButton: ({ title, onPress, disabled }: any) =>
    React.createElement('button', { onClick: onPress, disabled, 'aria-label': title }, title),
}));

vi.mock('../../components/common/ScreenWrapper', () => ({
  ScreenWrapper: ({ children }: any) => React.createElement('main', null, children),
}));

vi.mock('../../components/forms/OTPInput', () => ({
  OTPInput: ({ onCodeChanged }: any) => {
    mocks.codeChanged.mockImplementation(onCodeChanged);
    return React.createElement('input', { 'aria-label': 'OTP input' });
  },
}));

vi.mock('../../theme', () => ({
  colors: { surface: '#fff', primary: '#00f', textPrimary: '#000', textSecondary: '#666' },
  spacing: { layout: 1, xl: 1, md: 1, sm: 1, xs: 1 },
  typography: { fontSize: { xxl: 1, sm: 1, xs: 1 }, fontWeight: { black: '900', bold: '700', medium: '500' } },
  borderRadius: { md: 1 },
}));

vi.mock('../../assets/icons/shield-verified.svg', () => ({
  default: () => React.createElement('span', null, 'shield'),
}));

import { OtpScreen } from './OtpScreen';

describe('Plumber OTP expiry error contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.login.mockRejectedValue(new Error('Invalid or expired OTP'));
  });

  it('renders the backend expiry message inline after verification fails', async () => {
    let renderer: TestRenderer.ReactTestRenderer;
    const navigation = { replace: vi.fn(), goBack: vi.fn() };

    await act(async () => {
      renderer = TestRenderer.create(
        <OtpScreen
          route={{ params: { phone: '+91 5555500092' } } as any}
          navigation={navigation as any}
        />,
      );
    });

    act(() => {
      mocks.codeChanged('123456');
    });

    const verifyButton = renderer!.root.findByProps({ 'aria-label': 'Verify & Continue' });
    await act(async () => {
      verifyButton.props.onClick();
    });

    expect(mocks.login).toHaveBeenCalledWith('+91 5555500092', '123456');
    expect(mocks.dispatch).toHaveBeenCalledWith({
      type: 'auth/failure',
      payload: 'Invalid or expired OTP',
    });
    expect(JSON.stringify(renderer!.toJSON())).toContain('Invalid or expired OTP');
  });
});
