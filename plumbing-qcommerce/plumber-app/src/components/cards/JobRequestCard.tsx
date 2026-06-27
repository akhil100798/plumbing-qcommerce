import React from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { borderRadius, colors, shadows, spacing, typography } from '../../theme';
import { StatusChip } from '../common/StatusChip';

interface JobRequestCardProps {
  issueDescription: string;
  category: string;
  address: string;
  distance: number;
  earnings: number;
  timeRemaining?: number;
}

export function JobRequestCard({
  issueDescription,
  category,
  address,
  distance,
  earnings,
  timeRemaining,
}: JobRequestCardProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <StatusChip label={category} type="primary" />
        {timeRemaining !== undefined && (
          <View style={styles.timerBadge}>
            <Text style={styles.timerText}>⏳ {timeRemaining}s remaining</Text>
          </View>
        )}
      </View>

      <Text style={styles.title}>{issueDescription}</Text>
      
      <View style={styles.metaRow}>
        <Text style={styles.metaIcon}>📍</Text>
        <Text style={styles.metaText} numberOfLines={2}>
          {address}
        </Text>
      </View>
      
      <View style={styles.metaRow}>
        <Text style={styles.metaIcon}>🛣️</Text>
        <Text style={styles.metaText}>
          {distance.toFixed(1)} km away
        </Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.footer}>
        <Text style={styles.earningsLabel}>You will earn</Text>
        <Text style={styles.earningsValue}>₹{earnings}</Text>
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
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  timerBadge: {
    backgroundColor: colors.errorLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: borderRadius.sm,
  },
  timerText: {
    color: colors.error,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.black,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  metaIcon: {
    fontSize: 16,
    marginRight: spacing.sm,
  },
  metaText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: typography.lineHeight.tight,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  earningsLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },
  earningsValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.black,
    color: colors.primary,
  },
});
