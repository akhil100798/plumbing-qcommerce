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

type Props = StackScreenProps<AppStackParamList, any>;

export function DrawerMenuScreen({ navigation }: Props) {
  const dispatch = useDispatch();
  const { plumber } = useSelector((state: RootState) => state.auth);

  const menuItems = [
    { label: 'Dashboard', icon: '🏠', destination: 'Main' },
    { label: 'My Jobs', icon: '🔧', destination: 'ActiveJob' },
    { label: 'Earnings', icon: '📈', destination: 'Earnings' },
    { label: 'Materials', icon: '🔩', destination: 'MaterialRequest' },
    { label: 'Training Center', icon: '🎓', destination: null },
    { label: 'Refer & Earn', icon: '🎁', destination: null },
    { label: 'Notifications', icon: '🔔', destination: null, badge: 3 },
    { label: 'Settings', icon: '⚙️', destination: null },
    { label: 'Help & Support', icon: '❓', destination: 'Chat', params: { name: 'Help Support', role: 'Support' } },
  ];

  const handleLogout = () => {
    dispatch(logout());
    navigation.replace('Auth');
  };

  const handleItemPress = (item: any) => {
    if (item.destination) {
      if (item.destination === 'ActiveJob') {
        navigation.navigate('Main'); // go back to main to show home, or alert
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
            <Text style={styles.closeText}>✕</Text>
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
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuRow}
              onPress={() => handleItemPress(item)}
            >
              <View style={styles.rowLeft}>
                <Text style={styles.menuIcon}>{item.icon}</Text>
                <Text style={styles.menuLabel}>{item.label}</Text>
              </View>
              {item.badge && (
                <View style={styles.badgeContainer}>
                  <Text style={styles.badgeText}>{item.badge}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Drawer Footer */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutIcon}>🚪</Text>
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
