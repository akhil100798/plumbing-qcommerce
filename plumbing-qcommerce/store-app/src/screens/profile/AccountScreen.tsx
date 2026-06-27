import React from 'react';
import { StyleSheet, Text, View, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { colors, borderRadius, spacing, typography, shadows } from '../../theme';
import { ScreenWrapper } from '../../components/common/ScreenWrapper';
import { AppHeader } from '../../components/common/AppHeader';
import { ProfileMenuItem } from '../../components/cards/WalletReviewsPromoCards';
import { useAppDispatch, useAppSelector } from '../../redux/store';
import { logout } from '../../redux/slices/authSlice';
import { authService } from '../../services/auth/authService';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { AppStackParamList } from '../../types/navigation';
import { mockStore } from '../../mocks';

export const AccountScreen = () => {
  const navigation = useNavigation<NavigationProp<AppStackParamList>>();
  const dispatch = useAppDispatch();
  const user = useAppSelector(state => state.auth.storeUser);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to log out of the Store App?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await authService.logout();
            dispatch(logout());
            navigation.navigate('Auth', { screen: 'Login' });
          }
        }
      ]
    );
  };

  const handleItemPress = (item: string) => {
    switch (item) {
      case 'profile':
        navigation.navigate('StoreProfile');
        break;
      case 'notifications':
        navigation.navigate('Notifications');
        break;
      case 'language':
        Alert.alert('App Language', 'English (United States)\nSystem Default');
        break;
      case 'help':
        Alert.alert('Help & Support', 'Support Email: partner.support@plumbcommerce.com\nHelpline: 1800-456-9210');
        break;
      case 'privacy':
        Alert.alert('Privacy Policy', 'Standard PlumbCommerce Partner Privacy Terms Apply.');
        break;
      case 'terms':
        Alert.alert('Terms & Conditions', 'Merchant Q-Commerce Standard terms and conditions apply.');
        break;
    }
  };

  return (
    <ScreenWrapper style={styles.container}>
      <AppHeader title="Account" />

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>👤</Text>
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{user?.fullName || 'Store Manager'}</Text>
            <Text style={styles.userEmail}>{user?.email || 'manager@sai-pipes.com'}</Text>
            <Text style={styles.userRole}>Store Owner</Text>
          </View>
        </View>

        <View style={styles.menuCard}>
          <ProfileMenuItem
            emoji="⚙️"
            label="Profile Settings"
            onPress={() => handleItemPress('profile')}
          />
          <ProfileMenuItem
            emoji="🔔"
            label="Notification Settings"
            onPress={() => handleItemPress('notifications')}
          />
          <ProfileMenuItem
            emoji="🌐"
            label="App Language"
            onPress={() => handleItemPress('language')}
          />
        </View>

        <View style={[styles.menuCard, { marginTop: spacing.md }]}>
          <ProfileMenuItem
            emoji="❓"
            label="Help & Support"
            onPress={() => handleItemPress('help')}
          />
          <ProfileMenuItem
            emoji="🛡️"
            label="Privacy Policy"
            onPress={() => handleItemPress('privacy')}
          />
          <ProfileMenuItem
            emoji="📄"
            label="Terms & Conditions"
            onPress={() => handleItemPress('terms')}
          />
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.logoutBtn}
          onPress={handleLogout}
        >
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
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
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.round,
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.lg,
  },
  avatarText: {
    fontSize: 28,
  },
  userDetails: {
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
    marginTop: 2,
  },
  userRole: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: typography.fontWeight.bold,
    marginTop: 4,
  },
  menuCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  logoutBtn: {
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderWidth: 1.5,
    borderColor: colors.danger,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.xl,
  },
  logoutText: {
    color: colors.danger,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  },
});
export default AccountScreen;
