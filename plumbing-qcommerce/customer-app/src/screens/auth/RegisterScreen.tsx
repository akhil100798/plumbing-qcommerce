import { StackScreenProps } from '@react-navigation/stack';
import React, { useState } from 'react';
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

import { AppIcon } from '../../components/common/AppIcon';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { loginFailure, loginStart, loginSuccess } from '../../redux/slices/authSlice';
import { AuthRepository } from '../../services/auth/authRepository';
import { AuthResponse } from '../../services/auth/authTypes';
import { borderRadius, colors, spacing, typography } from '../../theme';
import { AuthStackParamList } from '../../types/navigation';
import ArrowLeftIcon from '../../assets/icons/arrow-left.svg';

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

  const notify = (title: string, message: string) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.alert) {
      window.alert(`${title}\n\n${message}`);
      return;
    }
    Alert.alert(title, message);
  };

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
    const validationError = validate();
    if (validationError) {
      notify('Validation Error', validationError);
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
      notify('Registration Failed', err.message || 'Registration failed');
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
            <Text style={styles.title}>Create account</Text>
            <Text style={styles.subtitle}>Register as a customer with email and password</Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput style={styles.textInput} placeholder="Enter full name" value={fullName} onChangeText={setFullName} />

            <Text style={styles.inputLabel}>Email Address</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter email"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={setEmail}
            />

            <Text style={styles.inputLabel}>Mobile Number</Text>
            <TextInput
              style={styles.textInput}
              placeholder="10-digit mobile number"
              keyboardType="phone-pad"
              maxLength={10}
              value={phone}
              onChangeText={(value) => setPhone(value.replace(/[^0-9]/g, ''))}
            />

            <Text style={styles.inputLabel}>Password</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Create password"
              secureTextEntry
              autoCapitalize="none"
              value={password}
              onChangeText={setPassword}
            />

            <Text style={styles.inputLabel}>Confirm Password</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Confirm password"
              secureTextEntry
              autoCapitalize="none"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />

            <PrimaryButton
              title="Create Account"
              onPress={handleRegister}
              loading={loading}
              style={styles.submitButton}
            />

            <TouchableOpacity style={styles.loginLinkRow} onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLinkText}>Already have an account? Login</Text>
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
  submitButton: {
    height: 48,
    backgroundColor: colors.primary || '#2563EB',
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  loginLinkRow: {
    alignItems: 'center',
    marginTop: spacing.md,
  },
  loginLinkText: {
    fontSize: 14,
    color: colors.primary,
    fontFamily: typography.fontFamily.medium,
  },
});
