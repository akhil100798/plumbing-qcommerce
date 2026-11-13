import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Alert,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { colors, borderRadius, spacing, typography } from '../../theme';
import { useAppDispatch, useAppSelector } from '../../redux/store';
import { logout } from '../../redux/slices/authSlice';
import { authService } from '../../services/auth/authService';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { AppStackParamList } from '../../types/navigation';
import { StoreIcon } from '../../components/common/StoreIcon';

export const AccountScreen = () => {
  const navigation = useNavigation<NavigationProp<AppStackParamList>>();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.storeUser);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out of the Store Partner App?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await authService.logout();
          dispatch(logout());
          navigation.navigate('Auth', { screen: 'Login' });
        },
      },
    ]);
  };

  const getInitials = (name?: string) => {
    if (!name) return 'RS';
    return name
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const userName = user?.fullName || 'Rahul Sharma';
  const initials = getInitials(userName);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

      {/* Top Header */}
      <View style={styles.header}>
        <View style={{ width: 24 }} />
        <Text style={styles.headerTitle}>Account & Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Card (Pixel Refined) */}
        <View style={styles.profileCard}>
          <View style={styles.profileLeft}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View style={styles.profileMeta}>
              <Text style={styles.userName}>{userName}</Text>
              <Text style={styles.userRole}>Store Partner</Text>
            </View>
          </View>
          <View style={styles.verifiedBadge}>
            <StoreIcon name="verified" size={13} color="#10B981" />
            <Text style={styles.verifiedText}>Verified</Text>
          </View>
        </View>

        {/* Settings Menu Card */}
        <View style={styles.menuCard}>
          {/* Personal Information */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('StoreProfile')}
            activeOpacity={0.7}
          >
            <View style={styles.menuItemLeft}>
              <StoreIcon name="account" size={19} color={colors.textSecondary} />
              <Text style={styles.menuItemLabel}>Personal Information</Text>
            </View>
            <StoreIcon name="arrow-right" size={15} color={colors.textMuted} />
          </TouchableOpacity>

          {/* Store & KYC */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('StoreProfile')}
            activeOpacity={0.7}
          >
            <View style={styles.menuItemLeft}>
              <StoreIcon name="store" size={19} color={colors.textSecondary} />
              <Text style={styles.menuItemLabel}>Store & KYC</Text>
            </View>
            <StoreIcon name="arrow-right" size={15} color={colors.textMuted} />
          </TouchableOpacity>

          {/* Bank Details & Payouts */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('Wallet')}
            activeOpacity={0.7}
          >
            <View style={styles.menuItemLeft}>
              <StoreIcon name="wallet" size={19} color={colors.textSecondary} />
              <Text style={styles.menuItemLabel}>Bank Details & Payouts</Text>
            </View>
            <StoreIcon name="arrow-right" size={15} color={colors.textMuted} />
          </TouchableOpacity>

          {/* Notification Settings */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('Notifications')}
            activeOpacity={0.7}
          >
            <View style={styles.menuItemLeft}>
              <StoreIcon name="notification" size={19} color={colors.textSecondary} />
              <Text style={styles.menuItemLabel}>Notification Settings</Text>
            </View>
            <StoreIcon name="arrow-right" size={15} color={colors.textMuted} />
          </TouchableOpacity>

          {/* Offers & Promotions */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('OffersPromotions')}
            activeOpacity={0.7}
          >
            <View style={styles.menuItemLeft}>
              <StoreIcon name="promotion" size={19} color={colors.textSecondary} />
              <Text style={styles.menuItemLabel}>Offers & Promotions</Text>
            </View>
            <StoreIcon name="arrow-right" size={15} color={colors.textMuted} />
          </TouchableOpacity>

          {/* Reviews & Ratings */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('ReviewsRatings')}
            activeOpacity={0.7}
          >
            <View style={styles.menuItemLeft}>
              <StoreIcon name="review" size={19} color={colors.textSecondary} />
              <Text style={styles.menuItemLabel}>Reviews & Ratings</Text>
            </View>
            <StoreIcon name="arrow-right" size={15} color={colors.textMuted} />
          </TouchableOpacity>

          {/* App Settings */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() =>
              Alert.alert('App Settings', 'Store Partner App Version: 2.1.0 (Production Build)\nAuto-refresh interval: 3 seconds')
            }
            activeOpacity={0.7}
          >
            <View style={styles.menuItemLeft}>
              <StoreIcon name="filter" size={19} color={colors.textSecondary} />
              <Text style={styles.menuItemLabel}>App Settings</Text>
            </View>
            <StoreIcon name="arrow-right" size={15} color={colors.textMuted} />
          </TouchableOpacity>

          {/* Help & Support */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() =>
              Alert.alert(
                'Help & Support',
                'FixKart Store Partner Helpline:\nPhone: 1800-456-9210\nEmail: partner.support@fixkart.com\nHours: 7:00 AM – 10:00 PM (All Days)'
              )
            }
            activeOpacity={0.7}
          >
            <View style={styles.menuItemLeft}>
              <StoreIcon name="support" size={19} color={colors.textSecondary} />
              <Text style={styles.menuItemLabel}>Help & Support</Text>
            </View>
            <StoreIcon name="arrow-right" size={15} color={colors.textMuted} />
          </TouchableOpacity>

          {/* About FixKart Partner App */}
          <TouchableOpacity
            style={[styles.menuItem, styles.menuItemLast]}
            onPress={() =>
              Alert.alert(
                'About FixKart Partner App',
                'FixKart Store Partner v2.1.0\nCounter Fulfillment & Plumber Quick-Commerce Platform\n© 2025 FixKart Inc. All rights reserved.'
              )
            }
            activeOpacity={0.7}
          >
            <View style={styles.menuItemLeft}>
              <StoreIcon name="security" size={19} color={colors.textSecondary} />
              <Text style={styles.menuItemLabel}>About FixKart Partner App</Text>
            </View>
            <StoreIcon name="arrow-right" size={15} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Logout Card */}
        <TouchableOpacity
          style={styles.logoutCard}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <StoreIcon name="close" size={19} color="#EF4444" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
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
  headerTitle: {
    fontSize: 16,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  profileCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  profileLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#1D4ED8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.surface,
    fontSize: 18,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 0.5,
  },
  profileMeta: {
    marginLeft: spacing.md,
  },
  userName: {
    fontSize: 16,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  userRole: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: borderRadius.round,
    gap: 4,
  },
  verifiedText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#10B981',
  },
  menuCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: spacing.md,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuItemLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0F172A',
  },
  logoutCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  logoutText: {
    fontSize: 14.5,
    fontWeight: '600',
    color: '#EF4444',
  },
});

export default AccountScreen;
