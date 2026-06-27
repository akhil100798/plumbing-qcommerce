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

  const handleLogout = () => {
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
            <Text style={styles.userName}>{user?.fullName || 'Guest User'}</Text>
            <Text style={styles.userEmail}>{user?.email || 'guest@plumbcommerce.com'}</Text>
            <Text style={styles.userPhone}>{user?.phone || 'No phone number'}</Text>
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <TouchableOpacity style={styles.statBox} onPress={() => navigation.navigate('Wallet')}>
            <Text style={styles.statVal}>₹{walletBalance}</Text>
            <Text style={styles.statLabel}>Wallet</Text>
          </TouchableOpacity>
          <View style={styles.statBoxDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{totalOrders}</Text>
            <Text style={styles.statLabel}>Orders</Text>
          </View>
          <View style={styles.statBoxDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statVal}>4.8 ★</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Account & Services</Text>

        <ProfileMenuItem
          icon="👛"
          title="Wallet & Offers"
          subtitle="View balance, add money, and browse active promos"
          onPress={() => navigation.navigate('Wallet')}
        />

        <ProfileMenuItem
          icon="📍"
          title="Address Management"
          subtitle="Manage your home, office, and other saved addresses"
          onPress={() => navigation.navigate('AddressManagement')}
        />

        <ProfileMenuItem
          icon="💳"
          title="Payment Methods"
          subtitle="Saved UPIs, debit cards, and wallets"
          onPress={() => navigation.navigate('PaymentMethods')}
        />

        <ProfileMenuItem
          icon="⚙️"
          title="Settings"
          subtitle="Notifications, permissions, and app preferences"
          onPress={() => navigation.navigate('Settings')}
        />

        <ProfileMenuItem
          icon="❓"
          title="Help & Support"
          subtitle="Frequently asked questions and support chats"
          onPress={() => navigation.navigate('Support')}
        />

        <View style={styles.logoutContainer}>
          <ProfileMenuItem
            icon="🚪"
            title="Log Out"
            onPress={handleLogout}
            showArrow={false}
            textColor={colors.error}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.layout,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  scrollContent: {
    padding: spacing.layout,
    paddingBottom: spacing.huge,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    fontSize: 22,
    fontWeight: typography.fontWeight.black,
    color: colors.primary,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  userEmail: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
    marginTop: 2,
  },
  userPhone: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.bold,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
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
    width: 1.5,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  statVal: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.black,
    color: colors.primary,
  },
  statLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  logoutContainer: {
    marginTop: spacing.md,
  },
});

