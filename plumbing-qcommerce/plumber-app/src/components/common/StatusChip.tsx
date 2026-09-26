import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  StyleProp,
  ViewStyle,
} from 'react-native';

import { borderRadius, colors, spacing, typography } from '../../theme';

type StatusType = 'success' | 'warning' | 'error' | 'primary' | 'muted';

interface StatusChipProps {
  label: string;
  type?: StatusType;
  style?: StyleProp<ViewStyle>;
}

export function StatusChip({
  label,
  type = 'primary',
  style,
}: StatusChipProps) {
  const getColors = () => {
    switch (type) {
      case 'success':
        return { bg: colors.successLight, text: colors.success };
      case 'warning':
        return { bg: colors.warningLight, text: colors.warning };
      case 'error':
        return { bg: colors.errorLight, text: colors.error };
      case 'muted':
        return { bg: colors.background, text: colors.textSecondary };
      case 'primary':
      default:
        return { bg: colors.primaryLight, text: colors.primary };
    }
  };

  const statusColors = getColors();

  return (
    <View style={[styles.chip, { backgroundColor: statusColors.bg }, style]}>
      <Text style={[styles.text, { color: statusColors.text }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    textTransform: 'uppercase',
  },
});
