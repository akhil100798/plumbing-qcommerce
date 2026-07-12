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

import { AppIcon } from '../../components/common/AppIcon';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { SecondaryButton } from '../../components/common/SecondaryButton';
import { loginFailure, loginStart, loginSuccess } from '../../redux/slices/authSlice';
import { AuthRepository } from '../../services/auth/authRepository';
import { AuthResponse } from '../../services/auth/authTypes';
import { borderRadius, colors, spacing, typography } from '../../theme';
import { AuthStackParamList } from '../../types/navigation';
import ArrowLeftIcon from '../../assets/icons/arrow-left.svg';
import GoogleIcon from '../../assets/icons/google.svg';

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
          navigation.reset({
            index: 0,
            routes: [{ name: nextRoute }],
          });
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
    if (!email.trim() || !password.trim()) {
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
      navigation.reset({
        index: 0,
        routes: [{ name: nextRoute }],
      });
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
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <AppIcon icon={ArrowLeftIcon} size={20} color={colors.textPrimary} />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>Welcome back!</Text>
            <Text style={styles.subtitle}>Sign in with your email and password</Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.inputLabel}>Email Address</Text>
            <View style={styles.singleInputRow}>
              <TextInput
                style={styles.textInput}
                placeholder="Enter email"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.singleInputRow}>
              <TextInput
                style={styles.textInput}
                placeholder="Enter password"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <PrimaryButton
              title="Login"
              onPress={handleLogin}
              loading={loading}
              style={styles.continueButton}
            />

            <TouchableOpacity
              style={styles.registerLinkRow}
              onPress={() => navigation.navigate('Register')}
            >
              <Text style={styles.registerLinkText}>Create Account</Text>
            </TouchableOpacity>

            <View style={styles.futureCard}>
              <Text style={styles.futureTitle}>OTP login coming later</Text>
              <Text style={styles.futureText}>
                Phase 1 uses email/password login and registration for customers.
              </Text>
            </View>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or continue with</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.socialRow}>
              <SecondaryButton
                title={googleLoading ? 'Opening Google...' : 'Continue with Google'}
                onPress={handleGoogleLogin}
                disabled={googleLoading}
                outlineColor={colors.border}
                textColor={colors.textPrimary}
                iconLeft={<AppIcon icon={GoogleIcon} size={20} />}
                style={styles.googleButton}
              />
              {googleMessage ? <Text style={styles.googleMessage}>{googleMessage}</Text> : null}
            </View>
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
    padding: spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    marginBottom: spacing.md,
  },
  header: {
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0F172A',
    fontFamily: typography.fontFamily.bold,
  },
  subtitle: {
    fontSize: 15,
    color: '#64748B',
    marginTop: spacing.xs,
    fontFamily: typography.fontFamily.regular,
  },
  form: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    fontFamily: typography.fontFamily.medium,
  },
  singleInputRow: {
    width: '100%',
  },
  textInput: {
    height: 48,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    fontSize: 15,
    color: '#0F172A',
    backgroundColor: '#FAFAFA',
    fontFamily: typography.fontFamily.regular,
  },
  continueButton: {
    height: 48,
    backgroundColor: colors.primary || '#2563EB',
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  registerLinkRow: {
    alignItems: 'center',
    marginTop: spacing.md,
  },
  registerLinkText: {
    fontSize: 14,
    color: colors.primary,
    fontFamily: typography.fontFamily.medium,
  },
  futureCard: {
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  futureTitle: {
    color: '#1D4ED8',
    fontSize: 14,
    fontFamily: typography.fontFamily.bold,
  },
  futureText: {
    marginTop: spacing.xs,
    color: '#475569',
    fontSize: 13,
    lineHeight: 18,
    fontFamily: typography.fontFamily.regular,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    fontSize: 14,
    color: '#64748B',
    paddingHorizontal: spacing.sm,
    fontFamily: typography.fontFamily.regular,
  },
  socialRow: {
    width: '100%',
    marginBottom: spacing.md,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: borderRadius.md,
    height: 48,
    width: '100%',
  },
  googleMessage: {
    marginTop: spacing.sm,
    color: colors.textSecondary,
    fontSize: typography.fontSize.xs,
    lineHeight: typography.lineHeight.tight,
    textAlign: 'center',
  },
});
