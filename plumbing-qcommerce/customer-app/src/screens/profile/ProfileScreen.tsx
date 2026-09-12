import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { useAuth } from '../../services/authService';
import {
  ChevronRightIcon,
} from '../../assets/svg/Icons';

interface ProfileScreenProps {
  onNavigateToSavedAddresses: () => void;
  onNavigateToSupport: () => void;
  onNavigateToOrders: () => void;
  onLogout: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  onNavigateToSavedAddresses,
  onNavigateToSupport,
  onNavigateToOrders,
  onLogout,
}) => {
  const { user, rawUser, isAuthenticated, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    onLogout();
  };

  const menuSections = [
    {
      title: 'My Account & Bookings',
      items: [
        { title: 'Service Bookings & Order History', icon: '📋', action: onNavigateToOrders },
        { title: 'Saved Addresses & Locations', icon: '📍', action: onNavigateToSavedAddresses },
        { title: 'FixKart Plus Membership', icon: '⭐', sub: 'Active until Dec 2026', action: () => {} },
      ],
    },
    {
      title: 'Support & Preferences',
      items: [
        { title: '24x7 Customer Support & Chat', icon: '💬', action: onNavigateToSupport },
        { title: 'FixKart 60-Day Warranty Protection', icon: '🛡️', action: () => {} },
        { title: 'Notification Preferences', icon: '🔔', action: () => {} },
        { title: 'Refer & Earn ₹150', icon: '🎁', sub: `Code: ${user?.referralCode || 'FIXKART50'}`, action: () => {} },
      ],
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Profile</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* User Card */}
        <View style={styles.userCard}>
          <Image
            source={{
              uri:
                user?.avatarUrl ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
            }}
            style={styles.avatar}
          />
          <View style={styles.userInfo}>
            <View style={styles.userNameRow}>
              <Text style={styles.userName}>
                {user?.name || (isAuthenticated ? 'FixKart Customer' : 'Guest User')}
              </Text>
              {user?.isPlusMember && (
                <View style={styles.plusBadge}>
                  <Text style={styles.plusBadgeText}>PLUS</Text>
                </View>
              )}
            </View>
            <Text style={styles.userPhone}>
              {user?.phone ? `+91 ${user.phone}` : 'Sign in to sync your profile'}
            </Text>
            {user?.email ? <Text style={styles.userEmail}>{user.email}</Text> : null}
          </View>
        </View>

        {/* FixKart Coins & Referral Bar */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{user?.savedCoins || 450}</Text>
            <Text style={styles.statLabel}>FixKart Coins (₹{user?.savedCoins || 450})</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statValue}>₹2,400</Text>
            <Text style={styles.statLabel}>Total Saved</Text>
          </View>
        </View>

        {/* Menu Sections */}
        {menuSections.map((section, sIdx) => (
          <View key={sIdx} style={styles.section}>
            <Text style={styles.sectionHeader}>{section.title}</Text>
            <View style={styles.menuCard}>
              {section.items.map((item, iIdx) => (
                <TouchableOpacity
                  key={iIdx}
                  style={[
                    styles.menuItem,
                    iIdx < section.items.length - 1 && styles.menuItemBorder,
                  ]}
                  onPress={item.action}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                >
                  <Text style={styles.menuIcon}>{item.icon}</Text>
                  <View style={styles.menuTextCol}>
                    <Text style={styles.menuTitle}>{item.title}</Text>
                    {item.sub && <Text style={styles.menuSub}>{item.sub}</Text>}
                  </View>
                  <ChevronRightIcon size={18} color={colors.secondary} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8} accessibilityRole="button">
          <Text style={styles.logoutBtnText}>{isAuthenticated ? 'Log Out' : 'Sign In'}</Text>
        </TouchableOpacity>

        <Text style={styles.appVersion}>FixKart Customer App v1.0.0 • Connected to Development-2</Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceVariant,
  },
  headerTitle: {
    fontFamily: typography.h3.fontFamily,
    fontSize: 18,
    fontWeight: '600',
    color: colors.onBackground,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 90,
  },
  userCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.surfaceVariant,
    marginBottom: spacing.md,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.surfaceContainer,
  },
  userInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    fontFamily: typography.h3.fontFamily,
    fontSize: 18,
    fontWeight: '600',
    color: colors.onBackground,
  },
  plusBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 6,
  },
  plusBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#ffffff',
  },
  userPhone: {
    fontFamily: typography.body2.fontFamily,
    fontSize: 14,
    color: colors.secondary,
    marginTop: 2,
  },
  userEmail: {
    fontSize: 11,
    color: colors.outline,
    marginTop: 1,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.surfaceVariant,
    marginBottom: spacing.lg,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontFamily: typography.h3.fontFamily,
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  statLabel: {
    fontSize: 11,
    color: colors.secondary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.surfaceVariant,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    fontWeight: '700',
    color: colors.secondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  menuCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.surfaceVariant,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceVariant,
  },
  menuIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  menuTextCol: {
    flex: 1,
  },
  menuTitle: {
    fontFamily: typography.body2.fontFamily,
    fontSize: 14,
    fontWeight: '600',
    color: colors.onBackground,
  },
  menuSub: {
    fontSize: 11,
    color: colors.primary,
    marginTop: 2,
  },
  logoutBtn: {
    backgroundColor: colors.errorContainer,
    borderRadius: 14,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  logoutBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.error,
  },
  appVersion: {
    fontSize: 11,
    color: colors.outline,
    textAlign: 'center',
  },
});
