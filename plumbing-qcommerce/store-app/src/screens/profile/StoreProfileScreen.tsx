import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Alert } from 'react-native';
import { colors, borderRadius, spacing, typography, shadows } from '../../theme';
import { ScreenWrapper } from '../../components/common/ScreenWrapper';
import { AppHeader } from '../../components/common/AppHeader';
import { ProfileMenuItem } from '../../components/cards/WalletReviewsPromoCards';
import { storeService } from '../../services/store/storeService';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { AppStackParamList } from '../../types/navigation';
import { Store } from '../../types';
import { useAppSelector } from '../../redux/store';

export const StoreProfileScreen = () => {
  const navigation = useNavigation<NavigationProp<AppStackParamList>>();
  const user = useAppSelector(state => state.auth.storeUser);

  const [profile, setProfile] = useState<Store | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setNotice('Store session is not available. Please sign in again.');
        return;
      }

      try {
        const data = await storeService.getCurrentStoreProfile();
        setProfile(data);
        setNotice(null);
      } catch (error) {
        setProfile(null);
        setNotice(error instanceof Error ? error.message : 'Store profile is not available in staging.');
      }
    };

    fetchProfile();
  }, [user]);

  const handleMenuPress = (section: string) => {
    switch (section) {
      case 'details':
        Alert.alert(
          'Store Details',
          `Name: ${profile?.name || user?.fullName || 'Store account'}\nPhone: ${user?.phone || profile?.phone || 'Not available in staging'}\nAddress: ${profile?.address || 'Not available in staging'}`
        );
        break;
      case 'business':
        Alert.alert('Business Info', 'Business information is not available from the staging backend yet.');
        break;
      case 'bank':
        Alert.alert('Bank Details', 'Bank details are not available from the staging backend yet.');
        break;
      case 'gst':
        Alert.alert('GST Details', 'GST details are not available from the staging backend yet.');
        break;
      case 'docs':
        Alert.alert('Verification Documents', 'Verification documents are not available from the staging backend yet.');
        break;
      case 'timings':
        Alert.alert('Store Timings', 'Store timings are not available from the staging backend yet.');
        break;
    }
  };

  return (
    <ScreenWrapper style={styles.container}>
      <AppHeader title="Store Profile" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.scroll}>
        {notice && <Text style={styles.noticeText}>{notice}</Text>}
        {profile && (
          <View style={styles.profileHeader}>
            <View style={styles.storeAvatar}>
              <Text style={styles.storeAvatarText}>??</Text>
            </View>
            <Text style={styles.storeName}>{profile.name}</Text>
            <Text style={styles.storeId}>Store ID: {profile.id}</Text>

            <View style={styles.ratingRow}>
              <Text style={styles.star}>?</Text>
              <Text style={styles.ratingVal}>{profile.rating ?? 0} </Text>
              <Text style={styles.ratingCount}>{profile.rating ? '(rating available)' : '(not available in staging)'}</Text>
            </View>
          </View>
        )}

        <View style={styles.menuContainer}>
          <ProfileMenuItem emoji="??" label="Store Details" onPress={() => handleMenuPress('details')} />
          <ProfileMenuItem emoji="??" label="Business Information" onPress={() => handleMenuPress('business')} />
          <ProfileMenuItem emoji="??" label="Bank Details" onPress={() => handleMenuPress('bank')} />
          <ProfileMenuItem emoji="??" label="GST Details" onPress={() => handleMenuPress('gst')} />
          <ProfileMenuItem emoji="??" label="Documents" onPress={() => handleMenuPress('docs')} />
          <ProfileMenuItem emoji="?" label="Store Timings" onPress={() => handleMenuPress('timings')} />
        </View>
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
  },
  noticeText: {
    fontSize: typography.fontSize.xs,
    color: colors.danger,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.md,
  },
  profileHeader: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
    marginBottom: spacing.lg,
  },
  storeAvatar: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.round,
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  storeAvatarText: {
    fontSize: 32,
  },
  storeName: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  storeId: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  star: {
    color: colors.warning,
    fontSize: 14,
    marginRight: 2,
  },
  ratingVal: {
    fontSize: typography.fontSize.xs,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  ratingCount: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  menuContainer: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
    marginBottom: spacing.xl,
  },
});
export default StoreProfileScreen;


