import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { ChevronLeftIcon, CheckCircleIcon } from '../../assets/svg/Icons';
import { useAuth } from '../../services/authService';

export interface OtpScreenProps {
  phone: string;
  onVerify: () => void;
  onBack: () => void;
}

export const OtpScreen: React.FC<OtpScreenProps> = ({ phone, onVerify, onBack }) => {
  const { verifyOtp, loginWithPhone } = useAuth();
  const [otp, setOtp] = useState<string>('123456');
  const [timer, setTimer] = useState<number>(30);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleVerify = async () => {
    if (otp.length !== 6) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await verifyOtp(phone, otp);
      setIsLoading(false);

      if (res.success) {
        onVerify();
      } else {
        setErrorMessage(res.message || 'Invalid or expired OTP. Please try again.');
      }
    } catch {
      setIsLoading(false);
      setErrorMessage('Unable to connect to server. Please try again.');
    }
  };

  const handleResend = async () => {
    setTimer(30);
    setErrorMessage(null);
    try {
      await loginWithPhone(phone);
    } catch {
      setErrorMessage('Unable to resend OTP right now.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7} accessibilityLabel="Back button">
          <ChevronLeftIcon size={24} color={colors.onBackground} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Verify with OTP</Text>
        <Text style={styles.subtitle}>
          We’ve sent a 6-digit code to <Text style={styles.phoneHighlight}>+91 {phone}</Text>
        </Text>

        <View style={styles.otpBoxContainer}>
          {[0, 1, 2, 3, 4, 5].map((index) => {
            const digit = otp[index] || '';
            return (
              <View
                key={index}
                style={[
                  styles.otpDigitBox,
                  digit ? styles.otpDigitFilled : styles.otpDigitEmpty,
                ]}
              >
                <Text style={styles.otpDigitText}>{digit}</Text>
              </View>
            );
          })}
        </View>

        {/* Real hidden input */}
        <TextInput
          style={styles.hiddenInput}
          value={otp}
          onChangeText={(val: string) => {
            setOtp(val.replace(/[^0-9]/g, '').slice(0, 6));
            setErrorMessage(null);
          }}
          keyboardType="number-pad"
          maxLength={6}
          autoFocus={true}
          editable={!isLoading}
          onSubmitEditing={handleVerify}
          returnKeyType="done"
          accessibilityLabel="OTP input"
        />

        <View style={styles.demoNotice}>
          <CheckCircleIcon size={16} color={colors.success} />
          <Text style={styles.demoNoticeText}>Demo / QA test OTP: 123456</Text>
        </View>

        {errorMessage ? (
          <Text style={styles.errorText}>{errorMessage}</Text>
        ) : null}

        <TouchableOpacity
          style={[styles.verifyBtn, (otp.length < 6 || isLoading) && styles.disabledBtn]}
          onPress={handleVerify}
          disabled={otp.length < 6 || isLoading}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Verify and Proceed button"
        >
          {isLoading ? (
            <ActivityIndicator color={colors.onPrimary} size="small" />
          ) : (
            <Text style={styles.verifyBtnText}>Verify & Proceed</Text>
          )}
        </TouchableOpacity>

        <View style={styles.resendRow}>
          {timer > 0 ? (
            <Text style={styles.resendTimer}>Resend code in 00:{timer < 10 ? `0${timer}` : timer}</Text>
          ) : (
            <TouchableOpacity onPress={handleResend} accessibilityRole="button">
              <Text style={styles.resendAction}>Resend OTP via SMS</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  header: {
    marginBottom: spacing.lg,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.surfaceVariant,
  },
  content: {
    flex: 1,
  },
  title: {
    fontFamily: typography.h2.fontFamily,
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
    color: colors.onBackground,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: typography.body2.fontFamily,
    fontSize: 14,
    fontWeight: '400',
    color: colors.secondary,
    lineHeight: 20,
    marginBottom: spacing.xl,
  },
  phoneHighlight: {
    fontWeight: '700',
    color: colors.onBackground,
  },
  otpBoxContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  otpDigitBox: {
    width: 48,
    height: 54,
    borderRadius: 12,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  otpDigitEmpty: {
    borderColor: colors.surfaceVariant,
  },
  otpDigitFilled: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryFixed,
  },
  otpDigitText: {
    fontFamily: typography.h2.fontFamily,
    fontSize: 22,
    fontWeight: '700',
    color: colors.onBackground,
  },
  hiddenInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0.01,
  },
  demoNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.successContainer,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  demoNoticeText: {
    fontSize: 12,
    color: colors.onSuccess,
    fontWeight: '600',
    marginLeft: 6,
  },
  errorText: {
    fontSize: 12,
    color: colors.error,
    marginBottom: spacing.md,
    fontWeight: '600',
  },
  verifyBtn: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: spacing.lg,
  },
  disabledBtn: {
    backgroundColor: colors.outlineVariant,
    shadowOpacity: 0,
    elevation: 0,
  },
  verifyBtnText: {
    fontFamily: typography.button.fontFamily,
    color: colors.onPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  resendRow: {
    alignItems: 'center',
  },
  resendTimer: {
    fontSize: 13,
    color: colors.secondary,
  },
  resendAction: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
});
