import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { colors, borderRadius, spacing, typography, shadows } from '../../theme';
import { ScreenWrapper } from '../../components/common/ScreenWrapper';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { authService } from '../../services/auth/authService';
import { canUseDevMockFallbacks } from '../../services/mockPolicy';
import { useAppDispatch } from '../../redux/store';
import { authStart, authSuccess, authFailure } from '../../redux/slices/authSlice';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { AppStackParamList } from '../../types/navigation';

export const LoginScreen = () => {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<NavigationProp<AppStackParamList>>();

  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('manager@plumbcommerce.com');
  const [password, setPassword] = useState('SecurePass@1');

  const [useOtp, setUseOtp] = useState(true);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePhoneSubmit = async () => {
    if (!phone || phone.length < 10) {
      return Alert.alert('Invalid Input', 'Please enter a valid 10-digit phone number');
    }

    setLoading(true);
    try {
      const formattedPhone = `+91 ${phone}`;
      await authService.sendOtp(formattedPhone);
      setOtpSent(true);
      Alert.alert(
        'OTP Sent',
        canUseDevMockFallbacks()
          ? `Test OTP code is 123456 for phone: ${formattedPhone}`
          : `OTP sent to ${formattedPhone}.`
      );
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerify = async () => {
    if (!otpCode || otpCode.length !== 6) {
      return Alert.alert('Invalid Input', 'Please enter a 6-digit OTP code');
    }

    setLoading(true);
    dispatch(authStart());
    try {
      const formattedPhone = `+91 ${phone}`;
      const data = await authService.verifyOtp(formattedPhone, otpCode);
      dispatch(authSuccess(data));
      navigation.navigate('Main', { screen: 'HomeTab' });
    } catch (e: any) {
      dispatch(authFailure(e.message || 'OTP verification failed'));
      Alert.alert('Verification Failed', e.message || 'Invalid OTP code');
    } finally {
      setLoading(false);
    }
  };

  const handleCredentialsSubmit = async () => {
    if (!email || !password) {
      return Alert.alert('Invalid Input', 'Please fill in all credentials fields');
    }

    setLoading(true);
    dispatch(authStart());
    try {
      const data = await authService.login(email, password);
      dispatch(authSuccess(data));
      navigation.navigate('Main', { screen: 'HomeTab' });
    } catch (e: any) {
      dispatch(authFailure(e.message || 'Login failed'));
      Alert.alert('Login Failed', e.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <View style={styles.brandBadge}>
            <Text style={styles.brandEmoji}>??</Text>
          </View>
          <Text style={styles.brandTitle}>PlumbCommerce</Text>
          <Text style={styles.brandSubtitle}>Store Partner</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Welcome Back!</Text>
          <Text style={styles.cardSubtitle}>
            {useOtp ? 'Enter your phone number to receive a secure OTP' : 'Login with your registered credentials'}
          </Text>

          {useOtp ? (
            !otpSent ? (
              <View style={styles.form}>
                <View style={styles.phoneInputRow}>
                  <View style={styles.countryCodeBox}>
                    <Text style={styles.countryCodeText}>+91</Text>
                  </View>
                  <TextInput
                    style={styles.phoneInput}
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    placeholder="98765 43210"
                    placeholderTextColor={colors.textMuted}
                    maxLength={10}
                  />
                </View>
                <PrimaryButton title="Send OTP" onPress={handlePhoneSubmit} loading={loading} style={styles.submitBtn} />
              </View>
            ) : (
              <View style={styles.form}>
                <Text style={styles.label}>Enter 6-digit OTP code sent to +91 {phone}</Text>
                <TextInput
                  style={styles.otpInput}
                  value={otpCode}
                  onChangeText={setOtpCode}
                  keyboardType="number-pad"
                  maxLength={6}
                  placeholder="123456"
                  placeholderTextColor={colors.textMuted}
                  textAlign="center"
                />
                <PrimaryButton title="Verify & Login" onPress={handleOtpVerify} loading={loading} style={styles.submitBtn} />
                <TouchableOpacity style={styles.backLink} onPress={() => setOtpSent(false)}>
                  <Text style={styles.backLinkText}>Change Phone Number</Text>
                </TouchableOpacity>
              </View>
            )
          ) : (
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Address</Text>
                <TextInput
                  style={styles.textInput}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  placeholder="manager@plumbcommerce.com"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="none"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <TextInput
                  style={styles.textInput}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  placeholder="••••••••"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
              <PrimaryButton title="Login" onPress={handleCredentialsSubmit} loading={loading} style={styles.submitBtn} />
            </View>
          )}

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or continue with</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={styles.toggleBtn}
            onPress={() => {
              setUseOtp(!useOtp);
              setOtpSent(false);
            }}
          >
            <Text style={styles.toggleBtnText}>
              {useOtp ? 'Login with Email / Password' : 'Login with OTP / Phone'}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footerText}>New store? Register on our Portal</Text>
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
  },
  scroll: {
    padding: spacing.layout,
    paddingTop: spacing.huge,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  brandBadge: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  brandEmoji: {
    fontSize: 32,
  },
  brandTitle: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.black,
    color: colors.textPrimary,
  },
  brandSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    width: '100%',
    ...shadows.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  cardSubtitle: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  form: {
    width: '100%',
  },
  phoneInputRow: {
    flexDirection: 'row',
    height: 48,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  countryCodeBox: {
    backgroundColor: colors.background,
    width: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1.5,
    borderRightColor: colors.border,
  },
  countryCodeText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  phoneInput: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.card,
  },
  submitBtn: {
    marginTop: spacing.md,
  },
  label: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.xs,
  },
  otpInput: {
    height: 48,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    fontSize: typography.fontSize.lg,
    fontWeight: 'bold',
    letterSpacing: 4,
    color: colors.textPrimary,
    backgroundColor: colors.background,
  },
  backLink: {
    marginTop: spacing.md,
    alignItems: 'center',
  },
  backLinkText: {
    color: colors.primary,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  textInput: {
    height: 48,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
    backgroundColor: colors.card,
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
    fontSize: 10,
    color: colors.textMuted,
    marginHorizontal: spacing.md,
    textTransform: 'uppercase',
  },
  toggleBtn: {
    height: 44,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleBtnText: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
  footerText: {
    marginTop: spacing.xl,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
});
export default LoginScreen;
