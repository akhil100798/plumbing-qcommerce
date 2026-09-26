import { StackScreenProps } from '@react-navigation/stack';
import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { borderRadius, colors, spacing, typography } from '../theme';
import { AppStackParamList } from '../types/navigation';

type Props = StackScreenProps<AppStackParamList, 'Settings'>;

interface SettingToggleProps {
  label: string;
  sublabel?: string;
  active: boolean;
  onToggle: () => void;
}

function SettingToggle({ label, sublabel, active, onToggle }: SettingToggleProps) {
  return (
    <View style={styles.toggleRow}>
      <View style={styles.textColumn}>
        <Text style={styles.toggleLabel}>{label}</Text>
        {sublabel ? <Text style={styles.toggleSublabel}>{sublabel}</Text> : null}
      </View>
      <TouchableOpacity
        style={[styles.switchOuter, active ? styles.switchOuterActive : {}]}
        onPress={onToggle}
        activeOpacity={0.8}
      >
        <View style={[styles.switchInner, active ? styles.switchInnerActive : {}]} />
      </TouchableOpacity>
    </View>
  );
}

export function SettingsScreen({ navigation }: Props) {
  const [pushNotifs, setPushNotifs] = useState(true);
  const [locationPerms, setLocationPerms] = useState(true);
  const [biometrics, setBiometrics] = useState(false);
  const [promos, setPromos] = useState(true);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>App Preferences</Text>
        <View style={styles.cardContainer}>
          <SettingToggle
            label="Push Notifications"
            sublabel="Get updates about your plumbing repairs and delivery orders"
            active={pushNotifs}
            onToggle={() => setPushNotifs(!pushNotifs)}
          />
          <View style={styles.divider} />
          <SettingToggle
            label="Location Permissions"
            sublabel="Allow plumber tracking and nearby store discovery"
            active={locationPerms}
            onToggle={() => setLocationPerms(!locationPerms)}
          />
          <View style={styles.divider} />
          <SettingToggle
            label="Biometric Verification"
            sublabel="Require Face ID / Touch ID when booking plumbers"
            active={biometrics}
            onToggle={() => setBiometrics(!biometrics)}
          />
          <View style={styles.divider} />
          <SettingToggle
            label="Promotions & Offers"
            sublabel="Receive coupons, flash sales, and discount codes"
            active={promos}
            onToggle={() => setPromos(!promos)}
          />
        </View>

        <Text style={[styles.sectionTitle, { marginTop: spacing.lg }]}>About PlumbCommerce</Text>
        <View style={styles.cardContainer}>
          <TouchableOpacity style={styles.infoRow} onPress={() => alert('Opening Terms of Service...')}>
            <Text style={styles.infoLabel}>Terms of Service</Text>
            <Text style={styles.infoValue}>→</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.infoRow} onPress={() => alert('Opening Privacy Policy...')}>
            <Text style={styles.infoLabel}>Privacy Policy</Text>
            <Text style={styles.infoValue}>→</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>App Version</Text>
            <Text style={styles.versionValue}>1.0.0 (Build 42)</Text>
          </View>
        </View>

        <Text style={styles.footerBrand}>PlumbCommerce © 2026</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.layout,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  backButtonText: {
    fontSize: 22,
    color: colors.textPrimary,
    fontWeight: 'bold',
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  scrollContent: {
    padding: spacing.layout,
    paddingBottom: spacing.huge,
  },
  sectionTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardContainer: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
  },
  textColumn: {
    flex: 1,
    marginRight: spacing.md,
  },
  toggleLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  toggleSublabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
    marginTop: 2,
    lineHeight: 16,
  },
  switchOuter: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.borderDark,
    padding: 2,
    justifyContent: 'center',
  },
  switchOuterActive: {
    backgroundColor: colors.primary,
  },
  switchInner: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.surface,
    transform: [{ translateX: 0 }],
  },
  switchInnerActive: {
    transform: [{ translateX: 22 }],
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
  },
  infoLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  infoValue: {
    fontSize: typography.fontSize.md,
    color: colors.textMuted,
    fontWeight: 'bold',
  },
  versionValue: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.textSecondary,
  },
  footerBrand: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    marginTop: spacing.huge,
  },
});
