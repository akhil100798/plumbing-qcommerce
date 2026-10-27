import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Alert,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import { colors, borderRadius, spacing, typography } from '../../theme';
import { storeService } from '../../services/store/storeService';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { AppStackParamList } from '../../types/navigation';
import { Store } from '../../types';
import { useAppSelector } from '../../redux/store';
import { StoreIcon } from '../../components/common/StoreIcon';

export const StoreProfileScreen = () => {
  const navigation = useNavigation<NavigationProp<AppStackParamList>>();
  const user = useAppSelector((state) => state.auth.storeUser);

  const [profile, setProfile] = useState<Store | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await storeService.getCurrentStoreProfile();
        setProfile(data);
      } catch {
        // Retain default staging profile
      }
    };

    fetchProfile();
  }, [user]);

  const storeName = profile?.name || user?.fullName || 'Sharma Hardware & Plumbing';
  const ownerName = user?.fullName || 'Rahul Sharma';
  const phone = user?.phone || profile?.phone || '98765 43210';
  const email = user?.email || 'rahul@sharmahardware.com';
  const address =
    profile?.address || 'Shop No. 15, Sector 62, Noida, Uttar Pradesh - 201301';
  const storeId = profile?.id ? `FKS000${profile.id}` : 'FKS0001234';

  const handleEdit = () => {
    Alert.alert(
      'Edit Store Details',
      'Store address and business credentials changes require FixKart Admin verification.',
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            if (navigation.canGoBack()) navigation.goBack();
            else navigation.navigate('Main', { screen: 'AccountTab' });
          }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.headerButton}
        >
          <StoreIcon name="arrow-left" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Store Profile</Text>
        <TouchableOpacity onPress={handleEdit} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.editText}>Edit</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Store Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.avatarBox}>
            <StoreIcon name="store" size={32} color={colors.primary} />
          </View>
          <View style={styles.heroInfo}>
            <Text style={styles.storeNameText}>{storeName}</Text>
            <View style={styles.verifiedBadge}>
              <StoreIcon name="verified" size={12} color="#059669" />
              <Text style={styles.verifiedBadgeText}>Verified Partner Store</Text>
            </View>
          </View>
        </View>

        {/* Counter Pickup Operational Capabilities */}
        <View style={styles.capabilitiesCard}>
          <View style={styles.capabilityItem}>
            <StoreIcon name="package" size={16} color={colors.primary} />
            <Text style={styles.capabilityText}>Plumber Counter Self-Pickup</Text>
          </View>
          <View style={styles.capabilityItem}>
            <StoreIcon name="verified" size={16} color="#059669" />
            <Text style={styles.capabilityText}>FixKart Authorized Fulfillment Node</Text>
          </View>
        </View>

        {/* Store Details Table */}
        <View style={styles.tableCard}>
          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Owner Name</Text>
            <Text style={styles.tableValue}>{ownerName}</Text>
          </View>

          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Mobile Number</Text>
            <Text style={styles.tableValue}>{phone}</Text>
          </View>

          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Email</Text>
            <Text style={styles.tableValue}>{email}</Text>
          </View>

          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Store Address</Text>
            <Text style={[styles.tableValue, styles.addressValue]}>{address}</Text>
          </View>

          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Store Node ID</Text>
            <Text style={[styles.tableValue, styles.monoValue]}>{storeId}</Text>
          </View>

          <View style={[styles.tableRow, styles.tableRowLast]}>
            <Text style={styles.tableLabel}>Partner Since</Text>
            <Text style={styles.tableValue}>Jan 2023</Text>
          </View>
        </View>

        {/* Business & Tax Verification Card */}
        <Text style={styles.sectionHeader}>Business & Banking Credentials</Text>
        <View style={styles.tableCard}>
          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>GSTIN</Text>
            <View style={styles.valWithBadge}>
              <Text style={[styles.tableValue, styles.monoValue]}>07AAAAA0000A1Z5</Text>
              <View style={styles.tinyGreenBadge}>
                <Text style={styles.tinyGreenText}>Active</Text>
              </View>
            </View>
          </View>

          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>PAN Number</Text>
            <Text style={[styles.tableValue, styles.monoValue]}>AAAAA0000A</Text>
          </View>

          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Payout Bank</Text>
            <Text style={styles.tableValue}>HDFC Bank (A/C **4821)</Text>
          </View>

          <View style={[styles.tableRow, styles.tableRowLast]}>
            <Text style={styles.tableLabel}>Store Counter Timings</Text>
            <Text style={styles.tableValue}>8:00 AM – 9:00 PM (All days)</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  editText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  avatarBox: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.md,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  heroInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  storeNameText: {
    fontSize: 15,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: borderRadius.round,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 6,
    alignSelf: 'flex-start',
    gap: 4,
  },
  verifiedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  capabilitiesCard: {
    backgroundColor: '#F0F9FF',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: 8,
  },
  capabilityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  capabilityText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0369A1',
  },
  tableCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableRowLast: {
    borderBottomWidth: 0,
  },
  tableLabel: {
    fontSize: 12.5,
    color: colors.textSecondary,
    width: '35%',
  },
  tableValue: {
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'right',
    flex: 1,
  },
  addressValue: {
    lineHeight: 18,
  },
  monoValue: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  valWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tinyGreenBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  tinyGreenText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  sectionHeader: {
    fontSize: 13.5,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
});

export default StoreProfileScreen;
