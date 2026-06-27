import React from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { borderRadius, colors, spacing, typography } from '../../theme';
import { StatusChip } from '../common/StatusChip';
import { RatingBadge } from './RatingBadge';

interface JobHistoryCardProps {
  jobId: string;
  customerName: string;
  dateTime: string;
  status: 'Completed' | 'Cancelled';
  rating?: number;
  amount: number;
}

export function JobHistoryCard({
  jobId,
  customerName,
  dateTime,
  status,
  rating,
  amount,
}: JobHistoryCardProps) {
  const isCompleted = status === 'Completed';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.jobId}>Job #{jobId}</Text>
        <Text style={styles.amount}>₹{amount}</Text>
      </View>

      <Text style={styles.customerName}>{customerName}</Text>
      <Text style={styles.dateTime}>{dateTime}</Text>

      <View style={styles.divider} />

      <View style={styles.footer}>
        <StatusChip
          label={status}
          type={isCompleted ? 'success' : 'error'}
        />
        {isCompleted && rating !== undefined ? (
          <RatingBadge rating={rating} />
        ) : (
          <Text style={styles.noRatingText}>Rating: —</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  jobId: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  amount: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  customerName: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  dateTime: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: spacing.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  noRatingText: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
    fontWeight: typography.fontWeight.medium,
  },
});
