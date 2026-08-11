import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';

import { ProfileMenuItem } from '../components/cards/ProfileMenuItem';
import { borderRadius, colors, spacing, typography } from '../theme';
import { AppStackParamList, MainTabParamList } from '../types/navigation';
import { RootState } from '../redux/store';
import { logout } from '../redux/slices/authSlice';
import { setBalance } from '../redux/slices/walletSlice';
import { setProductOrders, setServiceOrders } from '../redux/slices/ordersSlice';
import { WalletRepository } from '../services/wallet/walletRepository';
import { OrderRepository } from '../services/orders/orderRepository';
import { CartRepository } from '../services/cart/cartRepository';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'ProfileTab'>,
  StackScreenProps<AppStackParamList>
>;

import { tokenStorage } from '../services/tokenStorage';
import { clearCart } from '../redux/slices/cartSlice';

export function ProfileScreen({ navigation }: Props) {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const walletBalance = useSelector((state: RootState) => state.wallet.balance);
  const productOrders = useSelector((state: RootState) => state.orders.productOrders);
  const serviceOrders = useSelector((state: RootState) => state.orders.serviceOrders);

  const totalOrders = productOrders.length + serviceOrders.length;

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const balance = await WalletRepository.getBalance();
        dispatch(setBalance(balance));
      } catch (err) {
        console.warn('Failed to load wallet balance', err);
      }

      if (user?.id) {
        try {
          const sOrders = await OrderRepository.getCustomerServiceOrders(user.id);
          dispatch(setServiceOrders(sOrders));
        } catch (err) {
          console.warn('Failed to load service orders', err);
        }
      }
    };

    fetchProfileData();
  }, [user, dispatch]);

  const handleLogout = async () => {
    try {
      await tokenStorage.deleteItem('token');
      await tokenStorage.deleteItem('refreshToken');
    } catch (err) {
      console.warn('Error clearing tokens during logout', err);
    }
    dispatch(clearCart());
    dispatch(logout());
    const rootNav = navigation as unknown as StackNavigationProp<AppStackParamList>;
    rootNav.reset({
      index: 0,
      routes: [{ name: 'Auth' }],
    });
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Account Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* User Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(user?.fullName || 'User')}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.fullName || 'FixKart Customer'}</Text>
            <Text style={styles.userEmail}>{user?.email || 'customer@fixkart.com'}</Text>
            <Text style={styles.userPhone}>{user?.phone || '+91 9876543210'}</Text>
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{totalOrders}</Text>
            <Text style={styles.statLabel}>Orders</Text>
          </View>
          <View style={styles.statBoxDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statVal}>Active</Text>
            <Text style={styles.statLabel}>Account</Text>
          </View>
          <View style={styles.statBoxDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statVal}>5.0 ★</Text>
            <Text style={styles.statLabel}>Member</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Account Settings & Preferences</Text>

        <ProfileMenuItem
          icon="📍"
          title="Saved Addresses"
          subtitle="Manage home, office, and job site locations"
          onPress={() => navigation.navigate('AddressManagement')}
        />

        <ProfileMenuItem
          icon="📦"
          title="Service & Order History"
          subtitle="View active, completed, and past bookings"
          onPress={() => navigation.navigate('OrdersTab')}
        />

        <ProfileMenuItem
          icon="🔔"
          title="Notification Center"
          subtitle="Track active plumber updates and material alerts"
          onPress={() => navigation.navigate('Notifications')}
        />

        <ProfileMenuItem
          icon="⚙️"
          title="App Settings"
          subtitle="Notification preferences, security, and app info"
          onPress={() => navigation.navigate('Settings')}
        />

        <ProfileMenuItem
          icon="❓"
          title="Help & Support"
          subtitle="FAQs, report an issue, and customer support"
          onPress={() => navigation.navigate('Support')}
        />

        <View style={styles.logoutContainer}>
          <ProfileMenuItem
            icon="🚪"
            title="Log Out"
            onPress={handleLogout}
            showArrow={false}
            textColor={colors.error || '#BA1A1A'}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background || '#F8F9FF',
  },
  header: {
    paddingHorizontal: spacing.layout,
    paddingVertical: spacing.md,
    backgroundColor: colors.surfaceContainerLowest || '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.border || '#C1C6D6',
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.heading,
    color: colors.textPrimary,
  },
  scrollContent: {
    padding: spacing.layout,
    paddingBottom: spacing.huge,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLowest || '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border || '#C1C6D6',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surfaceContainerLow || '#EFF4FF',
    borderWidth: 1,
    borderColor: colors.border || '#C1C6D6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.heading,
    color: colors.primaryContainer || colors.primary,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.heading,
    color: colors.textPrimary,
  },
  userEmail: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontFamily: typography.fontFamily.body,
    marginTop: 2,
  },
  userPhone: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontFamily: typography.fontFamily.body,
    fontWeight: typography.fontWeight.bold,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceContainerLowest || '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border || '#C1C6D6',
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.lg,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statBoxDivider: {
    width: 1,
    backgroundColor: colors.border || '#C1C6D6',
    marginVertical: spacing.xs,
  },
  statVal: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.heading,
    color: colors.primaryContainer || colors.primary,
  },
  statLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontFamily: typography.fontFamily.body,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.body,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  logoutContainer: {
    marginTop: spacing.md,
  },
});

