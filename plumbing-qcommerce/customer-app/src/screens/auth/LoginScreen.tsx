import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { FixKartLogo, ShieldCheckIcon } from '../../assets/svg/Icons';
import { useAuth } from '../../services/authService';

export interface LoginScreenProps {
  onSendOtp: (phone: string) => void;
  onSkip?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onSendOtp, onSkip }) => {
  const { loginWithPhone } = useAuth();
  const [phone, setPhone] = useState<string>('9876511223');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleContinue = async () => {
    const clean = phone.replace(/[^0-9]/g, '');
    if (clean.length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await loginWithPhone(clean);
      setIsLoading(false);

      if (res.success) {
        onSendOtp(clean);
      } else {
        setErrorMessage(res.message || 'Unable to send OTP. Please try again.');
      }
    } catch {
      setIsLoading(false);
      setErrorMessage('Unable to connect to server. Please try again.');
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.headerRow}>
          <FixKartLogo size={36} showText={true} />
          {onSkip ? (
            <TouchableOpacity
              onPress={onSkip}
              accessibilityLabel="Skip login"
              accessibilityRole="button"
            >
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>Your Trusted Plumbing & Home Service App</Text>
          <Text style={styles.subtitle}>
            Enter your mobile number to book certified plumbers and track service in real-time.
          </Text>

          <View style={styles.inputCard}>
            <Text style={styles.inputLabel}>Mobile Number</Text>
            <View style={styles.inputRow}>
              <View style={styles.countryCode}>
                <Text style={styles.flag}>🇮🇳</Text>
                <Text style={styles.codeText}>+91</Text>
              </View>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={(text: string) => {
                  setPhone(text.replace(/[^0-9]/g, ''));
                  if (errorMessage) {
                    setErrorMessage(null);
                  }
                }}
                placeholder="Enter 10-digit number"
                placeholderTextColor={colors.outline}
                keyboardType="phone-pad"
                maxLength={10}
                editable={!isLoading}
                onSubmitEditing={handleContinue}
                returnKeyType="done"
                accessibilityLabel="Mobile number input"
              />
            </View>
            {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
          </View>

          <TouchableOpacity
            style={[styles.continueBtn, (phone.length < 10 || isLoading) && styles.disabledBtn]}
            onPress={handleContinue}
            disabled={phone.length < 10 || isLoading}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Get OTP button"
          >
            {isLoading ? (
              <ActivityIndicator color={colors.onPrimary} size="small" />
            ) : (
              <Text style={styles.continueBtnText}>Get OTP</Text>
            )}
          </TouchableOpacity>

          <View style={styles.trustBanner}>
            <ShieldCheckIcon size={18} color={colors.primary} />
            <Text style={styles.trustText}>100% Safe & Verified FixKart Professionals</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.termsText}>
            By continuing, you agree to FixKart’s{' '}
            <Text style={styles.termsLink}>Terms of Service</Text> &{' '}
            <Text style={styles.termsLink}>Privacy Policy</Text>.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skipText: {
    fontFamily: typography.button.fontFamily,
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
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
  inputCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.surfaceVariant,
    marginBottom: spacing.lg,
  },
  inputLabel: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    fontWeight: '700',
    color: colors.secondary,
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countryCode: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 12,
    borderRightWidth: 1,
    borderRightColor: colors.surfaceVariant,
    marginRight: 12,
  },
  flag: {
    fontSize: 18,
    marginRight: 4,
  },
  codeText: {
    fontFamily: typography.h4.fontFamily,
    fontSize: 16,
    fontWeight: '600',
    color: colors.onBackground,
  },
  input: {
    flex: 1,
    fontFamily: typography.h3.fontFamily,
    fontSize: 18,
    fontWeight: '600',
    color: colors.onBackground,
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  errorText: {
    fontSize: 12,
    color: colors.error,
    marginTop: 6,
    fontWeight: '500',
  },
  continueBtn: {
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
  },
  disabledBtn: {
    backgroundColor: colors.outlineVariant,
    shadowOpacity: 0,
    elevation: 0,
  },
  continueBtnText: {
    fontFamily: typography.button.fontFamily,
    color: colors.onPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  trustBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryFixed,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginTop: spacing.xl,
  },
  trustText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: 8,
  },
  footer: {
    alignItems: 'center',
  },
  termsText: {
    fontSize: 11,
    color: colors.secondary,
    textAlign: 'center',
    lineHeight: 16,
  },
  termsLink: {
    color: colors.primary,
    fontWeight: '600',
  },
});
