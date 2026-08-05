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
import { colors, spacing, typography, borderRadius } from '../../theme';
import { AuthStackParamList } from '../../types/navigation';
import { useDispatch } from 'react-redux';
import { authSuccess, authFailure } from '../../redux/slices/authSlice';
import ShieldIcon from '../../assets/icons/shield-verified.svg';

type Props = StackScreenProps<AuthStackParamList, 'Otp'>;

export function OtpScreen({ route, navigation }: Props) {
  const dispatch = useDispatch();
  const phone = route.params?.phone || '+91 98765 43210';
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(28);

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

  const mm = String(Math.floor(timer / 60)).padStart(2, '0');
  const ss = String(timer % 60).padStart(2, '0');

  return (
    <ScreenWrapper safeAreaStyle={{ backgroundColor: colors.surface }}>
      <AppHeader title="Verify Number" onBackPress={() => navigation.goBack()} />
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Verify Your Number</Text>
          <Text style={styles.subtitle}>
            Enter the 6-digit code sent to
          </Text>
          <Text style={styles.phoneText}>{phone}</Text>
        </View>

        <View style={styles.otpWrapper}>
          <OTPInput length={6} onCodeChanged={setCode} />
        </View>

        <View style={styles.resendRow}>
          {timer > 0 ? (
            <Text style={styles.timerText}>
              Resend OTP in <Text style={styles.timerHighlight}>{mm}:{ss}</Text>
            </Text>
          ) : (
            <TouchableOpacity onPress={handleResend}>
              <Text style={styles.resendLink}>Resend OTP</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.securityWrapper}>
          <View style={styles.shieldBadge}>
            <ShieldIcon width={40} height={40} stroke={colors.primary} />
          </View>
          <Text style={styles.securityText}>Your data is safe with us</Text>
        </View>

        <PrimaryButton
          title="Verify & Continue"
          onPress={handleVerify}
          loading={loading}
          disabled={code.length < 6}
          style={styles.verifyButton}
        />
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
    alignItems: 'flex-start',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.black,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  phoneText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginTop: 2,
  },
  otpWrapper: {
    marginVertical: spacing.md,
    alignItems: 'center',
  },
  resendRow: {
    alignItems: 'flex-start',
    marginVertical: spacing.sm,
  },
  timerText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  timerHighlight: {
    color: colors.primary,
    fontWeight: typography.fontWeight.bold,
  },
  resendLink: {
    fontSize: typography.fontSize.xs,
    color: colors.primary,
    fontWeight: typography.fontWeight.bold,
  },
  securityWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.xl,
    gap: spacing.xs,
  },
  shieldBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  securityText: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
    fontWeight: typography.fontWeight.medium,
  },
  verifyButton: {
    marginBottom: spacing.xl,
    width: '100%',
  },
});
