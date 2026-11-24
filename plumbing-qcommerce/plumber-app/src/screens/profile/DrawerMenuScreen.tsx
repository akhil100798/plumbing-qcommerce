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

import { PlumberAvatar } from '../../components/common/PlumberAvatar';
import { logout, setAvailability } from '../../redux/slices/authSlice';
import { profileService } from '../../services/profile/profileService';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme';
import { AppStackParamList } from '../../types/navigation';
import { RootState } from '../../redux/store';
import {
  SvgNavHome,
  SvgNavJobs,
  SvgNavEarnings,
  SvgPayWallet,
  SvgNavProfile,
  SvgActionCheck,
} from '../../assets/svg';
import RatingIcon from '../../assets/icons/rating.svg';
import ShieldIcon from '../../assets/icons/shield-verified.svg';
import SupportIcon from '../../assets/icons/chat.svg';
import SettingsIcon from '../../assets/icons/settings.svg';
import LogoutIcon from '../../assets/icons/logout.svg';
import ArrowRightIcon from '../../assets/icons/arrow-right.svg';

type Props = StackScreenProps<AppStackParamList, any>;

const MENU_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: SvgNavHome, destination: 'Main' },
  { key: 'myJobs', label: 'My Jobs', icon: SvgNavJobs, destination: 'Main', params: { screen: 'Jobs' } },
  { key: 'earnings', label: 'Earnings', icon: SvgNavEarnings, destination: 'Earnings' },
  { key: 'wallet', label: 'Wallet', icon: SvgPayWallet, destination: 'Wallet' },
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
      if (item.destination === 'Main' && item.params) {
        (navigation as any)?.navigate('Main', item.params);
      } else {
        (navigation as any)?.navigate(item.destination, item.params);
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
      <View style={styles.container}>
        {/* Stitch Slide-Out Panel Container */}
        <View style={styles.drawerPanel}>
          {/* Top Section: Technician Profile Summary */}
          <View style={styles.profileHeader}>
            <TouchableOpacity
              style={styles.profileInfo}
              onPress={() => navigation?.navigate?.('Profile')}
              activeOpacity={0.7}
            >
              <PlumberAvatar size={48} online={isOnline} />
              <View style={styles.profileText}>
                <Text style={styles.name} numberOfLines={1}>{plumberName}</Text>
                <Text style={styles.viewProfile}>View Profile ›</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.onlineToggle}>
              <Text style={[styles.onlineLabel, !isOnline && styles.offlineLabel]}>
                {isOnline ? 'Online' : 'Offline'}
              </Text>
              <Switch
                value={isOnline}
                onValueChange={handleToggleOnline}
                trackColor={{ false: '#D1D5DB', true: colors.stitchGreen }}
                thumbColor="#FFFFFF"
                ios_backgroundColor="#D1D5DB"
              />
            </View>
          </View>

          {/* Main Navigation Menu List */}
          <ScrollView style={styles.menuScroll} showsVerticalScrollIndicator={false}>
            {MENU_ITEMS.map((item) => {
              const IconComp = item.icon as any;
              return (
                <TouchableOpacity
                  key={item.key}
                  style={styles.menuItem}
                  onPress={() => handleNavigate(item)}
                  activeOpacity={0.7}
                >
                  <View style={styles.menuIconBox}>
                    <IconComp width={18} height={18} fill="#64748B" stroke="#64748B" />
                  </View>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  <ArrowRightIcon width={14} height={14} stroke="#CBD5E1" />
                </TouchableOpacity>
              );
            })}

            <View style={styles.divider} />

            {/* Logout Item */}
            <TouchableOpacity
              style={[styles.menuItem, styles.logoutItem]}
              onPress={handleLogout}
              activeOpacity={0.7}
            >
              <View style={styles.menuIconBox}>
                <LogoutIcon width={18} height={18} stroke="#EF4444" />
              </View>
              <Text style={styles.logoutLabel}>Logout</Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Drawer Footer Branding */}
          <View style={styles.footerBranding}>
            <Text style={styles.brandingText}>FixKart Partner</Text>
            <Text style={styles.versionText}>v1.0.0</Text>
          </View>
        </View>
      </View>
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
    backgroundColor: '#FFFFFF',
  },
  drawerPanel: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    justifyContent: 'space-between',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  profileText: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  viewProfile: {
    fontSize: 12,
    color: colors.stitchBlue,
    fontWeight: '600',
    marginTop: 2,
  },
  onlineToggle: {
    alignItems: 'center',
  },
  onlineLabel: {
    fontSize: 10,
    color: colors.stitchGreen,
    fontWeight: '700',
    marginBottom: 2,
  },
  offlineLabel: {
    color: '#94A3B8',
  },
  menuScroll: {
    flex: 1,
    paddingVertical: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  menuIconBox: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    flex: 1,
    fontSize: 14,
    color: '#334155',
    fontWeight: '600',
    marginLeft: 10,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 8,
  },
  logoutItem: {
    backgroundColor: '#FEF2F2',
  },
  logoutLabel: {
    color: '#DC2626',
    fontWeight: '700',
    marginLeft: 10,
  },
  footerBranding: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  brandingText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  versionText: {
    fontSize: 11,
    color: '#CBD5E1',
    fontWeight: '500',
  },
});
