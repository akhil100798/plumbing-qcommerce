import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, spacing, typography } from '../../theme';

interface StitchBadgeProps {
  label: string;
  variant?: 'success' | 'verified' | 'primary' | 'warning' | 'neutral';
  style?: ViewStyle;
}

export function StitchBadge({
  label,
  variant = 'success',
  style,
}: StitchBadgeProps) {
  const getBadgeStyle = () => {
    switch (variant) {
      case 'primary':
        return { container: styles.primaryContainer, text: styles.primaryText };
      case 'warning':
        return { container: styles.warningContainer, text: styles.warningText };
      case 'neutral':
        return { container: styles.neutralContainer, text: styles.neutralText };
      case 'verified':
      case 'success':
      default:
        return { container: styles.successContainer, text: styles.successText };
    }
  };

  const { container, text } = getBadgeStyle();

  return (
    <View style={[styles.baseBadge, container, style]}>
      <Text style={[styles.baseText, text]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  baseBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: 9999,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
  },
  baseText: {
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 0.2,
  },
  successContainer: {
    backgroundColor: '#DCFCE7', // emerald-100
  },
  successText: {
    color: '#066445', // emerald-800
  },
  primaryContainer: {
    backgroundColor: '#DBEAFE', // blue-100
  },
  primaryText: {
    color: '#1D4ED8', // blue-700
  },
  warningContainer: {
    backgroundColor: '#FEF3C7', // amber-100
  },
  warningText: {
    color: '#B45309', // amber-700
  },
  neutralContainer: {
    backgroundColor: '#F1F5F9', // slate-100
  },
  neutralText: {
    color: '#475569', // slate-600
  },
});
