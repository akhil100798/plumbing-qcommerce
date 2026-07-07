import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  ViewStyle,
} from 'react-native';
import { colors, borderRadius, spacing, typography } from '../../theme';

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  loading?: boolean;
  disabled?: boolean;
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  title,
  onPress,
  style,
  loading = false,
  disabled = false,
}) => {
  const isButtonDisabled = disabled || loading;
  
  return (
    <Pressable
      onPress={onPress}
      disabled={isButtonDisabled}
      style={({ pressed }) => [
        styles.button,
        style,
        isButtonDisabled && styles.disabledButton,
        pressed && !isButtonDisabled && styles.pressedButton,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={colors.card} />
      ) : (
        <Text style={styles.text}>{title}</Text>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.primary,
    height: 48,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  disabledButton: {
    backgroundColor: colors.textMuted,
  },
  pressedButton: {
    opacity: 0.9,
  },
  text: {
    color: colors.card,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
  },
});
