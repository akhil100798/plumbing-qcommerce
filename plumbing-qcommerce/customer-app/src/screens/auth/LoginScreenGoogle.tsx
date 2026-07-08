import { StackScreenProps } from '@react-navigation/stack';
import React, { useRef, useState, useEffect } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';
import { useDispatch } from 'react-redux';
import * as Linking from 'expo-linking';

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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [usePasswordLogin, setUsePasswordLogin] = useState(false);
  const [loading, setLoading] = useState(false);

  const phoneInputRef = useRef<TextInput>(null);
  const supportsStagingCredentialLogin = isRenderStagingBackend();

  useEffect(() => {
    const handleCallbackUrl = async (url: string) => {
      if (!url) return;
      let idToken = '';
      if (url.includes('id_token=')) {
        const match = url.match(/id_token=([^&]+)/);
        if (match) {
          idToken = match[1];
        }
      }

      if (idToken) {
        dispatch(loginStart());
        try {
          const response = await AuthRepository.googleLogin(idToken);
          dispatch(
            loginSuccess({
              user: response.user,
              token: response.accessToken,
              refreshToken: response.refreshToken,
            })
          );
          if (response.user.profileComplete === false) {
            navigation.reset({
              index: 0,
              routes: [{ name: 'CompleteProfile' as never }],
            });
          } else {
            navigation.reset({
              index: 0,
              routes: [{ name: 'Main' as never }],
            });
          }
        } catch (err: any) {
          dispatch(loginFailure(err.message || 'Google login failed'));
          Alert.alert('Login Failed', err.message || 'Google login failed');
        }
      }
    };

    if (Platform.OS === 'web') {
      handleCallbackUrl(window.location.href);
    } else {
      Linking.getInitialURL().then((url) => {
        if (url) handleCallbackUrl(url);
      });
      const subscription = Linking.addEventListener('url', (event) => {
        handleCallbackUrl(event.url);
      });
      return () => subscription.remove();
    }
  }, [navigation, dispatch]);

  const handleGoogleLogin = () => {
    const clientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '';
    if (!clientId) {
      Alert.alert(
        'Google Client ID missing',
        'Please configure EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID in your environment variables.'
      );
      return;
    }
    const redirectUri = Linking.createURL('oauth-callback');
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
      clientId
    )}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&response_type=id_token&scope=openid%20email%20profile&nonce=random_nonce`;

    if (Platform.OS === 'web') {
      window.location.href = googleAuthUrl;
    } else {
      Linking.openURL(googleAuthUrl);
    }
  };

  const handleContinue = async () => {
    if (usePasswordLogin) {
      if (!email.trim() || !password.trim()) {
        Alert.alert('Error', 'Please enter email and password');
        return;
      }
      dispatch(loginStart());
      setLoading(true);
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
        if (user && user.profileComplete === false) {
          navigation.reset({
            index: 0,
            routes: [{ name: 'CompleteProfile' as never }],
          });
        } else {
          navigation.reset({
            index: 0,
            routes: [{ name: 'Main' as never }],
          });
        }
      } catch (err: any) {
        dispatch(loginFailure(err.message || 'Could not log in.'));
        Alert.alert('Error', err.message || 'Invalid credentials');
      } finally {
        setLoading(false);
      }
    } else {
      if (phone.length < 10) {
        Alert.alert('Error', 'Please enter a valid 10-digit mobile number');
        return;
      }
      const formattedPhone = `+91 ${phone}`;
      setLoading(true);
      try {
        await AuthRepository.sendOtp(formattedPhone);
        navigation.navigate('Otp', { phone: formattedPhone });
      } catch (err: any) {
        Alert.alert('Error', err.message || 'Failed to send OTP');
      } finally {
        setLoading(false);
      }
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
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>Welcome to PlumbCommerce</Text>
            <Text style={styles.subtitle}>Sign in to access premium plumbing services</Text>
          </View>

          <View style={styles.form}>
            {usePasswordLogin ? (
              <View>
                <Text style={styles.inputLabel}>Email Address</Text>
                <View style={styles.singleInputRow}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter email"
                    keyboardType="email-address"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
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
                  />
                </View>
              </View>
            ) : (
              <View>
                <Text style={styles.inputLabel}>Mobile Number</Text>
                <View style={styles.phoneInputRow}>
                  <View style={styles.countryCode}>
                    <Text style={styles.countryCodeText}>+91</Text>
                  </View>
                  <TextInput
                    ref={phoneInputRef}
                    style={[styles.textInput, styles.flexInput]}
                    placeholder="10-digit number"
                    keyboardType="phone-pad"
                    maxLength={10}
                    value={phone}
                    onChangeText={(val) => setPhone(val.replace(/[^0-9]/g, ''))}
                  />
                </View>
              </View>
            )}

            <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
              <Text style={styles.continueButtonText}>
                {usePasswordLogin ? 'Sign In' : 'Send OTP'}
              </Text>
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or continue with</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.socialRow}>
              <TouchableOpacity style={styles.googleButton} onPress={handleGoogleLogin}>
                <Text style={styles.googleIcon}>G</Text>
                <Text style={styles.googleButtonText}>Continue with Google</Text>
              </TouchableOpacity>
            </View>

            {supportsStagingCredentialLogin ? (
              <TouchableOpacity
                style={styles.modeSwitch}
                onPress={() => setUsePasswordLogin((prev) => !prev)}
              >
                <Text style={styles.modeSwitchText}>
                  {usePasswordLogin ? 'Use Mobile OTP Login' : 'Demo login (Staging Email/Password)'}
                </Text>
              </TouchableOpacity>
            ) : null}

            {__DEV__ || isRenderStagingBackend() ? (
              <TouchableOpacity
                style={[styles.modeSwitch, { marginTop: 10 }]}
                onPress={() => navigation.navigate('CompleteProfile')}
              >
                <Text style={[styles.modeSwitchText, { color: colors.primary }]}>
                  Demo: Open Complete Profile Screen
                </Text>
              </TouchableOpacity>
            ) : null}
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
  backButtonText: {
    fontSize: 20,
    color: '#0F172A',
    fontWeight: 'bold',
  },
  header: {
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0F172A',
    fontFamily: typography.bold,
  },
  subtitle: {
    fontSize: 15,
    color: '#64748B',
    marginTop: spacing.xs,
    fontFamily: typography.regular,
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
    fontFamily: typography.semiBold,
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
    fontFamily: typography.regular,
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countryCode: {
    height: 48,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRightWidth: 0,
    borderTopLeftRadius: borderRadius.md,
    borderBottomLeftRadius: borderRadius.md,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: spacing.sm,
    justifyContent: 'center',
  },
  countryCodeText: {
    fontSize: 15,
    color: '#475569',
    fontFamily: typography.semiBold,
  },
  flexInput: {
    flex: 1,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
  },
  continueButton: {
    height: 48,
    backgroundColor: colors.primary || '#2563EB',
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: typography.bold,
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
    fontFamily: typography.regular,
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
  googleIcon: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4285F4',
    marginRight: spacing.sm,
  },
  googleButtonText: {
    fontSize: 16,
    color: '#334155',
    fontWeight: '600',
    fontFamily: typography.semiBold,
  },
  modeSwitch: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
    marginTop: spacing.sm,
  },
  modeSwitchText: {
    fontSize: 14,
    color: '#64748B',
    fontFamily: typography.semiBold,
  },
});
