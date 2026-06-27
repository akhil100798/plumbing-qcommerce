import React from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  ViewStyle,
} from 'react-native';

import { borderRadius, colors, spacing, typography } from '../../theme';

interface SecondaryButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  outlineColor?: string;
  textColor?: string;
  style?: StyleProp<ViewStyle>;
}

export function SecondaryButton({
  title,
  onPress,
  disabled = false,
  outlineColor = colors.primary,
  textColor = colors.primary,
  style,
}: SecondaryButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        { borderColor: outlineColor },
        style,
        disabled && styles.disabledButton,
        pressed && !disabled && { backgroundColor: colors.primaryLight },
      ]}
    >
      <Text style={[styles.text, { color: textColor }]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderWidth: 1.5,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    minWidth: 132,
    backgroundColor: 'transparent',
  },
  disabledButton: {
    opacity: 0.5,
  },
  text: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
  },
});
