import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { useDispatch, useSelector } from 'react-redux';

import { Avatar } from '../../components/common/Avatar';
import { logout, setAvailability } from '../../redux/slices/authSlice';
import { profileService } from '../../services/profile/profileService';
import { colors, spacing, typography, borderRadius } from '../../theme';
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
import ArrowRightIcon from '../../assets/icons/arrow-right.svg';

type Props = StackScreenProps<AppStackParamList, any>;

const MENU_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: HomeIcon, destination: 'Main' },
  { key: 'myJobs', label: 'My Jobs', icon: ActiveJobIcon, destination: 'ActiveJob' },
  { key: 'earnings', label: 'Earnings', icon: EarningsIcon, destination: 'Earnings' },
  { key: 'wallet', label: 'Wallet', icon: WalletIcon, destination: 'Wallet' },
  { key: 'myReviews', label: 'My Reviews', icon: RatingIcon, destination: 'Profile' },
  { key: 'myDocuments', label: 'My Documents', icon: ShieldIcon, destination: 'Profile' },
  { key: 'support', label: 'Support', icon: SupportIcon, destination: 'Chat', params: { name: 'Support', role: 'Support' } },
  { key: 'settings', label: 'Settings', icon: SettingsIcon, destination: 'Profile' },
];

export function DrawerMenuScreen({ navigation }: Props) {
  const dispatch = useDispatch();
  const { plumber } = useSelector((state: RootState) => state.auth);
  const [isOnline, setIsOnline] = useState<boolean>(plumber?.availability ?? true);

  const plumberName = plumber?.fullName || 'Ramesh Kumar';

  const handleToggleOnline = async (val: boolean) => {
    setIsOnline(val);
    dispatch(setAvailability(val));
    try {
      await profileService.updateAvailability(val);
    } catch (err: any) {
      setIsOnline(!val);
      dispatch(setAvailability(!val));
      Alert.alert('Status Error', err?.message || 'Failed to update online status.');
    }
  };

  const handleNavigate = (item: (typeof MENU_ITEMS)[0]) => {
    if (item.destination) {
      if (item.destination === 'ActiveJob') {
        navigation?.navigate?.('Main');
      } else {
        navigation?.navigate?.(item.destination as any, item.params);
      }
    }
  };

  const handleLogout = () => {
    Alert.alert('Confirm Logout', 'Are you sure you want to logout of the FixKart Plumber app?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => {
          dispatch(logout());
          navigation?.replace?.('Auth');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile header */}
        <View style={styles.profileRow}>
          <TouchableOpacity
            style={styles.profileInfo}
            onPress={() => navigation?.navigate?.('Profile')}
            activeOpacity={0.7}
          >
            <Avatar name={plumberName} size={48} />
            <View style={styles.profileText}>
              <Text style={styles.name}>{plumberName}</Text>
              <Text style={styles.viewProfile}>View Profile</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.onlineToggle}>
            <Text style={[styles.onlineLabel, !isOnline && styles.offlineLabel]}>
              {isOnline ? 'Online' : 'Offline'}
            </Text>
            <Switch
              value={isOnline}
              onValueChange={handleToggleOnline}
              trackColor={{ false: '#D1D5DB', true: colors.success }}
              thumbColor="#FFFFFF"
              ios_backgroundColor="#D1D5DB"
            />
          </View>
        </View>

        <View style={styles.divider} />

        {/* Menu list */}
        <View style={styles.menuList}>
          {MENU_ITEMS.map((item) => {
            const IconComp = item.icon;
            return (
              <TouchableOpacity
                key={item.key}
                style={styles.menuItem}
                onPress={() => handleNavigate(item)}
                activeOpacity={0.6}
              >
                <View style={styles.menuIconContainer}>
                  <IconComp width={20} height={20} stroke="#4B5563" />
                </View>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <ArrowRightIcon width={18} height={18} stroke="#C4C9D0" />
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.divider} />

        {/* Logout */}
        <TouchableOpacity
          style={styles.menuItem}
          onPress={handleLogout}
          activeOpacity={0.6}
        >
          <View style={styles.menuIconContainer}>
            <LogoutIcon width={20} height={20} stroke={colors.error} />
          </View>
          <Text style={[styles.menuLabel, styles.logoutLabel]}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: 16,
    paddingBottom: 32,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  profileText: {
    justifyContent: 'center',
    marginLeft: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  viewProfile: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  onlineToggle: {
    alignItems: 'center',
  },
  onlineLabel: {
    fontSize: 12,
    color: colors.success,
    fontWeight: typography.fontWeight.medium,
    marginBottom: 4,
  },
  offlineLabel: {
    color: colors.textMuted,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F1F3',
    marginVertical: 12,
  },
  menuList: {
    paddingHorizontal: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  menuIconContainer: {
    width: 28,
    alignItems: 'center',
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.medium,
  },
  logoutLabel: {
    color: colors.error,
  },
});
