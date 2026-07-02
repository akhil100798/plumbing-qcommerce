import React from 'react';
import { StyleSheet, Text, TouchableOpacity, ViewStyle, StyleProp } from 'react-native';
import { colors, borderRadius, spacing, typography } from '../../theme';

interface SecondaryButtonProps {
  title: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

export const SecondaryButton: React.FC<SecondaryButtonProps> = ({
  title,
  onPress,
  style,
  disabled = false,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      style={[
        styles.button,
        style,
        disabled && styles.disabledButton,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={[styles.text, disabled && styles.disabledText]}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.card,
    height: 48,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  disabledButton: {
    borderColor: colors.border,
  },
  text: {
    color: colors.primary,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
  },
  disabledText: {
    color: colors.textMuted,
  },
});
