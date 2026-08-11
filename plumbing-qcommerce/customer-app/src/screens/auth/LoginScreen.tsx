import { StackScreenProps } from '@react-navigation/stack';
import React, { useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useDispatch } from 'react-redux';

import { PrimaryButton } from '../../components/common/PrimaryButton';
import { OutlinedInput } from '../../components/common/OutlinedInput';
import { AuthRepository } from '../../services/auth/authRepository';
import { ProfileRepository } from '../../services/profile/profileRepository';
import { isRenderStagingBackend } from '../../services/mockPolicy';
import { loginFailure, loginStart, loginSuccess } from '../../redux/slices/authSlice';
import { borderRadius, colors, shadows, spacing, typography } from '../../theme';
import { AuthStackParamList } from '../../types/navigation';

type Props = StackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const dispatch = useDispatch();
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [usePasswordLogin, setUsePasswordLogin] = useState(false);
  const [loading, setLoading] = useState(false);
  const phoneInputRef = useRef<TextInput>(null);
  const supportsStagingCredentialLogin = isRenderStagingBackend();

  const handleContinue = async () => {
    if (usePasswordLogin) {
      if (!email || !password) {
        Alert.alert('Invalid Credentials', 'Please enter your email and password.');
        return;
      }

      setLoading(true);
      dispatch(loginStart());

      try {
        const loginResponse = await AuthRepository.login({ email, password });
        const user = await ProfileRepository.getUserProfile();
        dispatch(
          loginSuccess({
            user,
            token: loginResponse.token,
            refreshToken: loginResponse.refreshToken,
          })
        );
        setLoading(false);
        navigation.reset({
          index: 0,
          routes: [{ name: 'Main' as never }],
        });
      } catch (err: any) {
        setLoading(false);
        dispatch(loginFailure(err.message || 'Could not log in.'));
        Alert.alert('Authentication Failed', err.message || 'Could not log in. Please try again.');
      }
      return;
    }

    if (phone.length < 10) {
      Alert.alert('Invalid Number', 'Please enter a valid 10-digit mobile number.');
      return;
    }

    setLoading(true);
    const formattedPhone = `+91 ${phone}`;

    try {
      await AuthRepository.sendOtp(formattedPhone);
      setLoading(false);
      navigation.navigate('Otp', { phone: formattedPhone });
    } catch (err: any) {
      setLoading(false);
      Alert.alert('Authentication Failed', err.message || 'Could not send OTP. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.canGoBack() && navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>Welcome to FixKart</Text>
            <Text style={styles.subtitle}>Enter your mobile number to receive an OTP</Text>
          </View>

          <View style={styles.form}>
            {usePasswordLogin ? (
              <>
                <OutlinedInput
                  label="Email Address"
                  placeholder="customer.qa@fixkart.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
                <OutlinedInput
                  label="Password"
                  placeholder="••••••••"
                  isPassword
                  value={password}
                  onChangeText={setPassword}
                />
              </>
            ) : (
              <>
                <Text style={styles.inputLabel}>Mobile Number</Text>
                <View style={styles.phoneInputRow}>
                  <View style={styles.countryCode}>
                    <Text style={styles.countryCodeText}>+91</Text>
                  </View>
                  <TextInput
                    ref={phoneInputRef}
                    style={styles.textInput}
                    placeholder="98765 43210"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="phone-pad"
                    maxLength={10}
                    value={phone}
                    onChangeText={(val) => setPhone(val.replace(/[^0-9]/g, ''))}
                  />
                </View>
              </>
            )}

            <PrimaryButton
              title={usePasswordLogin ? 'Login' : 'Continue'}
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
                style={styles.socialCard}
                onPress={() => Alert.alert('Google Sign-In', 'Google sign-in uses standard OAuth.')}
                accessibilityRole="button"
              >
                <Text style={styles.socialIcon}>🔍</Text>
                <Text style={styles.socialLabel}>Google</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.socialCard}
                onPress={() => Alert.alert('Apple Sign-In', 'Apple sign-in is not configured for staging.')}
                accessibilityRole="button"
              >
                <Text style={styles.socialIcon}>🍎</Text>
                <Text style={styles.socialLabel}>Apple</Text>
              </TouchableOpacity>
            </View>

            {supportsStagingCredentialLogin ? (
              <TouchableOpacity style={styles.modeSwitch} onPress={() => setUsePasswordLogin((prev) => !prev)}>
                <Text style={styles.modeSwitchText}>
                  {usePasswordLogin ? 'Use OTP Mobile Login' : 'Use Staging Email / Password'}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              New to FixKart?{' '}
              <Text
                style={styles.signUpLink}
                onPress={() => {
                  phoneInputRef.current?.focus();
                }}
              >
                Instant OTP Sign-Up
              </Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background || '#F8F9FF',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.layout,
    paddingBottom: spacing.huge,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLowest || '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border || '#C1C6D6',
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  backButtonText: {
    fontSize: 20,
    color: colors.textPrimary,
    fontWeight: 'bold',
  },
  header: {
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.heading,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontFamily: typography.fontFamily.body,
  },
  form: {
    flex: 1,
  },
  inputLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    fontFamily: typography.fontFamily.body,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  phoneInputRow: {
    flexDirection: 'row',
    height: 52,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border || '#C1C6D6',
    backgroundColor: colors.surfaceContainerLowest || '#FFFFFF',
    overflow: 'hidden',
    marginBottom: spacing.xl,
  },
  countryCode: {
    backgroundColor: colors.surfaceContainerLow || '#EFF4FF',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    borderRightWidth: 1,
    borderRightColor: colors.border || '#C1C6D6',
  },
  countryCodeText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.body,
    color: colors.textPrimary,
  },
  textInput: {
    flex: 1,
    paddingHorizontal: spacing.md,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.body,
    color: colors.textPrimary,
  },
  continueButton: {
    width: '100%',
    marginBottom: spacing.xl,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border || '#C1C6D6',
  },
  dividerText: {
    marginHorizontal: spacing.md,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    fontFamily: typography.fontFamily.body,
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  socialRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  socialCard: {
    flex: 1,
    flexDirection: 'row',
    height: 52,
    borderWidth: 1,
    borderColor: colors.border || '#C1C6D6',
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceContainerLowest || '#FFFFFF',
  },
  socialIcon: {
    fontSize: 18,
  },
  socialLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    fontFamily: typography.fontFamily.body,
    color: colors.textPrimary,
  },
  modeSwitch: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  modeSwitchText: {
    color: colors.primaryContainer || colors.primary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    fontFamily: typography.fontFamily.body,
  },
  footer: {
    alignItems: 'center',
    marginTop: 'auto',
    paddingTop: spacing.huge,
  },
  footerText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontFamily: typography.fontFamily.body,
  },
  signUpLink: {
    color: colors.primaryContainer || colors.primary,
    fontWeight: typography.fontWeight.semibold,
    fontFamily: typography.fontFamily.body,
  },
});

