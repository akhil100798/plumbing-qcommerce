import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from 'react-native';

import { borderRadius, colors, shadows, spacing, typography } from '../../theme';
import { RatingBadge } from './RatingBadge';

interface CustomerCardProps {
  name: string;
  rating: number;
  phone?: string;
  onCallPress?: () => void;
  onChatPress?: () => void;
  showActions?: boolean;
}

export function CustomerCard({
  name,
  rating,
  phone,
  onCallPress,
  onChatPress,
  showActions = true,
}: CustomerCardProps) {
  // Generate initials for profile preview
  const getInitials = (fullName: string) => {
    return fullName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <View style={styles.container}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{getInitials(name)}</Text>
      </View>

      <View style={styles.info}>
        <Text style={styles.name}>{name}</Text>
        <RatingBadge rating={rating} style={styles.badge} />
      </View>

      {showActions && (
        <View style={styles.actions}>
          <TouchableOpacity style={styles.iconButton} onPress={onCallPress}>
            <Text style={styles.icon}>📞</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={onChatPress}>
            <Text style={styles.icon}>💬</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    color: colors.primary,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
  },
  info: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs / 2,
  },
  badge: {
    alignSelf: 'flex-start',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.2,
    borderColor: colors.border,
  },
  icon: {
    fontSize: 16,
  },
});
