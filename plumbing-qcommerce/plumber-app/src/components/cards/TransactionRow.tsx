import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import CheckIcon from '../../assets/icons/success-check.svg';
import RupeeIcon from '../../assets/icons/rupee.svg';
import MaterialIcon from '../../assets/icons/material-request.svg';
import WithdrawIcon from '../../assets/icons/withdraw.svg';
import { colors, typography, spacing, borderRadius } from '../../theme';

export type TransactionType = 'payment' | 'incentive' | 'advance' | 'withdrawal';

interface TransactionRowProps {
  type: TransactionType;
  title: string;
  subtitle: string;
  amount: number;
  isCredit: boolean;
}

export function TransactionRow({ type, title, subtitle, amount, isCredit }: TransactionRowProps) {
  const isPayment = type === 'payment';
  const isIncentive = type === 'incentive';
  const isAdvance = type === 'advance';

  let bg = colors.successLight;
  let fg = colors.success;

  if (isIncentive) {
    bg = colors.primaryLight;
    fg = colors.primary;
  } else if (isAdvance || type === 'withdrawal') {
    bg = colors.errorLight;
    fg = colors.error;
  }

  return (
    <View style={styles.row}>
      <View style={[styles.iconWrap, { backgroundColor: bg }]}>
        {isPayment ? (
          <CheckIcon width={16} height={16} stroke={fg} />
        ) : isIncentive ? (
          <RupeeIcon width={16} height={16} stroke={fg} />
        ) : isAdvance ? (
          <MaterialIcon width={16} height={16} stroke={fg} />
        ) : (
          <WithdrawIcon width={16} height={16} stroke={fg} />
        )}
      </View>
      <View style={styles.textCol}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      <Text style={[styles.amount, isCredit ? styles.credit : styles.debit]}>
        {isCredit ? '+' : '-'}₹{Math.abs(amount).toLocaleString('en-IN')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  textCol: { flex: 1 },
  title: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  amount: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  },
  credit: { color: colors.success },
  debit: { color: colors.error },
});
