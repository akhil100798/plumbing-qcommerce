import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Alert } from 'react-native';
import { colors, borderRadius, spacing, typography, shadows } from '../../theme';
import { ScreenWrapper } from '../../components/common/ScreenWrapper';
import { AppHeader } from '../../components/common/AppHeader';
import { ProfileMenuItem } from '../../components/cards/WalletReviewsPromoCards';
import { storeService } from '../../services/store/storeService';
import { mockStore } from '../../mocks';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { AppStackParamList } from '../../types/navigation';
import { Store } from '../../types';

export const StoreProfileScreen = () => {
  const navigation = useNavigation<NavigationProp<AppStackParamList>>();
  
  const [profile, setProfile] = useState<Store | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const data = await storeService.getStoreProfile(123);
      setProfile(data);
    };
    fetchProfile();
  }, []);

  const handleMenuPress = (section: string) => {
    switch (section) {
      case 'details':
        Alert.alert('Store Details', `Name: ${mockStore.name}\nPhone: ${mockStore.phone}\nAddress: ${mockStore.address}`);
        break;
      case 'business':
        Alert.alert('Business Info', 'Category: Hardware & Plumbing Supplies\nOwner: Sai Praneeth\nReg No: APC120491823');
        break;
      case 'bank':
        Alert.alert('Bank Details', 'Bank: HDFC Bank Ltd\nAccount: •••• 9820\nIFSC: HDFC0000214\nType: Current Account');
        break;
      case 'gst':
        Alert.alert('GST Details', 'GSTIN: 36AAPCS8912C1ZS\nStatus: Active Verified');
        break;
      case 'docs':
        Alert.alert('Verification Documents', 'Trade License: Uploaded ✓\nPAN Card: Uploaded ✓\nCancelled Cheque: Uploaded ✓');
        break;
      case 'timings':
        Alert.alert('Store Timings', 'Monday - Saturday: 09:00 AM - 08:30 PM\nSunday: Closed');
        break;
    }
  };

  return (
    <ScreenWrapper style={styles.container}>
      <AppHeader title="Store Profile" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.scroll}>
        {profile && (
          <View style={styles.profileHeader}>
            <View style={styles.storeAvatar}>
              <Text style={styles.storeAvatarText}>🏪</Text>
            </View>
            <Text style={styles.storeName}>{profile.name}</Text>
            <Text style={styles.storeId}>Store ID: SP12345</Text>
            
            <View style={styles.ratingRow}>
              <Text style={styles.star}>★</Text>
              <Text style={styles.ratingVal}>{profile.rating} </Text>
              <Text style={styles.ratingCount}>(320 reviews)</Text>
            </View>
          </View>
        )}

        <View style={styles.menuContainer}>
          <ProfileMenuItem
            emoji="👤"
            label="Store Details"
            onPress={() => handleMenuPress('details')}
          />
          <ProfileMenuItem
            emoji="💼"
            label="Business Information"
            onPress={() => handleMenuPress('business')}
          />
          <ProfileMenuItem
            emoji="🏦"
            label="Bank Details"
            onPress={() => handleMenuPress('bank')}
          />
          <ProfileMenuItem
            emoji="📄"
            label="GST Details"
            onPress={() => handleMenuPress('gst')}
          />
          <ProfileMenuItem
            emoji="📁"
            label="Documents"
            onPress={() => handleMenuPress('docs')}
          />
          <ProfileMenuItem
            emoji="⏰"
            label="Store Timings"
            onPress={() => handleMenuPress('timings')}
          />
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
