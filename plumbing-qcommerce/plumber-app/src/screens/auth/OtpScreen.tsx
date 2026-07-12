import React, { useState, useEffect } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';

import { AppHeader } from '../../components/common/AppHeader';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { ScreenWrapper } from '../../components/common/ScreenWrapper';
import { OTPInput } from '../../components/forms/OTPInput';
import { authService } from '../../services/auth/authService';
import { colors, spacing, typography } from '../../theme';
import { AuthStackParamList } from '../../types/navigation';
import { useDispatch } from 'react-redux';
import { authSuccess, authFailure } from '../../redux/slices/authSlice';
import ShieldIcon from '../../assets/icons/shield-verified.svg';

type Props = StackScreenProps<AuthStackParamList, 'Otp'>;

export function OtpScreen({ route, navigation }: Props) {
  const dispatch = useDispatch();
  const { phone } = route.params;
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(30);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleVerify = async () => {
    if (code.length < 6) {
      Alert.alert('Invalid Code', 'Please enter a 6-digit OTP code.');
      return;
    }

    setLoading(true);
    try {
      const response = await authService.login(phone, code);
      dispatch(authSuccess(response));
      setLoading(false);
      navigation.replace('Main' as any);
    } catch (err: any) {
      setLoading(false);
      dispatch(authFailure(err.message || 'OTP verification failed'));
      Alert.alert('Verification Failed', err.message || 'The OTP entered is incorrect. Try 123456.');
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;
    try {
      await authService.sendOtp(phone);
      setTimer(30);
      Alert.alert('OTP Resent', 'A new verification code has been sent to your phone.');
    } catch (err: any) {
      Alert.alert('Resend Failed', err.message || 'Could not resend OTP.');
    }
  };

  return (
    <ScreenWrapper safeAreaStyle={{ backgroundColor: colors.surface }}>
      <AppHeader title="Verify OTP" onBackPress={() => navigation.goBack()} />
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Verify OTP</Text>
          <Text style={styles.subtitle}>
            Enter the 6-digit code sent to
          </Text>
          <Text style={styles.phoneText}>{phone}</Text>
        </View>

        <OTPInput length={6} onCodeChanged={setCode} />

        <View style={styles.resendRow}>
          {timer > 0 ? (
            <Text style={styles.timerText}>
              Resend OTP in 00:{timer < 10 ? `0${timer}` : timer}
            </Text>
          ) : (
            <TouchableOpacity onPress={handleResend}>
              <Text style={styles.resendLink}>Resend OTP</Text>
            </TouchableOpacity>
          )}
        </View>

        <PrimaryButton
          title="Verify & Continue"
          onPress={handleVerify}
          loading={loading}
          style={styles.verifyButton}
        />

        <View style={styles.securityWrapper}>
          <ShieldIcon width={64} height={64} stroke={colors.primary} />
          <Text style={styles.securityText}>Your data is safe with us</Text>
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: spacing.layout,
    paddingTop: spacing.xl,
    backgroundColor: colors.surface,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.black,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  phoneText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginTop: 4,
  },
  resendRow: {
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  timerText: {
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
    fontWeight: typography.fontWeight.medium,
  },
  resendLink: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: typography.fontWeight.bold,
  },
  verifyButton: {
    marginTop: spacing.xl,
    width: '100%',
  },
  securityWrapper: {
    alignItems: 'center',
    marginTop: spacing.giant,
    gap: spacing.sm,
    opacity: 0.8,
  },
  securityText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },
});
