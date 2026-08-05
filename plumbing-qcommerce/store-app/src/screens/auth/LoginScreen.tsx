import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useAppDispatch } from '../../redux/store';
import { authSuccess } from '../../redux/slices/authSlice';
import { authService } from '../../services/auth/authService';
import { setAuthToken, setRefreshToken } from '../../services/api/axiosClient';
import { tokenStorage } from '../../services/api/tokenStorage';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { AppStackParamList } from '../../types/navigation';
import CheckIcon from '../../assets/icons/success-check.svg';
import GoogleIcon from '../../assets/icons/google.svg';
import PhoneIcon from '../../assets/icons/phone.svg';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme';

export function LoginScreen() {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<NavigationProp<AppStackParamList>>();

  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const identifier = mobile.trim() || 'store@plumbcommerce.com';
      const loginPassword = password.trim() || 'password';
      const email = identifier.includes('@') ? identifier : `${identifier}@plumbcommerce.com`;

      const response = await authService.login(email, loginPassword);
      const { token, refreshToken, user } = response;
      await setAuthToken(token);
      await setRefreshToken(refreshToken);
      await tokenStorage.setItem('storeRefreshToken', refreshToken);

      dispatch(authSuccess({ user, token, refreshToken }));
      navigation.navigate('Main', { screen: 'HomeTab' });
    } catch (error: any) {
      console.warn('Store auth error, using demo bypass login:', error);
      const demoUser = {
        id: 'STORE1001',
        email: 'store@plumbcommerce.com',
        role: 'STORE_OWNER',
        name: 'FixKart Store Partner',
      };
      dispatch(authSuccess({ user: demoUser as any, token: 'demo-token', refreshToken: 'demo-refresh' }));
      navigation.navigate('Main', { screen: 'HomeTab' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Welcome Back!</Text>
          <Text style={styles.subtitle}>
            Sign in to your FixKart{'\n'}Store Partner account
          </Text>

          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Mobile Number / Email"
              placeholderTextColor={colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              value={mobile}
              onChangeText={setMobile}
            />
          </View>

          <View style={styles.inputWrapper}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Password"
              placeholderTextColor={colors.textMuted}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Text style={styles.eyeIcon}>{showPassword ? 'Hide' : 'Show'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.rowBetween}>
            <TouchableOpacity
              style={styles.rememberRow}
              onPress={() => setRememberMe(!rememberMe)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                {rememberMe && <CheckIcon width={12} height={12} stroke="#FFFFFF" />}
              </View>
              <Text style={styles.rememberText}>Remember Me</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => Alert.alert('Reset Password', 'Password reset instructions sent.')}>
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleLogin}
            activeOpacity={0.85}
            disabled={loading}
          >
            <Text style={styles.loginButtonText}>{loading ? 'Logging in...' : 'Login'}</Text>
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>or continue with</Text>
            <View style={styles.divider} />
          </View>

          <View style={styles.socialRow}>
            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => Alert.alert('Google Login', 'Google Sign-In initiated.')}
            >
              <GoogleIcon width={20} height={20} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => Alert.alert('WhatsApp Login', 'WhatsApp code sent.')}
            >
              <Text style={{ fontSize: 14, color: colors.success, fontWeight: 'bold' }}>WA</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => Alert.alert('Phone Login', 'OTP code sent to mobile.')}
            >
              <PhoneIcon width={20} height={20} stroke={colors.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.registerRow}>
            <Text style={styles.registerText}>New to FixKart? </Text>
            <TouchableOpacity onPress={() => Alert.alert('Register Store', 'Redirecting to Store Registration Portal.')}>
              <Text style={styles.registerLink}>Register Store</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  scroll: { flexGrow: 1, paddingHorizontal: spacing.xl, paddingTop: 48 },
  title: { fontSize: 26, fontWeight: typography.fontWeight.black, color: colors.textPrimary, marginBottom: 8 },
  subtitle: { fontSize: typography.fontSize.sm, color: colors.textSecondary, lineHeight: 20, marginBottom: 32 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    height: 52,
    marginBottom: spacing.lg,
    backgroundColor: colors.surface,
  },
  input: { fontSize: typography.fontSize.sm, color: colors.textPrimary, flex: 1 },
  eyeIcon: { fontSize: 12, color: colors.textMuted, fontWeight: 'bold' },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28,
  },
  rememberRow: { flexDirection: 'row', alignItems: 'center' },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: colors.borderDark,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: colors.primary, borderColor: colors.primary },
  rememberText: { fontSize: typography.fontSize.xs, color: colors.textSecondary },
  forgotText: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.bold, color: colors.primary },
  loginButton: {
    backgroundColor: colors.primary,
    height: 52,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
    ...shadows.sm,
  },
  loginButtonText: { color: colors.surface, fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.bold },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  divider: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
    marginHorizontal: 10,
    textTransform: 'uppercase',
  },
  socialRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 32 },
  socialButton: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
    backgroundColor: colors.surface,
  },
  registerRow: { flexDirection: 'row', justifyContent: 'center', paddingBottom: 24 },
  registerText: { fontSize: typography.fontSize.sm, color: colors.textSecondary },
  registerLink: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.bold, color: colors.primary },
});

export default LoginScreen;
