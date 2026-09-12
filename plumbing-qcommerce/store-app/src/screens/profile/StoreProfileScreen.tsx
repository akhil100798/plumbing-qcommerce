import { NavigationProp, useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSelector } from 'react-redux';

import ArrowLeftIcon from '../../assets/icons/arrow-left.svg';
import WarehouseIcon from '../../assets/icons/warehouse.svg';
import { RootState } from '../../redux/store';
import { configService, SupportContactConfig } from '../../services/config/configService';
import { StoreBusinessHoursItem, storeService } from '../../services/store/storeService';
import { borderRadius, colors, shadows, spacing, typography } from '../../theme';
import { Store } from '../../types';
import { AppStackParamList } from '../../types/navigation';

export function StoreProfileScreen() {
  const navigation = useNavigation<NavigationProp<AppStackParamList>>();
  const user = useSelector((state: RootState) => state.auth.storeUser);

  const [profile, setProfile] = useState<Store | null>(null);
  const [businessHours, setBusinessHours] = useState<StoreBusinessHoursItem[]>([]);
  const [supportConfig, setSupportConfig] = useState<SupportContactConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prof, hours, supp] = await Promise.all([
          storeService.getCurrentStoreProfile(),
          storeService.getBusinessHours(),
          configService.getSupportContact(),
        ]);
        setProfile(prof);
        setPhone(prof.phone || '');
        setAddress(prof.address || '');
        setBusinessHours(hours);
        setSupportConfig(supp);
      } catch {
        // fetch fallback
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSaveProfile = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      const updated = await storeService.updateStoreProfile({ phone, address });
      setProfile(updated);
      await storeService.updateBusinessHours(businessHours);
      Alert.alert('Profile Saved!', 'Store profile & business hours updated successfully.');
    } catch (err: any) {
      Alert.alert('Save Failed', err?.message || 'Could not update store profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerLoading}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.loadingText}>Fetching Store Profile & Config...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            if (navigation.canGoBack()) navigation.goBack();
            else navigation.navigate('Main', { screen: 'AccountTab' } as any);
          }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <ArrowLeftIcon width={24} height={24} stroke={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Hardware Store Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarWrap}>
            <WarehouseIcon width={36} height={36} stroke={colors.primaryContainer || colors.primary} />
          </View>
          <Text style={styles.storeName}>{profile?.name || 'Partner Hardware Store'}</Text>
          <Text style={styles.storeId}>Store Identity ID: #{profile?.id || '1'}</Text>
          <View style={styles.activePill}>
            <Text style={styles.activePillText}>Operational Partner Store</Text>
          </View>
        </View>

        {/* Manager Info Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Store Manager Details</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Manager Name</Text>
            <Text style={styles.infoValBold}>{user?.fullName || 'Assigned Manager'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Manager Email</Text>
            <Text style={styles.infoValBold}>{user?.email || 'manager@fixkart.in'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>System Role</Text>
            <Text style={styles.infoValBold}>STORE_MANAGER</Text>
          </View>
        </View>

        {/* Editable Store Details Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Store Contact & Location</Text>

          <Text style={styles.fieldLabel}>Store Contact Phone</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="Enter store phone number"
            keyboardType="phone-pad"
          />

          <Text style={styles.fieldLabel}>Store Address</Text>
          <TextInput
            style={[styles.input, styles.multilineInput]}
            value={address}
            onChangeText={setAddress}
            placeholder="Enter complete store address"
            multiline
            numberOfLines={3}
          />

          <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProfile} disabled={saving}>
            <Text style={styles.saveBtnText}>{saving ? 'Saving Changes...' : 'Save Profile Changes'}</Text>
          </TouchableOpacity>
        </View>

        {/* Business Hours Info & Backend Persistence */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Operational Business Hours (Backend Persisted)</Text>
          {businessHours.map((h, idx) => (
            <View key={idx} style={styles.infoRow}>
              <Text style={styles.infoLabel}>{h.dayOfWeek}</Text>
              <Text style={styles.infoValBold}>
                {h.closed ? 'CLOSED' : `${h.openTime} – ${h.closeTime}`}
              </Text>
            </View>
          ))}
        </View>

        {/* Store Support Configuration */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Official FixKart Partner Support</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Partner Helpline</Text>
            <Text style={styles.infoValBold}>{supportConfig?.phone || 'Not Configured'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Support Email</Text>
            <Text style={styles.infoValBold}>{supportConfig?.email || 'Not Configured'}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background || '#F9F9F9' },
  centerLoading: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.xs },
  loadingText: { fontSize: typography.fontSize.xs, color: colors.textSecondary },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.layout,
    paddingVertical: spacing.md,
    backgroundColor: colors.surfaceContainerLowest || '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.border || '#C6C5D4',
  },
  headerTitle: { fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
  scrollBody: { padding: spacing.layout, paddingBottom: spacing.giant },
  profileCard: {
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLowest || '#FFFFFF',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border || '#C6C5D4',
    ...shadows.sm,
  },
  avatarWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.surfaceContainerLow || '#F4F3F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  storeName: { fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
  storeId: { fontSize: typography.fontSize.xs, color: colors.textMuted, marginTop: 2 },
  activePill: {
    marginTop: spacing.xs,
    backgroundColor: colors.successLight || '#E7F7EC',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
  },
  activePillText: { fontSize: 10, fontWeight: '700', color: colors.secondary || '#1B6D24' },
  card: {
    backgroundColor: colors.surfaceContainerLowest || '#FFFFFF',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border || '#C6C5D4',
    ...shadows.sm,
  },
  sectionTitle: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.bold, color: colors.textPrimary, marginBottom: spacing.xs },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceContainerLow || '#F4F3F7',
  },
  infoLabel: { fontSize: typography.fontSize.xs, color: colors.textSecondary },
  infoValBold: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
  fieldLabel: { fontSize: typography.fontSize.xs, color: colors.textSecondary, marginTop: spacing.xs, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: colors.border || '#C6C5D4',
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    fontSize: typography.fontSize.xs,
    color: colors.textPrimary,
    backgroundColor: colors.surfaceContainerLow || '#F4F3F7',
  },
  multilineInput: { minHeight: 60, textAlignVertical: 'top' },
  saveBtn: {
    backgroundColor: colors.primaryContainer || colors.primary,
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  saveBtnText: { color: '#FFFFFF', fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.bold },
});

export default StoreProfileScreen;
