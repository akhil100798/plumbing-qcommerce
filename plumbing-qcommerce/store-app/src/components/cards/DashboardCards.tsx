import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SvgProps } from 'react-native-svg';
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
  icon: React.FC<SvgProps>;
  onPress: () => void;
}

export const OrderSummaryCard: React.FC<OrderSummaryCardProps> = ({
  label,
  count,
  color,
  icon: IconComponent,
  onPress,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      style={styles.summaryCard}
      onPress={onPress}
    >
      <View style={[styles.iconBox, { backgroundColor: `${color}15` }]}>
        <IconComponent width={20} height={20} stroke={color} />
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
  icon: React.FC<SvgProps>;
  onPress: () => void;
}

export const QuickActionCard: React.FC<QuickActionCardProps> = ({
  label,
  icon: IconComponent,
  onPress,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      style={styles.actionCard}
      onPress={onPress}
    >
      <View style={styles.actionIconWrapper}>
        <IconComponent width={24} height={24} stroke={colors.primary} />
      </View>
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
    height: 94,
  },
  actionIconWrapper: {
    marginBottom: spacing.xs,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${colors.primary}12`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    textAlign: 'center',
  },
});
