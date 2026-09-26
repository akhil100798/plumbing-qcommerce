import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { borderRadius, colors, spacing, typography } from '../../theme';

interface OrderCardProps {
  orderId: string;
  status: 'PENDING' | 'ACCEPTED' | 'IN_PROGRESS' | 'DELIVERED' | 'COMPLETED' | 'PAID' | 'CANCELLED' | string;
  price: number;
  date: string;
  type: 'product' | 'service';
  title: string;
  onPress: () => void;
}

export function OrderCard({
  orderId,
  status,
  price,
  date,
  type,
  title,
  onPress,
}: OrderCardProps) {
  const getStatusColor = (val: string) => {
    switch (val.toUpperCase()) {
      case 'DELIVERED':
      case 'COMPLETED':
      case 'PAID':
        return { bg: colors.successLight, text: colors.success };
      case 'PENDING':
      case 'ACCEPTED':
      case 'IN_PROGRESS':
        return { bg: colors.warningLight, text: colors.warning };
      case 'CANCELLED':
        return { bg: colors.errorLight, text: colors.error };
      default:
        return { bg: colors.background, text: colors.textSecondary };
    }
  };

  const statusColors = getStatusColor(status);

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.typeIcon}>{type === 'product' ? '📦' : '🔧'}</Text>
          <View>
            <Text style={styles.orderId}>{orderId}</Text>
            <Text style={styles.date}>{date}</Text>
          </View>
        </View>
        <View style={[styles.statusPill, { backgroundColor: statusColors.bg }]}>
          <Text style={[styles.statusText, { color: statusColors.text }]}>
            {status}
          </Text>
        </View>
      </View>

      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.price}>₹{price}</Text>
      </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.sm,
    marginBottom: spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  typeIcon: {
    fontSize: 20,
  },
  orderId: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  date: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
    fontWeight: typography.fontWeight.medium,
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  statusText: {
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
    textTransform: 'uppercase',
  },
  body: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    flex: 1,
    marginRight: spacing.md,
  },
  price: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.black,
    color: colors.primary,
  },
});
