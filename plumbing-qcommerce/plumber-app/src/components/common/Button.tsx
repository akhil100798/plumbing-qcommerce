import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { colors, typography, borderRadius, spacing } from '../../theme';

interface ButtonProps {
  label?: string;
  title?: string;
  onPress?: () => void;
  variant?: 'primary' | 'outline' | 'danger' | 'success';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  label,
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  textStyle,
}: ButtonProps) {
  const displayLabel = label || title || '';
  const isOutline = variant === 'outline';
  const isDanger = variant === 'danger';
  const isSuccess = variant === 'success';

  let bg = colors.primary;
  if (disabled) {
    bg = colors.border;
  } else if (isOutline) {
    bg = 'transparent';
  } else if (isDanger) {
    bg = colors.errorLight;
  } else if (isSuccess) {
    bg = colors.success;
  }

  let textColor = colors.surface;
  if (disabled) {
    textColor = colors.textMuted;
  } else if (isOutline) {
    textColor = colors.textSecondary;
  } else if (isDanger) {
    textColor = colors.error;
  } else if (isSuccess) {
    textColor = '#FFFFFF';
  }

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={disabled || loading}
      onPress={onPress}
      style={[
        styles.base,
        { backgroundColor: bg },
        isOutline && styles.outlineBorder,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={[styles.label, { color: textColor }, textStyle]}>{displayLabel}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineBorder: {
    borderWidth: 1,
    borderColor: colors.borderDark,
  },
  label: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
  },
});
