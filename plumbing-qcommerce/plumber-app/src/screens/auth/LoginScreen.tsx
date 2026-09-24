import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { useDispatch } from 'react-redux';

import { PrimaryButton } from '../../components/common/PrimaryButton';
import { ScreenWrapper } from '../../components/common/ScreenWrapper';
import { authService } from '../../services/auth/authService';
import { borderRadius, colors, shadows, spacing, typography } from '../../theme';
import { AuthStackParamList } from '../../types/navigation';
import { authStart, authSuccess, authFailure } from '../../redux/slices/authSlice';
import GoogleIcon from '../../assets/icons/google.svg';
import MailIcon from '../../assets/icons/chat.svg';
import PhoneIcon from '../../assets/icons/phone.svg';

type Props = StackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState<'mobile' | 'email'>('mobile');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  const handleContinue = async () => {
    setErrorMessage('');
    setStatusMessage('');
    if (activeTab === 'mobile') {
      if (!/^\d{10}$/.test(phone)) {
        setErrorMessage('Enter a valid 10-digit mobile number.');
        return;
      }
      setLoading(true);
      try {
        const formattedPhone = `+91 ${phone}`;
        await authService.sendOtp(formattedPhone);
        navigation.navigate('Otp', { phone: formattedPhone });
      } catch (err: any) {
        setErrorMessage(err.message || 'We could not send an OTP. Check your number and try again.');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!email.trim() || !password.trim()) {
      dispatch(authFailure('Please fill in all credentials fields'));
      setErrorMessage('Enter both your email address and password.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrorMessage('Enter a valid email address.');
      return;
    }

    setLoading(true);
    dispatch(authStart());

    try {
      const data = await authService.loginWithCredentials(email.trim(), password);
      dispatch(authSuccess(data));
      navigation.replace('Main' as any);
    } catch (err: any) {
      dispatch(authFailure(err.message || 'Could not authenticate'));
      setErrorMessage(err.message || 'Could not log in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper safeAreaStyle={{ backgroundColor: colors.surface }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Welcome Back!</Text>
            <Text style={styles.subtitle}>Login to continue</Text>
          </View>

          {/* Tab Switcher */}
          <View style={styles.tabContainer} accessibilityRole="tablist">
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'mobile' && styles.tabButtonActive]}
              onPress={() => { setActiveTab('mobile'); setErrorMessage(''); setStatusMessage(''); }}
              accessibilityRole="tab"
              accessibilityState={{ selected: activeTab === 'mobile' }}
              accessibilityLabel="Log in with mobile number"
            >
              <Text style={[styles.tabText, activeTab === 'mobile' && styles.tabTextActive]}>
                Mobile
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'email' && styles.tabButtonActive]}
              onPress={() => { setActiveTab('email'); setErrorMessage(''); setStatusMessage(''); }}
              accessibilityRole="tab"
              accessibilityState={{ selected: activeTab === 'email' }}
              accessibilityLabel="Log in with email"
            >
              <Text style={[styles.tabText, activeTab === 'email' && styles.tabTextActive]}>
                Email
              </Text>
            </TouchableOpacity>
          </View>

          {(errorMessage || statusMessage) ? (
            <Text
              accessibilityRole={errorMessage ? 'alert' : undefined}
              accessibilityLiveRegion="polite"
              style={errorMessage ? styles.feedbackError : styles.feedbackStatus}
            >
              {errorMessage || statusMessage}
            </Text>
          ) : null}

          <View style={styles.form}>
            {activeTab === 'mobile' ? (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Mobile Number</Text>
                <View style={styles.phoneInputContainer}>
                  <Text style={styles.countryCode}>+91</Text>
                  <View style={styles.inputDivider} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter mobile number"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="number-pad"
                    maxLength={10}
                    value={phone}
                    onChangeText={(val) => { setPhone(val.replace(/\D/g, '')); setErrorMessage(''); }}
                    accessibilityLabel="Mobile number"
                    textContentType="telephoneNumber"
                    autoComplete="tel"
                  />
                </View>
              </View>
            ) : (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Email Address</Text>
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.textInput}
                      placeholder="plumber@plumbcommerce.com"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      value={email}
                      onChangeText={(value) => { setEmail(value); setErrorMessage(''); }}
                      accessibilityLabel="Email address"
                      textContentType="emailAddress"
                      autoComplete="email"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Password</Text>
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.textInput}
                      placeholder="********"
                      placeholderTextColor={colors.textMuted}
                      secureTextEntry
                      value={password}
                      onChangeText={(value) => { setPassword(value); setErrorMessage(''); }}
                      accessibilityLabel="Password"
                      textContentType="password"
                      autoComplete="current-password"
                    />
                  </View>
                </View>
              </>
            )}

            <View style={styles.rememberForgotRow}>
              <TouchableOpacity
                style={styles.rememberMe}
                onPress={() => setRememberMe(!rememberMe)}
                accessibilityRole="checkbox"
                accessibilityLabel="Remember me"
                accessibilityState={{ checked: rememberMe }}
                aria-checked={rememberMe}
              >
                <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                  {rememberMe && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.rememberText}>Remember me</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => { setErrorMessage(''); setStatusMessage('Password reset is not configured for the Plumber app. Please contact support.'); }} accessibilityRole="button" accessibilityLabel="Forgot password">
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>

            <PrimaryButton
              title="Continue"
              onPress={handleContinue}
              loading={loading}
              style={styles.continueButton}
            />

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or continue with</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.socialRow}>
              <TouchableOpacity
                style={styles.socialButton}
                onPress={() => { setErrorMessage(''); setStatusMessage('Google sign-in is not configured for the Plumber app staging build.'); }}
                accessibilityRole="button"
                accessibilityLabel="Google sign in unavailable"
              >
                <Text style={styles.googleBadge}>G</Text>
                <Text style={styles.socialLabel}>Google</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.socialButton}
                onPress={() => { setErrorMessage(''); setStatusMessage('Facebook sign-in is not configured for the Plumber app staging build.'); }}
                accessibilityRole="button"
                accessibilityLabel="Facebook sign in unavailable"
              >
                <Text style={styles.fbBadge}>f</Text>
                <Text style={styles.socialLabel}>Facebook</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.footer}>
            <View style={styles.footerRow}>
              <Text style={styles.footerText}>New here? </Text>
              <TouchableOpacity
                style={styles.signUpLink}
                onPress={() => {
                  navigation.navigate('Register');
                }}
                accessibilityRole="button"
                accessibilityLabel="Sign up"
              >
                <Text style={styles.signUpLinkText}>Sign up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.layout,
    paddingBottom: spacing.huge,
    backgroundColor: colors.surface,
  },
  header: {
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.black,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: 4,
    marginBottom: spacing.xl,
  },
  tabButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: borderRadius.xs,
  },
  tabButtonActive: {
    backgroundColor: colors.surface,
    ...shadows.sm,
  },
  tabText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: typography.fontWeight.bold,
  },
  form: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  inputContainer: {
    height: 52,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  phoneInputContainer: {
    height: 52,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
  },
  countryCode: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  inputDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },
  textInput: {
    flex: 1,
    paddingHorizontal: spacing.sm,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  rememberForgotRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  rememberMe: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1.5,
    borderColor: colors.borderDark,
    borderRadius: borderRadius.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: 'bold',
  },
  rememberText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.semibold,
  },
  forgotText: {
    fontSize: typography.fontSize.xs,
    color: colors.primary,
    fontWeight: typography.fontWeight.bold,
  },
  continueButton: {
    width: '100%',
    marginVertical: spacing.md,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    marginHorizontal: spacing.md,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.textSecondary,
  },
  socialRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    height: 48,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface,
  },
  googleBadge: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#EF4444',
  },
  fbBadge: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2563EB',
  },
  socialLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  footer: {
    alignItems: 'center',
    marginTop: 'auto',
    paddingTop: spacing.xl,
  },
  footerText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },
  signUpLink: {
    marginLeft: 4,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  signUpLinkText: {
    color: colors.primary,
    fontWeight: typography.fontWeight.bold,
  },
  feedbackError: {
    color: colors.error,
    backgroundColor: colors.errorContainer,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    marginBottom: spacing.md,
    fontSize: typography.fontSize.sm,
  },
  feedbackStatus: {
    color: colors.textSecondary,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    marginBottom: spacing.md,
    fontSize: typography.fontSize.sm,
  },
});
