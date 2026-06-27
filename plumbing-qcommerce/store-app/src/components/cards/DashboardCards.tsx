import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, borderRadius, spacing, typography, shadows } from '../../theme';

// ==========================================
// REVENUE CARD
// ==========================================
interface RevenueCardProps {
  amount: number;
  percentageChange: number;
}

export const RevenueCard: React.FC<RevenueCardProps> = ({ amount, percentageChange }) => {
  return (
    <View style={styles.revenueCard}>
      <Text style={styles.revenueTitle}>Today's Revenue</Text>
      <View style={styles.amountContainer}>
        <Text style={styles.revenueAmount}>₹{amount.toLocaleString('en-IN')}</Text>
        {/* Simple inline visual sparkline line representation */}
        <View style={styles.sparklineContainer}>
          <View style={[styles.sparkLine, { width: 40, transform: [{ rotate: '-10deg' }] }]} />
        </View>
      </View>
      <Text style={styles.revenueTrend}>
        {percentageChange >= 0 ? '▲' : '▼'} {Math.abs(percentageChange)}% from yesterday
      </Text>
    </View>
  );
};

// ==========================================
// ORDER SUMMARY CARD
// ==========================================
interface OrderSummaryCardProps {
  label: string;
  count: number;
  color: string;
  emoji: string;
  onPress: () => void;
}

export const OrderSummaryCard: React.FC<OrderSummaryCardProps> = ({
  label,
  count,
  color,
  emoji,
  onPress,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      style={styles.summaryCard}
      onPress={onPress}
    >
      <View style={[styles.iconBox, { backgroundColor: `${color}15` }]}>
        <Text style={styles.boxEmoji}>{emoji}</Text>
      </View>
      <View style={styles.cardDetails}>
        <Text style={styles.summaryCount}>{count}</Text>
        <Text style={styles.summaryLabel}>{label}</Text>
      </View>
    </TouchableOpacity>
  );
};

// ==========================================
// QUICK ACTION CARD
// ==========================================
interface QuickActionCardProps {
  label: string;
  emoji: string;
  onPress: () => void;
}

export const QuickActionCard: React.FC<QuickActionCardProps> = ({
  label,
  emoji,
  onPress,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      style={styles.actionCard}
      onPress={onPress}
    >
      <Text style={styles.actionEmoji}>{emoji}</Text>
      <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  revenueCard: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    ...shadows.md,
    marginBottom: spacing.md,
  },
  revenueTitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    textTransform: 'uppercase',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: spacing.xs,
  },
  revenueAmount: {
    color: colors.card,
    fontSize: typography.fontSize.heading,
    fontWeight: typography.fontWeight.black,
  },
  sparklineContainer: {
    height: 24,
    justifyContent: 'center',
    paddingRight: spacing.sm,
  },
  sparkLine: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 2,
  },
  revenueTrend: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
  summaryCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginHorizontal: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  boxEmoji: {
    fontSize: 18,
  },
  cardDetails: {
    justifyContent: 'center',
  },
  summaryCount: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  summaryLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  actionCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginHorizontal: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
    height: 84,
  },
  actionEmoji: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  actionLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    textAlign: 'center',
  },
});
