import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { colors, borderRadius, spacing, typography } from '../../theme';

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  style?: ViewStyle;
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
    <TouchableOpacity
      activeOpacity={0.8}
      style={[
        styles.button,
        style,
        isButtonDisabled && styles.disabledButton,
      ]}
      onPress={onPress}
      disabled={isButtonDisabled}
    >
      {loading ? (
        <ActivityIndicator size="small" color={colors.card} />
      ) : (
        <Text style={styles.text}>{title}</Text>
      )}
    </TouchableOpacity>
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
  text: {
    color: colors.card,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
  },
});
