import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, borderRadius, spacing, typography } from '../../theme';

interface StatusChipProps {
  status: string;
  style?: ViewStyle;
}

export const StatusChip: React.FC<StatusChipProps> = ({ status, style }) => {
  const getStatusColors = (val: string) => {
    const text = val.toUpperCase();
    if (text === 'DELIVERED' || text === 'READY' || text === 'COMPLETED' || text === 'IN_STOCK' || text === 'READY_FOR_PICKUP') {
      return {
        bg: colors.successLight,
        fg: colors.success,
      };
    }
    if (text === 'PENDING' || text === 'CONFIRMED' || text === 'PACKING' || text === 'PREPARING') {
      return {
        bg: colors.warningLight,
        fg: colors.warning,
      };
    }
    if (text === 'CANCELLED' || text === 'LOW_STOCK' || text === 'LOW STOCK') {
      return {
        bg: colors.dangerLight,
        fg: colors.danger,
      };
    }
    return {
      bg: colors.border,
      fg: colors.textSecondary,
    };
  };

  const formattedStatus = status.replace(/_/g, ' ');
  const colorsConfig = getStatusColors(status);

  return (
    <View style={[styles.chip, { backgroundColor: colorsConfig.bg }, style]}>
      <Text style={[styles.text, { color: colorsConfig.fg }]}>
        {formattedStatus}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.xs,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
});
