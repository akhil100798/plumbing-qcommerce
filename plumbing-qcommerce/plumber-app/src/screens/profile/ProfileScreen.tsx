import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Switch,
  Alert,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { useDispatch, useSelector } from 'react-redux';

import { AppHeader } from '../../components/common/AppHeader';
import { ScreenWrapper } from '../../components/common/ScreenWrapper';
import { ProfileMenuItem } from '../../components/cards/ProfileMenuItem';
import { RatingBadge } from '../../components/cards/RatingBadge';
import { setAvailability, logout } from '../../redux/slices/authSlice';
import { profileService } from '../../services/profile/profileService';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { AppStackParamList } from '../../types/navigation';
import { RootState } from '../../redux/store';

type Props = StackScreenProps<AppStackParamList, 'Profile' | any>;

export function ProfileScreen({ navigation }: Props) {
  const dispatch = useDispatch();
  const { plumber } = useSelector((state: RootState) => state.auth);

  const handleToggleOnline = async (value: boolean) => {
    dispatch(setAvailability(value));
    await profileService.updateAvailability(value);
  };

  const handleLogout = () => {
    Alert.alert('Confirm Logout', 'Are you sure you want to logout of the PlumbCommerce Plumber app?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => {
          dispatch(logout());
          navigation.replace('Auth');
        },
      },
    ]);
  };

  const handleNavigation = (menuName: string) => {
    if (menuName === 'Support') {
      navigation.navigate('Chat', { name: 'Operations Support', role: 'Support' });
    } else {
      Alert.alert('Menu Option', `Viewing ${menuName} details (Demo Mode)`);
    }
  };

  return (
    <ScreenWrapper>
      <AppHeader title="My Profile" onBackPress={() => navigation.navigate('Main')} />
      
      <ScrollView contentContainerStyle={styles.content}>
        {/* Profile Card Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {plumber?.fullName.split(' ').map((n) => n[0]).join('') || 'RK'}
            </Text>
          </View>
          <Text style={styles.name}>{plumber?.fullName || 'Ravi Kumar'}</Text>
          <Text style={styles.plumberId}>Plumber ID: {plumber?.plumberId || 'PLB12345'}</Text>
          <RatingBadge rating={plumber?.rating ?? 4.9} count={plumber?.ratingsCount ?? 324} style={styles.badge} />
        </View>

        {/* Menu Items Block */}
        <View style={styles.menuContainer}>
          <ProfileMenuItem title="Personal Details" onPress={() => handleNavigation('Personal Details')} />
          <ProfileMenuItem title="Bank Details" onPress={() => handleNavigation('Bank Details')} />
          <ProfileMenuItem title="Documents" onPress={() => handleNavigation('Documents')} />
          <ProfileMenuItem title="Vehicle Details" onPress={() => handleNavigation('Vehicle Details')} />
          
          {/* Availability Toggle Menu Row */}
          <ProfileMenuItem
            title="Availability Status"
            rightElement={
              <Switch
                value={plumber?.availability ?? false}
                onValueChange={handleToggleOnline}
                trackColor={{ false: '#CBD5E1', true: '#86EFAC' }}
                thumbColor={(plumber?.availability) ? '#10B981' : '#F8FAFC'}
              />
            }
          />

          <ProfileMenuItem title="Help & Support" onPress={() => handleNavigation('Support')} />
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.huge,
    backgroundColor: colors.background,
  },
  profileHeader: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingVertical: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  avatarText: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.black,
    color: colors.primary,
  },
  name: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  plumberId: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  badge: {
    marginTop: spacing.sm,
  },
  menuContainer: {
    marginTop: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  logoutBtn: {
    marginHorizontal: spacing.layout,
    marginTop: spacing.giant,
    height: 52,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  logoutText: {
    color: colors.error,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  },
});
