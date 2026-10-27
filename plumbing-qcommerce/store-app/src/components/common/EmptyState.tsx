import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../../theme';
import { StoreIcon, StoreIconName } from './StoreIcon';

interface EmptyStateProps {
  iconName?: StoreIconName;
  title: string;
  description: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  iconName = 'empty-state',
  title,
  description,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <StoreIcon name={iconName} size={48} color={colors.textMuted} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.huge,
  },
  iconContainer: {
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  description: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

export default EmptyState;
