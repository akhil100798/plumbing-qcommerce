import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { StackNavigationProp } from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';

import { logout } from '../../redux/slices/authSlice';
import { RootState } from '../../redux/store';
import { kycService, PlumberKyc } from '../../services/kyc/kycService';
import { AppStackParamList, MainTabParamList } from '../../types/navigation';
import { borderRadius, colors, spacing, typography } from '../../theme';

type Props = BottomTabScreenProps<MainTabParamList, 'Profile'>;
type RootNavigation = StackNavigationProp<AppStackParamList>;
export function ProfileScreen(_: Props) {
  const dispatch = useDispatch();
  const navigation = useNavigation<RootNavigation>();
  const plumber = useSelector((state: RootState) => state.auth.plumber) ?? { fullName: '', email: '', phone: '', rating: 0 };
  const [kyc, setKyc] = useState<PlumberKyc | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [experienceYears, setExperienceYears] = useState('');
  const [serviceAreas, setServiceAreas] = useState('');
  const load = useCallback(async () => { setLoading(true); try { setKyc(await kycService.get()); } catch (error) { Alert.alert('KYC unavailable', error instanceof Error ? error.message : 'Please retry.'); } finally { setLoading(false); } }, []);
  useEffect(() => { load(); }, [load]);
  const submit = async () => {
    if (!/^\d{12}$/.test(aadhaarNumber) || !/^[A-Za-z]{5}\d{4}[A-Za-z]$/.test(panNumber) || !/^\d{6,18}$/.test(bankAccountNumber) || !serviceAreas.trim()) { Alert.alert('Validation error', 'Enter a valid Aadhaar, PAN, bank account number, and service area.'); return; }
    const years = Number(experienceYears);
    if (!Number.isInteger(years) || years < 0 || years > 60) { Alert.alert('Validation error', 'Experience must be between 0 and 60 years.'); return; }
    setSubmitting(true); try { const result = await kycService.submit({ aadhaarNumber, panNumber: panNumber.toUpperCase(), bankAccountNumber, experienceYears: years, serviceAreas: serviceAreas.trim() }); setKyc(result); setShowForm(false); } catch (error) { Alert.alert('KYC submission failed', error instanceof Error ? error.message : 'Please retry.'); } finally { setSubmitting(false); }
  };
  const statusText = kyc?.status === 'PENDING' ? 'KYC under review' : kyc?.status === 'APPROVED' ? 'Verified' : kyc?.status === 'REJECTED' ? 'KYC rejected' : 'KYC not submitted';
  return <ScrollView contentContainerStyle={styles.container}><Text style={styles.title}>Profile</Text><View style={styles.card}><Text style={styles.name}>{plumber?.fullName || 'Plumber'}</Text><Text>{plumber?.email || 'Email unavailable'}</Text><Text>{plumber?.phone || 'Phone unavailable'}</Text><Text>{plumber?.rating > 0 ? `Rating: ${plumber.rating.toFixed(1)}` : 'No reviews yet'}</Text></View><View style={styles.card}><Text style={styles.section}>KYC</Text>{loading ? <ActivityIndicator color={colors.primary} /> : <><Text>{statusText}</Text>{kyc?.status === 'REJECTED' && kyc.rejectionReason ? <Text style={styles.error}>{kyc.rejectionReason}</Text> : null}{(kyc?.status === 'NOT_SUBMITTED' || kyc?.status === 'REJECTED') && <TouchableOpacity onPress={() => setShowForm(!showForm)}><Text style={styles.link}>{showForm ? 'Cancel' : kyc?.status === 'REJECTED' ? 'Resubmit KYC' : 'Complete KYC'}</Text></TouchableOpacity>}</>}</View>{showForm && <View style={styles.card}><TextInput style={styles.input} value={aadhaarNumber} onChangeText={setAadhaarNumber} placeholder="12-digit Aadhaar number" keyboardType="number-pad" maxLength={12} /><TextInput style={styles.input} value={panNumber} onChangeText={setPanNumber} placeholder="PAN number" autoCapitalize="characters" maxLength={10} /><TextInput style={styles.input} value={bankAccountNumber} onChangeText={setBankAccountNumber} placeholder="Bank account number" keyboardType="number-pad" /><TextInput style={styles.input} value={experienceYears} onChangeText={setExperienceYears} placeholder="Experience in years" keyboardType="number-pad" /><TextInput style={styles.input} value={serviceAreas} onChangeText={setServiceAreas} placeholder="Service areas" /><TouchableOpacity style={styles.button} onPress={submit} disabled={submitting}><Text style={styles.buttonText}>{submitting ? 'Submitting…' : 'Submit KYC'}</Text></TouchableOpacity></View>}<TouchableOpacity style={styles.logout} onPress={() => { dispatch(logout()); navigation.replace('Auth'); }}><Text style={styles.logoutText}>Logout</Text></TouchableOpacity></ScrollView>;
}
const styles = StyleSheet.create({ container: { flexGrow: 1, padding: spacing.md, gap: spacing.md, backgroundColor: colors.background }, title: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: colors.textPrimary }, card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md, padding: spacing.md, gap: spacing.sm }, name: { fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.bold, color: colors.textPrimary }, section: { fontWeight: typography.fontWeight.bold, color: colors.textPrimary }, input: { borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.sm, padding: spacing.sm, color: colors.textPrimary }, link: { color: colors.primary, fontWeight: typography.fontWeight.bold }, error: { color: colors.danger }, button: { backgroundColor: colors.primary, padding: spacing.md, alignItems: 'center', borderRadius: borderRadius.sm }, buttonText: { color: '#fff', fontWeight: typography.fontWeight.bold }, logout: { alignItems: 'center', padding: spacing.md }, logoutText: { color: colors.danger, fontWeight: typography.fontWeight.bold } });
