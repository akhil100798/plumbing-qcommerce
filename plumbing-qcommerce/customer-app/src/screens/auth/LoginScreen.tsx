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
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>?</Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>Welcome Back!</Text>
            <Text style={styles.subtitle}>Login to continue</Text>
          </View>

          <View style={styles.form}>
            {usePasswordLogin ? (
              <>
                <Text style={styles.inputLabel}>Email Address</Text>
                <View style={styles.singleInputRow}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="customer@plumbcommerce.com"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                  />
                </View>

                <Text style={styles.inputLabel}>Password</Text>
                <View style={styles.singleInputRow}>
                  <TextInput
                    style={styles.textInput}
                placeholder="********"
                    placeholderTextColor={colors.textMuted}
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                  />
                </View>
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
              <TouchableOpacity style={styles.socialCard} onPress={() => Alert.alert('Google login', 'Use the main Google login screen for OAuth sign-in.')}>
                <Text style={styles.socialIcon}>??</Text>
                <Text style={styles.socialLabel}>Google</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialCard} onPress={() => Alert.alert('Apple login', 'Apple sign-in is not configured for staging yet.')}>
                <Text style={styles.socialIcon}>??</Text>
                <Text style={styles.socialLabel}>Apple</Text>
              </TouchableOpacity>
            </View>

            {supportsStagingCredentialLogin ? (
              <TouchableOpacity style={styles.modeSwitch} onPress={() => setUsePasswordLogin((prev) => !prev)}>
                <Text style={styles.modeSwitchText}>
                  {usePasswordLogin ? 'Use OTP Login' : 'Use Staging Email / Password'}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              New here?{' '}
              <Text
                style={styles.signUpLink}
                onPress={() => {
                  Alert.alert(
                    'Quick Registration',
                    'No separate registration form is required! Simply enter your 10-digit mobile number above and press "Continue". We will verify your number via OTP and set up your account instantly.'
                  );
                  phoneInputRef.current?.focus();
                }}
              >
                Create an account
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
    backgroundColor: colors.surface,
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
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  backButtonText: {
    fontSize: 24,
    color: colors.textPrimary,
    fontWeight: 'bold',
  },
  header: {
    marginBottom: spacing.huge,
  },
  title: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.black,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },
  form: {
    flex: 1,
  },
  inputLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  phoneInputRow: {
    flexDirection: 'row',
    height: 56,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: spacing.xl,
  },
  singleInputRow: {
    height: 56,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: spacing.xl,
  },
  countryCode: {
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    borderRightWidth: 1.5,
    borderRightColor: colors.border,
  },
  countryCodeText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  textInput: {
    flex: 1,
    paddingHorizontal: spacing.md,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  continueButton: {
    width: '100%',
    marginBottom: spacing.huge,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
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
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    ...shadows.sm,
  },
  socialIcon: {
    fontSize: 20,
  },
  socialLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  modeSwitch: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  modeSwitchText: {
    color: colors.primary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  },
  footer: {
    alignItems: 'center',
    marginTop: 'auto',
    paddingTop: spacing.huge,
  },
  footerText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },
  signUpLink: {
    color: colors.primary,
    fontWeight: typography.fontWeight.bold,
  },
});
