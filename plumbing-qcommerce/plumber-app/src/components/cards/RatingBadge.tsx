import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  StyleProp,
  ViewStyle,
} from 'react-native';

import { borderRadius, colors, spacing, typography } from '../../theme';

interface RatingBadgeProps {
  rating: number;
  count?: number;
  style?: StyleProp<ViewStyle>;
}

export function RatingBadge({
  rating,
  count,
  style,
}: RatingBadgeProps) {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.star}>⭐</Text>
      <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
      {count !== undefined && (
        <Text style={styles.countText}>({count})</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warningLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: borderRadius.sm,
  },
  star: {
    fontSize: 12,
    marginRight: 4,
  },
  ratingText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.warning,
  },
  countText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginLeft: 4,
  },
});
