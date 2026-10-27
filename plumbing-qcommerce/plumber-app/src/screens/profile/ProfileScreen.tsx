import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { StackNavigationProp } from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';

import { logout } from '../../redux/slices/authSlice';
import { RootState } from '../../redux/store';
import { kycService, PlumberKyc } from '../../services/kyc/kycService';
import { AppStackParamList, MainTabParamList } from '../../types/navigation';
import { borderRadius, colors, shadows, spacing, typography } from '../../theme';
import { PlumberAvatar } from '../../components/common/PlumberAvatar';
import {
  SvgActionCheck,
  SvgStatusStar,
  SvgNavProfile,
  SvgStatusAlert,
} from '../../assets/svg';
import ArrowRightIcon from '../../assets/icons/arrow-right.svg';

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

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setKyc(await kycService.get());
    } catch (error) {
      Alert.alert('KYC unavailable', error instanceof Error ? error.message : 'Please retry.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async () => {
    if (
      !/^\d{12}$/.test(aadhaarNumber) ||
      !/^[A-Za-z]{5}\d{4}[A-Za-z]$/.test(panNumber) ||
      !/^\d{6,18}$/.test(bankAccountNumber) ||
      !serviceAreas.trim()
    ) {
      Alert.alert('Validation error', 'Enter a valid Aadhaar, PAN, bank account number, and service area.');
      return;
    }
    const years = Number(experienceYears);
    if (!Number.isInteger(years) || years < 0 || years > 60) {
      Alert.alert('Validation error', 'Experience must be between 0 and 60 years.');
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
    } catch (error) {
      Alert.alert('KYC submission failed', error instanceof Error ? error.message : 'Please retry.');
    } finally {
      setSubmitting(false);
    }
  };

  const statusText =
    kyc?.status === 'PENDING'
      ? 'KYC under review'
      : kyc?.status === 'APPROVED'
      ? 'Verified'
      : kyc?.status === 'REJECTED'
      ? 'KYC rejected'
      : 'KYC not submitted';

  const plumberName = plumber?.fullName || 'Ramesh Kumar';
  const ratingValue = plumber?.rating && plumber.rating > 0 ? plumber.rating.toFixed(1) : '4.8';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {/* Stitch User Profile Overview Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileLeft}>
            <PlumberAvatar size={56} online />
            <View style={styles.profileMeta}>
              <Text style={styles.profileName}>{plumberName}</Text>
              <View style={styles.ratingRow}>
                <SvgStatusStar width={14} height={14} fill="#F59E0B" color="#F59E0B" />
                <Text style={styles.ratingNumber}>{ratingValue}</Text>
                <Text style={styles.reviewCount}>(125 Reviews)</Text>
              </View>
              {plumber?.email ? <Text style={styles.emailText}>{plumber.email}</Text> : null}
            </View>
          </View>

          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => Alert.alert('Edit Profile', 'Profile editor opening.')}
            activeOpacity={0.8}
          >
            <Text style={styles.editBtnText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Stitch Metrics Cards (Jobs Completed, Rating, Member Since) */}
        <View style={styles.metricsCard}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Jobs Completed</Text>
            <Text style={styles.metricVal}>128</Text>
          </View>
          <View style={[styles.metricItem, styles.metricDivider]}>
            <Text style={styles.metricLabel}>Rating</Text>
            <Text style={styles.metricVal}>{ratingValue}</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Member Since</Text>
            <Text style={styles.metricValDate}>Mar 2023</Text>
          </View>
        </View>

        {/* KYC Section Card */}
        <View style={styles.kycCard}>
          <View style={styles.kycHeaderRow}>
            <Text style={styles.kycTitle}>KYC</Text>
            <View style={[styles.kycBadge, kyc?.status === 'APPROVED' ? styles.kycBadgeVerified : styles.kycBadgePending]}>
              <Text style={[styles.kycBadgeText, kyc?.status === 'APPROVED' ? styles.kycVerifiedText : styles.kycPendingText]}>
                {statusText}
              </Text>
            </View>
          </View>

          {loading ? (
            <ActivityIndicator color={colors.stitchBlue} />
          ) : (
            <View style={styles.kycBody}>
              {kyc?.status === 'REJECTED' && kyc.rejectionReason ? (
                <Text style={styles.rejectionReason}>{kyc.rejectionReason}</Text>
              ) : null}

              {(kyc?.status === 'NOT_SUBMITTED' || kyc?.status === 'REJECTED') && (
                <TouchableOpacity
                  style={styles.completeKycBtn}
                  onPress={() => setShowForm(!showForm)}
                >
                  <Text style={styles.completeKycText}>
                    {showForm ? 'Cancel' : kyc?.status === 'REJECTED' ? 'Resubmit KYC' : 'Complete KYC'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {showForm && (
            <View style={styles.formContainer}>
              <TextInput
                style={styles.input}
                value={aadhaarNumber}
                onChangeText={setAadhaarNumber}
                placeholder="12-digit Aadhaar number"
                placeholderTextColor="#94A3B8"
                keyboardType="number-pad"
                maxLength={12}
              />
              <TextInput
                style={styles.input}
                value={panNumber}
                onChangeText={setPanNumber}
                placeholder="PAN number"
                placeholderTextColor="#94A3B8"
                autoCapitalize="characters"
                maxLength={10}
              />
              <TextInput
                style={styles.input}
                value={bankAccountNumber}
                onChangeText={setBankAccountNumber}
                placeholder="Bank account number"
                placeholderTextColor="#94A3B8"
                keyboardType="number-pad"
              />
              <TextInput
                style={styles.input}
                value={experienceYears}
                onChangeText={setExperienceYears}
                placeholder="Experience in years"
                placeholderTextColor="#94A3B8"
                keyboardType="number-pad"
              />
              <TextInput
                style={styles.input}
                value={serviceAreas}
                onChangeText={setServiceAreas}
                placeholder="Service areas (e.g. Indiranagar, Koramangala)"
                placeholderTextColor="#94A3B8"
              />
              <TouchableOpacity
                style={styles.submitKycBtn}
                onPress={submit}
                disabled={submitting}
              >
                <Text style={styles.submitKycBtnText}>
                  {submitting ? 'Submitting…' : 'Submit KYC'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Stitch Settings Menu List */}
        <View style={styles.menuContainer}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => Alert.alert('Personal Info', `Logged in as ${plumberName}`)}
          >
            <Text style={styles.menuItemText}>Personal Information</Text>
            <ArrowRightIcon width={14} height={14} stroke="#94A3B8" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('Wallet')}
          >
            <Text style={styles.menuItemText}>Bank Details & Wallet</Text>
            <ArrowRightIcon width={14} height={14} stroke="#94A3B8" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => Alert.alert('Notifications', 'Push notifications enabled.')}
          >
            <Text style={styles.menuItemText}>Notification Settings</Text>
            <ArrowRightIcon width={14} height={14} stroke="#94A3B8" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => Alert.alert('Help & Support', 'FixKart Plumber Support: 1800-FIX-KART')}
          >
            <Text style={styles.menuItemText}>Help & Support</Text>
            <ArrowRightIcon width={14} height={14} stroke="#94A3B8" />
          </TouchableOpacity>

          {/* Stitch Logout Item */}
          <TouchableOpacity
            style={[styles.menuItem, styles.logoutItem]}
            onPress={() => {
              dispatch(logout());
              navigation.replace('Auth');
            }}
          >
            <Text style={styles.logoutText}>Logout</Text>
            <ArrowRightIcon width={14} height={14} stroke="#F87171" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  body: {
    padding: 16,
    paddingBottom: 36,
    gap: 14,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    ...shadows.sm,
  },
  profileLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  profileMeta: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  ratingStar: {
    fontSize: 12,
    color: '#F59E0B',
  },
  ratingNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
  },
  reviewCount: {
    fontSize: 11,
    color: '#94A3B8',
  },
  emailText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  editBtn: {
    borderWidth: 1.5,
    borderColor: colors.stitchBlue,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  editBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.stitchBlue,
  },
  metricsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    ...shadows.sm,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricDivider: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#F1F5F9',
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#94A3B8',
  },
  metricVal: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  metricValDate: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 4,
  },
  kycCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    ...shadows.sm,
  },
  kycHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  kycTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  kycBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  kycBadgeVerified: {
    backgroundColor: '#ECFDF5',
  },
  kycBadgePending: {
    backgroundColor: '#FEF3C7',
  },
  kycBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  kycVerifiedText: {
    color: '#059669',
  },
  kycPendingText: {
    color: '#D97706',
  },
  kycBody: {
    marginTop: 8,
  },
  rejectionReason: {
    fontSize: 12,
    color: '#EF4444',
    marginBottom: 6,
  },
  completeKycBtn: {
    marginTop: 6,
  },
  completeKycText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.stitchBlue,
  },
  formContainer: {
    marginTop: 12,
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    color: '#0F172A',
  },
  submitKycBtn: {
    backgroundColor: colors.stitchBlue,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  submitKycBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  menuContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    overflow: 'hidden',
    ...shadows.sm,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  menuItemText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  logoutItem: {
    borderBottomWidth: 0,
    backgroundColor: '#FFF5F5',
  },
  logoutText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#EF4444',
  },
});
