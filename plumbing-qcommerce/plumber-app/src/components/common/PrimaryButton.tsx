import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  ViewStyle,
} from 'react-native';

import { borderRadius, colors, shadows, spacing, typography } from '../../theme';

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function PrimaryButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  style,
}: PrimaryButtonProps) {
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
        <ActivityIndicator color={colors.surface} size="small" />
      ) : (
        <Text style={styles.text}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    minWidth: 132,
    ...shadows.sm,
  },
  disabledButton: {
    opacity: 0.5,
  },
  pressedButton: {
    backgroundColor: colors.primaryDark,
  },
  text: {
    color: colors.surface,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
  },
});
