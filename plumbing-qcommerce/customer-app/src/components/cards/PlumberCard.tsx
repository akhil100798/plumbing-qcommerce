import React from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { borderRadius, colors, shadows, spacing, typography } from '../../theme';
import { SvgStatusStarFilled } from '../../assets/svg';

interface PlumberCardProps {
  name: string;
  rating: number;
  jobsCount: number;
  eta: string;
  avatarText?: string;
}

export function PlumberCard({
  name,
  rating,
  jobsCount,
  eta,
  avatarText = 'P',
}: PlumberCardProps) {
  return (
    <View style={styles.container}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{avatarText}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.sub}>Verified Professional • {eta}</Text>
        <View style={styles.ratingRow}>
          <SvgStatusStarFilled width={14} height={14} fill="#F59E0B" stroke="#F59E0B" style={{ marginRight: 4 }} />
          <Text style={styles.ratingText}>
            {rating} <Text style={styles.jobs}>({jobsCount} jobs)</Text>
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    ...shadows.sm,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.warningLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.warning,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  sub: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
    marginTop: 2,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  star: {
    fontSize: 12,
    marginRight: 2,
  },
  ratingText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  jobs: {
    color: colors.textMuted,
    fontWeight: typography.fontWeight.medium,
  },
});
