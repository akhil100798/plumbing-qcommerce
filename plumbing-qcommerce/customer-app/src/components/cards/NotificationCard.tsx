import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { borderRadius, colors, spacing, typography } from '../../theme';

interface NotificationCardProps {
  id: string;
  title: string;
  body: string;
  time: string;
  unread: boolean;
  onPress: () => void;
}

export function NotificationCard({
  title,
  body,
  time,
  unread,
  onPress,
}: NotificationCardProps) {
  return (
    <TouchableOpacity
      style={[styles.container, unread ? styles.containerUnread : {}]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.topRow}>
        <View style={styles.titleWrapper}>
          {unread && <View style={styles.unreadDot} />}
          <Text style={[styles.title, unread ? styles.titleUnread : {}]}>{title}</Text>
        </View>
        <Text style={styles.time}>{time}</Text>
      </View>
      <Text style={styles.body}>{body}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  containerUnread: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  titleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
    marginRight: spacing.md,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  title: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  titleUnread: {
    color: colors.primary,
  },
  time: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: typography.fontWeight.bold,
  },
  body: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
    lineHeight: 16,
  },
});
