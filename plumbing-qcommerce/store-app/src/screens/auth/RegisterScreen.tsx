import { StackScreenProps } from '@react-navigation/stack';
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
  StatusBar,
} from 'react-native';
import { useDispatch } from 'react-redux';

import { PrimaryButton } from '../../components/common/PrimaryButton';
import { ScreenWrapper } from '../../components/common/ScreenWrapper';
import { authSuccess } from '../../redux/slices/authSlice';
import { authService } from '../../services/auth/authService';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { AuthStackParamList } from '../../types/navigation';
import StoreIcon from '../../components/common/StoreIcon';

type Props = StackScreenProps<AuthStackParamList, 'Register'>;

export function RegisterScreen({ navigation }: Props) {
  const dispatch = useDispatch();
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    storeName: '',
    storeAddress: '',
    latitude: '',
    longitude: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const set = (key: keyof typeof form) => (value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  const register = async () => {
    setErrorMessage('');
    if (Object.values(form).some((value) => !value.trim())) {
      setErrorMessage('Please complete every required field.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()) || !/^[6-9]\d{9}$/.test(form.phone)) {
      setErrorMessage('Enter a valid email and 10-digit Indian mobile number.');
      return;
    }
    const latitude = Number(form.latitude);
    const longitude = Number(form.longitude);
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      setErrorMessage('Enter valid latitude (-90 to 90) and longitude (-180 to 180).');
      return;
    }
    if (form.password.length < 8 || form.password !== form.confirmPassword) {
      setErrorMessage(form.password.length < 8 ? 'Password must be at least 8 characters.' : 'Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const result = await authService.register({
        ...form,
        fullName: form.fullName.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        storeName: form.storeName.trim(),
        storeAddress: form.storeAddress.trim(),
        latitude,
        longitude,
      });
      dispatch(authSuccess(result));
      navigation.replace('Main' as any);
    } catch (error: any) {
      setErrorMessage(error.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper safeAreaStyle={{ backgroundColor: colors.background }}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        {/* Header Bar */}
        <View style={styles.topHeader}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <StoreIcon name="arrow-left" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Register Store</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.heroSection}>
            <Text style={styles.title}>Partner Store Onboarding</Text>
            <Text style={styles.subtitle}>
              Connect your plumbing hardware business to fulfill verified contractor orders.
            </Text>
          </View>

          {/* Section 1: Manager Details */}
          <View style={styles.card}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionIcon}>
                <StoreIcon name="profile" size={16} color={colors.primary} />
              </View>
              <Text style={styles.sectionTitle}>1. Manager Details</Text>
            </View>

            <Field
              label="Manager Full Name *"
              placeholder="e.g. Rajesh Sharma"
              value={form.fullName}
              onChangeText={set('fullName')}
            />
            <Field
              label="Email Address *"
              placeholder="store@fixkart.com"
              value={form.email}
              onChangeText={set('email')}
              keyboardType="email-address"
            />
            <Field
              label="Mobile Number (10 digits) *"
              placeholder="9876543210"
              value={form.phone}
              onChangeText={(v: string) => set('phone')(v.replace(/\D/g, '').slice(0, 10))}
              keyboardType="phone-pad"
            />
          </View>

          {/* Section 2: Store Details */}
          <View style={styles.card}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionIcon}>
                <StoreIcon name="store" size={16} color={colors.primary} />
              </View>
              <Text style={styles.sectionTitle}>2. Store Details</Text>
            </View>

            <Field
              label="Hardware Store Name *"
              placeholder="e.g. Sharma Hardware & Plumbing Hub"
              value={form.storeName}
              onChangeText={set('storeName')}
            />
            <Field
              label="Full Store Address *"
              placeholder="Shop #4, 100ft Road, Indiranagar, Bangalore"
              value={form.storeAddress}
              onChangeText={set('storeAddress')}
              multiline
            />
          </View>

          {/* Section 3: Geolocation Coordinates */}
          <View style={styles.card}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionIcon}>
                <StoreIcon name="location-pin" size={16} color={colors.primary} />
              </View>
              <Text style={styles.sectionTitle}>3. Location Coordinates</Text>
            </View>

            <View style={styles.row}>
              <View style={styles.half}>
                <Field
                  label="Latitude *"
                  placeholder="12.9716"
                  value={form.latitude}
                  onChangeText={set('latitude')}
                  keyboardType="numbers-and-punctuation"
                />
              </View>
              <View style={styles.half}>
                <Field
                  label="Longitude *"
                  placeholder="77.5946"
                  value={form.longitude}
                  onChangeText={set('longitude')}
                  keyboardType="numbers-and-punctuation"
                />
              </View>
            </View>
          </View>

          {/* Section 4: Security */}
          <View style={styles.card}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionIcon}>
                <StoreIcon name="security" size={16} color={colors.primary} />
              </View>
              <Text style={styles.sectionTitle}>4. Account Security</Text>
            </View>

            <Field
              label="Password (min 8 characters) *"
              placeholder="••••••••"
              value={form.password}
              onChangeText={set('password')}
              secureTextEntry={!showPassword}
            />
            <Field
              label="Confirm Password *"
              placeholder="••••••••"
              value={form.confirmPassword}
              onChangeText={set('confirmPassword')}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity
              style={styles.showPassToggle}
              onPress={() => setShowPassword(!showPassword)}
            >
              <StoreIcon name={showPassword ? 'eye-off' : 'eye'} size={16} color={colors.textSecondary} />
              <Text style={styles.showPassText}>{showPassword ? 'Hide Passwords' : 'Show Passwords'}</Text>
            </TouchableOpacity>
          </View>

          {errorMessage ? (
            <View style={styles.errorBox}>
              <StoreIcon name="error" size={16} color={colors.danger} />
              <Text accessibilityRole="alert" style={styles.errorText}>
                {errorMessage}
              </Text>
            </View>
          ) : null}

          {/* Submit */}
          <PrimaryButton
            title="Create Store Account"
            onPress={register}
            loading={loading}
            style={styles.submitButton}
          />

          <View style={styles.loginLinkRow}>
            <Text style={styles.loginPrompt}>Already registered? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Log in</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

function Field({ label, multiline, ...props }: any) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        {...props}
        style={[styles.input, multiline && styles.multilineInput]}
        multiline={multiline}
        autoCapitalize="none"
        placeholderTextColor={colors.textMuted}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  topHeader: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.layout,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  content: {
    flexGrow: 1,
    padding: spacing.lg,
    paddingBottom: spacing.giant,
  },
  heroSection: {
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  subtitle: {
    marginTop: 4,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  sectionIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#EEF4FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  field: {
    marginBottom: spacing.md,
  },
  label: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    borderRadius: borderRadius.sm,
    paddingHorizontal: 12,
    height: 46,
    color: colors.textPrimary,
    backgroundColor: '#FAFAFA',
    fontSize: typography.fontSize.sm,
  },
  multilineInput: {
    height: 72,
    textAlignVertical: 'top',
    paddingTop: 8,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  half: {
    flex: 1,
  },
  showPassToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  showPassText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDEBEC',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  errorText: {
    color: colors.danger,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    flex: 1,
  },
  submitButton: {
    height: 48,
    borderRadius: borderRadius.md,
    marginTop: spacing.xs,
  },
  loginLinkRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  loginPrompt: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  loginLink: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
});

export default RegisterScreen;
