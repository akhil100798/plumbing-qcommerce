import { StackScreenProps } from '@react-navigation/stack';
import React, { useState } from 'react';
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
} from 'react-native';
import { useDispatch } from 'react-redux';

import { StitchButton } from '../../components/common/StitchButton';
import { loginFailure, loginStart, loginSuccess } from '../../redux/slices/authSlice';
import { AuthRepository } from '../../services/auth/authRepository';
import { AuthResponse } from '../../services/auth/authTypes';
import { borderRadius, colors, spacing, typography } from '../../theme';
import { AuthStackParamList } from '../../types/navigation';

type Props = StackScreenProps<AuthStackParamList, 'Register'>;

const toUser = (response: AuthResponse) =>
  response.user ?? {
    id: response.userId,
    email: response.email,
    fullName: response.fullName,
    role: response.role,
    phone: response.phone,
    phoneVerified: response.phoneVerified,
    profileComplete: response.profileComplete,
    authProvider: response.authProvider,
  };

export function RegisterScreen({ navigation }: Props) {
  const dispatch = useDispatch();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const validate = () => {
    if (!fullName.trim()) return 'Please enter your full name';
    if (!email.trim()) return 'Please enter your email';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'Please enter a valid email';
    if (!/^[6-9]\d{9}$/.test(phone.trim())) return 'Please enter a valid 10-digit mobile number';
    if (password.length < 8) return 'Password must be at least 8 characters';
    if (password !== confirmPassword) return 'Passwords do not match';
    return null;
  };

  const handleRegister = async () => {
    setErrorMessage('');
    const validationError = validate();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setLoading(true);
    dispatch(loginStart());
    try {
      const response = await AuthRepository.register({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        password,
        confirmPassword,
      });
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
      dispatch(loginFailure(err.message || 'Registration failed'));
      setErrorMessage(err.message || 'Registration failed');
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
        >
          {/* Header */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Go back to login"
          >
            <Text style={styles.backChevron}>‹</Text>
          </TouchableOpacity>

          <View style={styles.headingSection}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join FixKart for reliable home plumbing</Text>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            {errorMessage ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            <Text style={styles.inputLabel}>Full Name</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Rahul Sharma"
                placeholderTextColor={colors.textMuted}
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
              />
            </View>

            <Text style={styles.inputLabel}>Email Address</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textInput}
                placeholder="name@example.com"
                placeholderTextColor={colors.textMuted}
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <Text style={styles.inputLabel}>Mobile Number (10 digits)</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.countryCode}>+91 </Text>
              <TextInput
                style={styles.textInput}
                placeholder="9876543210"
                placeholderTextColor={colors.textMuted}
                keyboardType="phone-pad"
                maxLength={10}
                value={phone}
                onChangeText={setPhone}
              />
            </View>

            <Text style={styles.inputLabel}>Password (min 8 characters)</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textInput}
                placeholder="Create strong password"
                placeholderTextColor={colors.textMuted}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                autoCapitalize="none"
              />
            </View>

            <Text style={styles.inputLabel}>Confirm Password</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textInput}
                placeholder="Re-enter password"
                placeholderTextColor={colors.textMuted}
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                autoCapitalize="none"
              />
            </View>

            <StitchButton
              title="Create Account"
              onPress={handleRegister}
              loading={loading}
              variant="primary"
              style={styles.submitButton}
            />
          </View>

          {/* Login Footer */}
          <View style={styles.footerRow}>
            <Text style={styles.footerPrompt}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.footerLink}>Log in</Text>
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
    paddingVertical: spacing.md,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  backChevron: {
    fontSize: 26,
    color: colors.textPrimary,
    lineHeight: 28,
    marginTop: -2,
    fontWeight: '600',
  },
  headingSection: {
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
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
  errorBanner: {
    backgroundColor: '#FEE2E2',
    padding: 10,
    borderRadius: 8,
    marginBottom: spacing.sm,
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    fontWeight: typography.fontWeight.medium,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
    marginBottom: 5,
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
  countryCode: {
    fontSize: 14,
    fontWeight: typography.fontWeight.bold,
    color: colors.textSecondary,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
    height: '100%',
  },
  submitButton: {
    width: '100%',
    marginTop: spacing.md,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.md,
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
