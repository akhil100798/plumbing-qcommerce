import { NavigationProp, useNavigation } from '@react-navigation/native';
import React from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import ProfileIcon from '../../assets/icons/profile.svg';
import WarehouseIcon from '../../assets/icons/warehouse.svg';
import BottomTabBar from '../../components/common/BottomTabBar';
import { logout } from '../../redux/slices/authSlice';
import { useAppDispatch, useAppSelector } from '../../redux/store';
import { authService } from '../../services/auth/authService';
import { borderRadius, colors, shadows, spacing, typography } from '../../theme';
import { AppStackParamList } from '../../types/navigation';

export function AccountScreen() {
  const navigation = useNavigation<NavigationProp<AppStackParamList>>();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.storeUser);

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out of the FixKart Store Manager App?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await authService.logout();
          dispatch(logout());
          navigation.navigate('Auth', { screen: 'Login' });
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Account & Store Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
        {/* Profile Identity Card */}
        <TouchableOpacity
          style={styles.profileCard}
          onPress={() => navigation.navigate('StoreProfile')}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>🏬</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.userName}>{user?.fullName || 'Store Partner'}</Text>
            <Text style={styles.userEmail}>{user?.email || user?.phone || 'Manager'}</Text>
            <View style={styles.rolePill}>
              <Text style={styles.rolePillText}>STORE_MANAGER</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Navigation Menu Card */}
        <View style={styles.menuCard}>
          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('StoreProfile')}>
            <ProfileIcon width={20} height={20} stroke={colors.primary} />
            <Text style={styles.menuItemText}>Store Identity & Contact Details</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Main', { screen: 'InventoryTab' })}>
            <WarehouseIcon width={20} height={20} stroke={colors.primary} />
            <Text style={styles.menuItemText}>Hardware Store Inventory</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Main', { screen: 'MaterialsTab' })}>
            <WarehouseIcon width={20} height={20} stroke={colors.primary} />
            <Text style={styles.menuItemText}>Material Request Queue</Text>
          </TouchableOpacity>
        </View>

        {/* Logout Action CTA */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Sign Out of Store Session</Text>
        </TouchableOpacity>
      </ScrollView>

      <BottomTabBar active="Account" navigation={navigation} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background || '#F9F9F9' },
  header: {
    paddingHorizontal: spacing.layout,
    paddingVertical: spacing.md,
    backgroundColor: colors.surfaceContainerLowest || '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.border || '#C6C5D4',
  },
  headerTitle: { fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
  scrollBody: { padding: spacing.layout, paddingBottom: spacing.giant },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLowest || '#FFFFFF',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border || '#C6C5D4',
    ...shadows.sm,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surfaceContainerLow || '#F4F3F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarText: { fontSize: 22 },
  userName: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
  userEmail: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  rolePill: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceContainerLow || '#F4F3F7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    marginTop: 4,
  },
  rolePillText: { fontSize: 9, fontWeight: '700', color: colors.primary },
  menuCard: {
    backgroundColor: colors.surfaceContainerLowest || '#FFFFFF',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border || '#C6C5D4',
    ...shadows.sm,
    marginBottom: spacing.md,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceContainerLow || '#F4F3F7',
    gap: spacing.sm,
  },
  menuItemText: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
  logoutBtn: {
    backgroundColor: colors.dangerLight || '#FFDAD6',
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  logoutText: { color: colors.danger, fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.bold },
});
