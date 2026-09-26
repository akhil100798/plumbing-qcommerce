import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { borderRadius, colors, spacing, typography } from '../../theme';
import { PrimaryButton } from './PrimaryButton';

interface EmptyStateCardProps {
  illustration: React.ReactNode;
  title: string;
  subtitle: string;
  actionText?: string;
  onActionPress?: () => void;
  style?: any;
}

export function EmptyStateCard({
  illustration,
  title,
  subtitle,
  actionText,
  onActionPress,
  style,
}: EmptyStateCardProps) {
  // Use surface or card depending on app theme config
  const backgroundColor = (colors as any).surface || (colors as any).card || '#FFFFFF';

  return (
    <View style={[styles.container, { backgroundColor }, style]}>
      <View style={styles.illustrationContainer}>{illustration}</View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      {actionText && onActionPress && (
        <PrimaryButton
          title={actionText}
          onPress={onActionPress}
          style={styles.actionBtn}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.md,
  },
  illustrationContainer: {
    width: 140,
    height: 100,
    marginBottom: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 18,
  },
  actionBtn: {
    minWidth: 150,
  },
});
