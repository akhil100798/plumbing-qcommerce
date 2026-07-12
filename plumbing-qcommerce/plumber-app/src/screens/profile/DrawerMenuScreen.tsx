import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { useDispatch, useSelector } from 'react-redux';

import { ScreenWrapper } from '../../components/common/ScreenWrapper';
import { RatingBadge } from '../../components/cards/RatingBadge';
import { logout } from '../../redux/slices/authSlice';
import { colors, spacing, typography } from '../../theme';
import { AppStackParamList } from '../../types/navigation';
import { RootState } from '../../redux/store';

import HomeIcon from '../../assets/icons/home.svg';
import ActiveJobIcon from '../../assets/icons/active-job.svg';
import EarningsIcon from '../../assets/icons/earnings.svg';
import WalletIcon from '../../assets/icons/wallet.svg';
import RatingIcon from '../../assets/icons/rating.svg';
import ShieldIcon from '../../assets/icons/shield-verified.svg';
import SupportIcon from '../../assets/icons/chat.svg';
import SettingsIcon from '../../assets/icons/settings.svg';
import LogoutIcon from '../../assets/icons/logout.svg';
import CloseIcon from '../../assets/icons/close.svg';

type Props = StackScreenProps<AppStackParamList, any>;

export function DrawerMenuScreen({ navigation }: Props) {
  const dispatch = useDispatch();
  const { plumber } = useSelector((state: RootState) => state.auth);

  const menuItems = [
    { label: 'Dashboard', icon: HomeIcon, destination: 'Main' },
    { label: 'My Jobs', icon: ActiveJobIcon, destination: 'ActiveJob' },
    { label: 'Earnings', icon: EarningsIcon, destination: 'Earnings' },
    { label: 'My Wallet', icon: WalletIcon, destination: 'Wallet' },
    { label: 'Reviews', icon: RatingIcon, destination: null },
    { label: 'Documents', icon: ShieldIcon, destination: null },
    { label: 'Support', icon: SupportIcon, destination: 'Chat', params: { name: 'Support', role: 'Support' } },
    { label: 'Settings', icon: SettingsIcon, destination: null },
  ];

  const handleLogout = () => {
    dispatch(logout());
    navigation.replace('Auth');
  };

  const handleItemPress = (item: any) => {
    if (item.destination) {
      if (item.destination === 'ActiveJob') {
        navigation.navigate('Main'); 
      } else {
        navigation.navigate(item.destination, item.params);
      }
    }
  };

  return (
    <ScreenWrapper safeAreaStyle={{ backgroundColor: colors.textPrimary }}>
      <View style={styles.container}>
        {/* Drawer Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
            <CloseIcon width={24} height={24} stroke={colors.surface} />
          </TouchableOpacity>
          
          <View style={styles.profileRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {plumber?.fullName.split(' ').map((n) => n[0]).join('') || 'RK'}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.name}>{plumber?.fullName || 'Ravi Kumar'}</Text>
              <Text style={styles.plumberId}>Plumber ID: {plumber?.plumberId || 'PLB12345'}</Text>
              <RatingBadge rating={plumber?.rating ?? 4.9} style={styles.badge} />
            </View>
          </View>
        </View>

        {/* Drawer Body (Menu Items) */}
        <ScrollView contentContainerStyle={styles.menuContainer}>
          {menuItems.map((item, index) => {
            const IconComp = item.icon;
            return (
              <TouchableOpacity
                key={index}
                style={styles.menuRow}
                onPress={() => handleItemPress(item)}
              >
                <View style={styles.rowLeft}>
                  <IconComp width={20} height={20} stroke={colors.textMuted} />
                  <Text style={styles.menuLabel}>{item.label}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Drawer Footer */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <LogoutIcon width={20} height={20} stroke={colors.error} />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.textPrimary,
  },
  header: {
    paddingHorizontal: spacing.layout,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  closeButton: {
    alignSelf: 'flex-end',
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    color: colors.surface,
    fontSize: 20,
    fontWeight: 'bold',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  avatarText: {
    color: colors.surface,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    color: colors.surface,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
  },
  plumberId: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
    marginTop: 2,
  },
  badge: {
    alignSelf: 'flex-start',
    marginTop: 6,
    backgroundColor: 'rgba(245, 158, 11, 0.25)',
  },
  menuContainer: {
    paddingVertical: spacing.md,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.layout + 4,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md + 4,
  },
  menuIcon: {
    fontSize: 20,
    color: colors.textMuted,
  },
  menuLabel: {
    color: colors.surface,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  },
  badgeContainer: {
    backgroundColor: colors.error,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: colors.surface,
    fontSize: 10,
    fontWeight: 'bold',
  },
  footer: {
    paddingHorizontal: spacing.layout,
    paddingVertical: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  logoutIcon: {
    fontSize: 20,
  },
  logoutText: {
    color: colors.error,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  },
});
