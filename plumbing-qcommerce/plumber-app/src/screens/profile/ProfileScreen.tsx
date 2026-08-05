import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  SafeAreaView,
  Alert,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { useDispatch, useSelector } from 'react-redux';

import { AppHeader } from '../../components/common/AppHeader';
import { Avatar } from '../../components/common/Avatar';
import { MenuRow } from '../../components/cards/MenuRow';
import { setAvailability, logout } from '../../redux/slices/authSlice';
import { profileService } from '../../services/profile/profileService';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme';
import { AppStackParamList } from '../../types/navigation';
import { RootState } from '../../redux/store';
import StarIcon from '../../assets/icons/star.svg';

type Props = StackScreenProps<AppStackParamList, 'Profile' | any>;

const STATS = [
  { label: 'Jobs Completed', value: '128' },
  { label: 'Rating', value: '4.8' },
  { label: 'Member Since', value: 'Mar 2023' },
];

const MENU_ITEMS = [
  { icon: 'person-outline', label: 'Personal Information' },
  { icon: 'options-outline', label: 'Availability Status' },
  { icon: 'document-text-outline', label: 'Documents' },
  { icon: 'card-outline', label: 'Bank Details' },
  { icon: 'notifications-outline', label: 'Notification Settings' },
  { icon: 'help-circle-outline', label: 'Help & Support' },
  { icon: 'log-out-outline', label: 'Logout', danger: true, showChevron: false },
];

export function ProfileScreen({ navigation }: Props) {
  const dispatch = useDispatch();
  const { plumber } = useSelector((state: RootState) => state.auth);

  const plumberName = plumber?.fullName || 'Ramesh Kumar';
  const plumberRating = plumber?.rating ?? 4.8;
  const plumberReviews = plumber?.ratingsCount ?? 125;

  const handleEditProfile = () => {
    Alert.alert('Edit Profile', 'Profile edit is not configured in staging.');
  };

  const handleLogout = () => {
    Alert.alert('Confirm Logout', 'Are you sure you want to logout of the FixKart Plumber app?', [
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
    if (menuName === 'Help & Support') {
      navigation.navigate('Chat', { name: 'Operations Support', role: 'Support' });
    } else {
      Alert.alert('Feature details', `${menuName} settings are not configured in staging.`);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title="Profile" onBackPress={() => navigation.navigate('Main')} />

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileTopRow}>
            <Avatar name={plumberName} size={56} />
            <View style={{ flex: 1, marginLeft: spacing.sm }}>
              <Text style={styles.name}>{plumberName}</Text>
              <View style={styles.ratingRow}>
                <StarIcon width={14} height={14} fill={colors.warning} stroke={colors.warning} />
                <Text style={styles.ratingText}>
                  {plumberRating} · {plumberReviews} Reviews
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
              <Text style={styles.editLabel}>Edit Profile</Text>
            </TouchableOpacity>
          </View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            {STATS.map((s, i) => (
              <React.Fragment key={s.label}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{s.value}</Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                </View>
                {i < STATS.length - 1 && <View style={styles.statDivider} />}
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* Menu Card */}
        <View style={styles.menuCard}>
          {MENU_ITEMS.map((item, i) => (
            <React.Fragment key={item.label}>
              <MenuRow
                icon={item.icon}
                label={item.label}
                danger={item.danger}
                showChevron={item.showChevron !== false}
                onPress={item.danger ? handleLogout : () => handleNavigation(item.label)}
              />
              {i < MENU_ITEMS.length - 1 && <View style={styles.menuDivider} />}
            </React.Fragment>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  body: { padding: spacing.md, paddingBottom: spacing.xl },
  profileCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  profileTopRow: { flexDirection: 'row', alignItems: 'center' },
  name: { fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  ratingText: { fontSize: typography.fontSize.xs, color: colors.textSecondary },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: borderRadius.sm,
  },
  editLabel: { fontSize: typography.fontSize.xs, color: colors.primary, fontWeight: typography.fontWeight.bold },
  statsRow: {
    flexDirection: 'row',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
  statLabel: { fontSize: typography.fontSize.xs, color: colors.textSecondary, marginTop: 2, textAlign: 'center' },
  statDivider: { width: 1, backgroundColor: colors.border },
  menuCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  menuDivider: { height: 1, backgroundColor: colors.border },
});
