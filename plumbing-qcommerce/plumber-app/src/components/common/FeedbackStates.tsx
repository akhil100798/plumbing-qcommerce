import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { colors, spacing, typography } from '../../theme';
import { PrimaryButton } from './PrimaryButton';

// 1. LoadingState Component
interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = 'Loading...' }: LoadingStateProps) {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.loadingText}>{message}</Text>
    </View>
  );
}

// 2. EmptyState Component
interface EmptyStateProps {
  title: string;
  description: string;
  icon?: string;
  actionTitle?: string;
  onActionPress?: () => void;
}

export function EmptyState({
  title,
  description,
  icon = '📭',
  actionTitle,
  onActionPress,
}: EmptyStateProps) {
  return (
    <View style={styles.center}>
      <Text style={styles.iconText}>{icon}</Text>
      <Text style={styles.titleText}>{title}</Text>
      <Text style={styles.descriptionText}>{description}</Text>
      {actionTitle && onActionPress && (
        <PrimaryButton
          title={actionTitle}
          onPress={onActionPress}
          style={styles.actionButton}
        />
      )}
    </View>
  );
}

// 3. ErrorState Component
interface ErrorStateProps {
  message: string;
  retryTitle?: string;
  onRetry?: () => void;
}

export function ErrorState({
  message,
  retryTitle = 'Try Again',
  onRetry,
}: ErrorStateProps) {
  return (
    <View style={styles.center}>
      <Text style={styles.errorIconText}>⚠️</Text>
      <Text style={styles.titleText}>Something Went Wrong</Text>
      <Text style={styles.errorDescriptionText}>{message}</Text>
      {onRetry && (
        <PrimaryButton
          title={retryTitle}
          onPress={onRetry}
          style={styles.actionButton}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },
  iconText: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  errorIconText: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  titleText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  descriptionText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.xl,
  },
  errorDescriptionText: {
    fontSize: typography.fontSize.sm,
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.xl,
  },
  actionButton: {
    minWidth: 160,
  },
});
