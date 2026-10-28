import { StackScreenProps } from '@react-navigation/stack';
import React, { useEffect, useState } from 'react';
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
import * as Linking from 'expo-linking';

import { StitchButton } from '../../components/common/StitchButton';
import { loginFailure, loginStart, loginSuccess } from '../../redux/slices/authSlice';
import { AuthRepository } from '../../services/auth/authRepository';
import { AuthResponse } from '../../services/auth/authTypes';
import { borderRadius, colors, spacing, typography } from '../../theme';
import { SvgBrandLogoMark, SvgServicesLock } from '../../assets/svg';
import { AuthStackParamList } from '../../types/navigation';

type Props = StackScreenProps<AuthStackParamList, 'Login'>;

const toUser = (response: AuthResponse | any) =>
  response.user ?? {
    id: response.userId,
    email: response.email,
    fullName: response.fullName,
    role: response.role,
    phone: response.phone,
    phoneVerified: response.phoneVerified,
    profileComplete: response.profileComplete,
    authProvider: response.authProvider,
    profileImageUrl: response.profileImageUrl,
  };

export function LoginScreen({ navigation }: Props) {
  const dispatch = useDispatch();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleMessage, setGoogleMessage] = useState('');

  const notify = (title: string, message: string) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.alert) {
      window.alert(`${title}\n\n${message}`);
      return;
    }
    Alert.alert(title, message);
  };

  useEffect(() => {
    const handleCallbackUrl = async (url: string) => {
      if (!url) return;
      let idToken = '';
      if (url.includes('id_token=')) {
        const match = url.match(/id_token=([^&]+)/);
        if (match) {
          idToken = decodeURIComponent(match[1]);
        }
      }

      if (!idToken && url.includes('error=')) {
        const match = url.match(/error=([^&]+)/);
        const error = match ? decodeURIComponent(match[1]) : 'Google sign-in was cancelled.';
        setGoogleMessage(error);
        notify('Google Sign-in', error);
        return;
      }

      if (idToken) {
        dispatch(loginStart());
        setGoogleLoading(true);
        setGoogleMessage('Completing Google sign-in...');
        try {
          const response = await AuthRepository.googleLogin(idToken);
          const token = response.accessToken || response.token;
          const user = toUser(response);
          dispatch(
            loginSuccess({
              user,
              token,
              refreshToken: response.refreshToken,
            })
          );
          const nextRoute = (user.profileComplete === false ? 'CompleteProfile' : 'Main') as never;
          if (nextRoute === 'CompleteProfile') {
            navigation.navigate('CompleteProfile' as never);
          }
        } catch (err: any) {
          dispatch(loginFailure(err.message || 'Google login failed'));
          const message = err.message || 'Google login failed';
          setGoogleMessage(message);
          notify('Login Failed', message);
        } finally {
          setGoogleLoading(false);
        }
      }
    };

    const handleOpenURL = (event: { url: string }) => {
      handleCallbackUrl(event.url);
    };

    const sub = Linking.addEventListener('url', handleOpenURL);
    Linking.getInitialURL().then((url) => {
      if (url) handleCallbackUrl(url);
    });

    return () => {
      sub.remove();
    };
  }, [dispatch, navigation]);

  const handleGoogleLogin = async () => {
    setGoogleMessage('');
    const clientId = (
      process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
      process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ||
      ''
    ).trim();

    if (!clientId) {
      const message =
        'Please configure EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID in customer-app/.env before using Google sign-in.';
      setGoogleMessage(message);
      notify('Google Client ID missing', message);
      return;
    }

    setGoogleLoading(true);
    setGoogleMessage('Opening Google sign-in...');
    const redirectUri = (
      process.env.EXPO_PUBLIC_GOOGLE_REDIRECT_URI ||
      (Platform.OS === 'web' && typeof window !== 'undefined'
        ? `${window.location.origin}/`
        : Linking.createURL('oauth-callback'))
    ).trim();
    const nonce = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
      clientId
    )}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&response_type=id_token&scope=openid%20email%20profile&nonce=${encodeURIComponent(
      nonce
    )}&prompt=select_account`;

    try {
      if (Platform.OS === 'web') {
        window.location.assign(googleAuthUrl);
        return;
      }
      await Linking.openURL(googleAuthUrl);
    } catch (err: any) {
      const message = err.message || 'Could not open Google sign-in. Please try again.';
      setGoogleMessage(message);
      notify('Google Sign-in Failed', message);
      setGoogleLoading(false);
    }
  };

  const handleLogin = async () => {
    console.log('[DEBUG_LOGIN] email:', JSON.stringify(email), 'password:', JSON.stringify(password));
    if (!email.trim() || !password.trim()) {
      console.log('[DEBUG_LOGIN] Validation failed! Email or password empty!');
      notify('Validation Error', 'Please enter email and password');
      return;
    }

    setLoading(true);
    dispatch(loginStart());
    try {
      const response = await AuthRepository.login({ email: email.trim(), password });
      const user = toUser(response);
      dispatch(
        loginSuccess({
          user,
          token: response.token || response.accessToken!,
          refreshToken: response.refreshToken,
        })
      );
      const nextRoute = (user.profileComplete === false ? 'CompleteProfile' : 'Main') as never;
      if (nextRoute === 'CompleteProfile') {
            navigation.navigate('CompleteProfile' as never);
          }
    } catch (err: any) {
      dispatch(loginFailure(err.message || 'Login failed'));
      notify('Login Failed', err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Top Brand Logo */}
          <View style={styles.brandContainer}>
            <View style={styles.brandIconBox}>
              <SvgBrandLogoMark width={48} height={48} />
            </View>
            <Text style={styles.brandTitleFix}>
              Fix<Text style={styles.brandTitleKart}>Kart</Text>
            </Text>
          </View>

          {/* Heading */}
          <View style={styles.headingSection}>
            <Text style={styles.title}>Welcome back!</Text>
            <Text style={styles.subtitle}>Plumbing services made reliable and fast</Text>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            <Text style={styles.inputLabel}>Email Address</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textInput}
                placeholder="Enter email"
                placeholderTextColor={colors.textMuted}
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={[styles.textInput, { flex: 1 }]}
                placeholder="Enter password"
                placeholderTextColor={colors.textMuted}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeBtn}
                accessibilityRole="button"
                accessibilityLabel="Toggle password visibility"
              >
                <SvgServicesLock width={18} height={18} stroke={showPassword ? colors.primary : colors.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.forgotRow}>
              <TouchableOpacity onPress={() => notify('Password Reset', 'Please contact support to reset your password.')}>
                <Text style={styles.forgotText}>Forgot password?</Text>
              </TouchableOpacity>
            </View>

            <StitchButton
              title="Login"
              onPress={handleLogin}
              loading={loading}
              variant="primary"
              style={styles.loginButton}
            />

            {/* Social Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or continue with</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google Login Button */}
            <TouchableOpacity
              style={styles.socialBtn}
              onPress={handleGoogleLogin}
              disabled={googleLoading}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Continue with Google"
            >
              <Text style={styles.socialIcon}>G</Text>
              <Text style={styles.socialBtnText}>
                {googleLoading ? 'Opening Google...' : 'Continue with Google'}
              </Text>
            </TouchableOpacity>
            {googleMessage ? <Text style={styles.googleMessage}>{googleMessage}</Text> : null}
          </View>

          {/* Signup Redirect Footer */}
          <View style={styles.footerRow}>
            <Text style={styles.footerPrompt}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.footerLink}>Sign up now</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.layout,
    paddingVertical: spacing.lg,
    justifyContent: 'center',
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  brandIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  brandIconText: {
    fontSize: 20,
  },
  brandTitleFix: {
    fontSize: 26,
    fontWeight: typography.fontWeight.black,
    color: colors.primary,
    letterSpacing: -0.5,
  },
  brandTitleKart: {
    color: colors.secondary, // Stitch Emerald
  },
  headingSection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 22,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
    marginBottom: 6,
    marginTop: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    height: 48,
    marginBottom: spacing.xs,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
    height: '100%',
  },
  eyeBtn: {
    padding: 6,
  },
  eyeText: {
    fontSize: 14,
  },
  forgotRow: {
    alignItems: 'flex-end',
    marginTop: 4,
    marginBottom: spacing.md,
  },
  forgotText: {
    fontSize: 12,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
  },
  loginButton: {
    width: '100%',
    marginTop: spacing.xs,
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
    paddingHorizontal: spacing.sm,
    fontSize: 11,
    color: colors.textMuted,
    textTransform: 'uppercase',
    fontWeight: typography.fontWeight.medium,
  },
  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  socialIcon: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4285F4',
    marginRight: 8,
  },
  socialBtnText: {
    fontSize: 13,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  googleMessage: {
    marginTop: spacing.xs,
    fontSize: 11,
    color: colors.error,
    textAlign: 'center',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  footerPrompt: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  footerLink: {
    fontSize: 13,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
});
