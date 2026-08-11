import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import { logout } from '../../redux/slices/authSlice';
import { clearJobState } from '../../redux/slices/jobSlice';
import { clearMaterialState } from '../../redux/slices/materialSlice';
import { RootState } from '../../redux/store';
import { tokenStorage } from '../../services/api/tokenStorage';
import { kycService, PlumberKyc } from '../../services/kyc/kycService';
import { borderRadius, colors, shadows, spacing, typography } from '../../theme';
import { AppStackParamList, MainTabParamList } from '../../types/navigation';

type Props = BottomTabScreenProps<MainTabParamList, 'Profile'>;
type RootNavigation = StackNavigationProp<AppStackParamList>;

export function ProfileScreen(_: Props) {
  const dispatch = useDispatch();
  const navigation = useNavigation<RootNavigation>();
  const plumber = useSelector((state: RootState) => state.auth.plumber) ?? {
    fullName: '',
    email: '',
    phone: '',
    rating: 0,
  };

  const [kyc, setKyc] = useState<PlumberKyc | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [experienceYears, setExperienceYears] = useState('');
  const [serviceAreas, setServiceAreas] = useState('');

  const loadKyc = useCallback(async () => {
    setLoading(true);
    try {
      setKyc(await kycService.get());
    } catch {
      // Kyc optional error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadKyc();
  }, [loadKyc]);

  const handleLogout = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to log out of your FixKart Plumber session?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await tokenStorage.deleteItem('authToken');
          await tokenStorage.deleteItem('refreshToken');
          dispatch(clearJobState());
          dispatch(clearMaterialState());
          dispatch(logout());
          navigation.reset({
            index: 0,
            routes: [{ name: 'Auth' as any }],
          });
        },
      },
    ]);
  };

  const submitKyc = async () => {
    if (
      !/^\d{12}$/.test(aadhaarNumber) ||
      !/^[A-Za-z]{5}\d{4}[A-Za-z]$/.test(panNumber) ||
      !/^\d{6,18}$/.test(bankAccountNumber) ||
      !serviceAreas.trim()
    ) {
      Alert.alert(
        'Validation Error',
        'Please enter a valid 12-digit Aadhaar, 10-character PAN, Bank Account Number, and Service Areas.'
      );
      return;
    }

    const years = Number(experienceYears);
    if (!Number.isInteger(years) || years < 0 || years > 60) {
      Alert.alert('Validation Error', 'Experience must be between 0 and 60 years.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await kycService.submit({
        aadhaarNumber,
        panNumber: panNumber.toUpperCase(),
        bankAccountNumber,
        experienceYears: years,
        serviceAreas: serviceAreas.trim(),
      });
      setKyc(result);
      setShowForm(false);
      Alert.alert('KYC Submitted', 'Verification documents uploaded successfully.');
    } catch (err: any) {
      Alert.alert('Submission Failed', err?.message || 'Please retry.');
    } finally {
      setSubmitting(false);
    }
  };

  const statusText =
    kyc?.status === 'APPROVED'
      ? 'Verified Technician ✓'
      : kyc?.status === 'PENDING'
      ? 'KYC Under Verification'
      : kyc?.status === 'REJECTED'
      ? 'KYC Verification Rejected'
      : 'KYC Not Submitted';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>Account & Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollBody}>
        {/* Stitch Screen: Profile Home (34d0cb56da81435d9c2021b8a91d55ac) */}
        <View style={styles.profileCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {(plumber.fullName || 'P').charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.profileName}>{plumber.fullName || 'FixKart Technician'}</Text>
          <Text style={styles.profileSub}>{plumber.phone || '+91 Mobile Partner'}</Text>

          {plumber.rating != null && plumber.rating > 0 ? (
            <Text style={styles.ratingText}>Verified Rating: {plumber.rating.toFixed(1)} ★</Text>
          ) : null}
        </View>

        {/* Verification Status Card */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>Verification Status</Text>
          {loading ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <View style={styles.statusRow}>
              <Text
                style={[
                  styles.statusVal,
                  { color: kyc?.status === 'APPROVED' ? colors.secondary || '#1B6D24' : colors.textPrimary },
                ]}
              >
                {statusText}
              </Text>
              {(kyc?.status === 'NOT_SUBMITTED' || kyc?.status === 'REJECTED') && (
                <TouchableOpacity style={styles.kycBtn} onPress={() => setShowForm(!showForm)}>
                  <Text style={styles.kycBtnText}>{showForm ? 'Cancel' : 'Upload Documents'}</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {showForm && (
          <View style={styles.card}>
            <Text style={styles.cardHeader}>KYC Verification Form</Text>
            <TextInput
              style={styles.input}
              value={aadhaarNumber}
              onChangeText={setAadhaarNumber}
              placeholder="12-digit Aadhaar Number"
              keyboardType="number-pad"
              maxLength={12}
            />
            <TextInput
              style={styles.input}
              value={panNumber}
              onChangeText={setPanNumber}
              placeholder="10-character PAN Card Number"
              autoCapitalize="characters"
              maxLength={10}
            />
            <TextInput
              style={styles.input}
              value={bankAccountNumber}
              onChangeText={setBankAccountNumber}
              placeholder="Bank Account Number"
              keyboardType="number-pad"
            />
            <TextInput
              style={styles.input}
              value={experienceYears}
              onChangeText={setExperienceYears}
              placeholder="Years of Plumbing Experience"
              keyboardType="number-pad"
            />
            <TextInput
              style={styles.input}
              value={serviceAreas}
              onChangeText={setServiceAreas}
              placeholder="Primary Service Areas (e.g. Indiranagar, Koramangala)"
            />
            <TouchableOpacity style={styles.submitBtn} onPress={submitKyc} disabled={submitting}>
              <Text style={styles.submitBtnText}>
                {submitting ? 'Submitting Documents...' : 'Submit Verification'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Support & Settings Menu Links */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>Partner Support & Legal</Text>
          <TouchableOpacity style={styles.menuRow} onPress={() => navigation.navigate('JobHistory' as any)}>
            <Text style={styles.menuText}>📋 Service History</Text>
            <Text style={styles.arrowText}>→</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuRow} onPress={() => navigation.navigate('Chat' as any)}>
            <Text style={styles.menuText}>💬 Chat with Support</Text>
            <Text style={styles.arrowText}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Sign Out of Plumber Account</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background || '#FAF9FD' },
  headerBar: {
    paddingHorizontal: spacing.layout,
    paddingVertical: spacing.md,
    backgroundColor: colors.surfaceContainerLowest || '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.border || '#C1C6D6',
  },
  headerTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  scrollBody: { padding: spacing.layout, gap: spacing.md, paddingBottom: spacing.giant },
  profileCard: {
    backgroundColor: colors.surfaceContainerLowest || '#FFFFFF',
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border || '#C1C6D6',
    ...shadows.sm,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primaryContainer || colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  avatarText: { fontSize: 28, fontWeight: 'bold', color: '#FFFFFF' },
  profileName: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  profileSub: { fontSize: typography.fontSize.xs, color: colors.textSecondary, marginTop: 2 },
  ratingText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.secondary || '#1B6D24',
    marginTop: 4,
  },
  card: {
    backgroundColor: colors.surfaceContainerLowest || '#FFFFFF',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border || '#C1C6D6',
    ...shadows.sm,
    gap: spacing.xs,
  },
  cardHeader: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusVal: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.bold },
  kycBtn: {
    backgroundColor: colors.primaryContainer || colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  kycBtnText: { color: '#FFFFFF', fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.bold },
  input: {
    borderWidth: 1,
    borderColor: colors.border || '#C1C6D6',
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    fontSize: typography.fontSize.xs,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  submitBtn: {
    backgroundColor: colors.primaryContainer || colors.primary,
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  submitBtnText: { color: '#FFFFFF', fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.bold },
  menuRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceContainerLow || '#F4F3F7',
  },
  menuText: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
  arrowText: { fontSize: 16, color: colors.textMuted },
  logoutBtn: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#EF4444',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  logoutText: { color: '#EF4444', fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.bold },
});
