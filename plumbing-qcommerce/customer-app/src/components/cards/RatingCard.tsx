import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { borderRadius, colors, shadows, spacing, typography } from '../../theme';

interface RatingCardProps {
  rating: number;
  onRatingChange: (val: number) => void;
  selectedTip: number;
  onTipChange: (val: number) => void;
}

const tips = [20, 50, 100];

export function RatingCard({
  rating,
  onRatingChange,
  selectedTip,
  onTipChange,
}: RatingCardProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>How was your experience?</Text>
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((val) => (
          <TouchableOpacity key={val} onPress={() => onRatingChange(val)}>
            <Text style={[styles.starEmoji, rating >= val ? styles.starFilled : styles.starEmpty]}>
              ⭐
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.tipTitle}>Add a tip for your plumber</Text>
      <View style={styles.tipsRow}>
        {tips.map((amount) => {
          const selected = selectedTip === amount;
          return (
            <TouchableOpacity
              key={amount}
              style={[styles.tipChip, selected && styles.tipChipSelected]}
              onPress={() => onTipChange(amount)}
            >
              <Text style={[styles.tipChipText, selected && styles.tipChipTextSelected]}>
                ₹{amount}
              </Text>
            </TouchableOpacity>
          );
        })}
        <TouchableOpacity
          style={[styles.tipChip, selectedTip > 0 && !tips.includes(selectedTip) && styles.tipChipSelected]}
          onPress={() => onTipChange(150)} // Mock other tipping options
        >
          <Text style={[styles.tipChipText, selectedTip > 0 && !tips.includes(selectedTip) && styles.tipChipTextSelected]}>
            Other
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surfaceContainerLowest || '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border || '#C1C6D6',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    ...shadows.sm,
  },
  title: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.heading,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  starsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  starEmoji: {
    fontSize: 32,
  },
  starFilled: {
    opacity: 1,
  },
  starEmpty: {
    opacity: 0.25,
  },
  tipTitle: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.body,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    letterSpacing: 0.5,
  },
  tipsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    width: '100%',
  },
  tipChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border || '#C1C6D6',
    backgroundColor: colors.surfaceContainerLowest || '#FFFFFF',
    minWidth: 64,
    alignItems: 'center',
  },
  tipChipSelected: {
    borderColor: colors.primaryContainer || colors.primary,
    backgroundColor: colors.surfaceContainerLow || '#EFF4FF',
  },
  tipChipText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.body,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
  },
  tipChipTextSelected: {
    color: colors.primaryContainer || colors.primary,
    fontWeight: typography.fontWeight.bold,
  },
});
