import React from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { borderRadius, colors, shadows, spacing, typography } from '../../theme';

interface EarningsCardProps {
  todayEarnings: number;
  serviceCommission: number;
  materialCommission: number;
  tips: number;
  jobsCompleted: number;
}

export function EarningsCard({
  todayEarnings,
  serviceCommission,
  materialCommission,
  tips,
  jobsCompleted,
}: EarningsCardProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Today's Earnings</Text>
      <Text style={styles.amount}>₹{todayEarnings.toLocaleString()}</Text>
      
      <View style={styles.divider} />

      <View style={styles.statsGrid}>
        <View style={styles.statRow}>
          <Text style={styles.label}>Service Earnings</Text>
          <Text style={styles.value}>₹{serviceCommission}</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.label}>Material Commission</Text>
          <Text style={styles.value}>₹{materialCommission}</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.label}>Tips</Text>
          <Text style={styles.value}>₹{tips}</Text>
        </View>
        <View style={[styles.statRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Jobs Completed</Text>
          <Text style={styles.totalValue}>{jobsCompleted}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.bold,
    textTransform: 'uppercase',
  },
  amount: {
    fontSize: 32,
    fontWeight: typography.fontWeight.black,
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  statsGrid: {
    gap: spacing.sm,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },
  value: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  totalRow: {
    marginTop: spacing.xs,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  totalLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.bold,
  },
  totalValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
});
