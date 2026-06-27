import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  ViewStyle,
  TextStyle,
} from 'react-native';

import { borderRadius, colors, spacing, typography } from '../../theme';

interface SecondaryButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export function SecondaryButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  style,
  textStyle,
}: SecondaryButtonProps) {
  const isInteractionDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isInteractionDisabled}
      style={({ pressed }) => [
        styles.button,
        style,
        isInteractionDisabled && styles.disabledButton,
        pressed && !isInteractionDisabled && styles.pressedButton,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.primary} size="small" />
      ) : (
        <Text style={[styles.text, textStyle]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: 'transparent',
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    borderColor: colors.borderDark,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    minWidth: 132,
  },
  disabledButton: {
    opacity: 0.5,
  },
  pressedButton: {
    backgroundColor: colors.background,
    borderColor: colors.borderDark,
  },
  text: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
  },
});
