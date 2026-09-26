import React from 'react';
import {
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';

import { borderRadius, colors, shadows, spacing, typography } from '../../theme';

interface WalletCardProps {
  balance: number;
  onAddMoney: () => void;
  style?: StyleProp<ViewStyle>;
}

export function WalletCard({ balance, onAddMoney, style }: WalletCardProps) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.topRow}>
        <View>
          <Text style={styles.cardTitle}>PlumbCommerce Wallet</Text>
          <Text style={styles.cardStatus}>Active • Instant Refunds Enabled</Text>
        </View>
        <Text style={styles.cardLogo}>💼</Text>
      </View>

      <View style={styles.middleRow}>
        <Text style={styles.balanceLabel}>Available Balance</Text>
        <Text style={styles.balanceValue}>₹{balance}</Text>
      </View>

      <View style={styles.bottomRow}>
        <Text style={styles.cardSubText}>Fast Checkout & Easy Returns</Text>
        <TouchableOpacity style={styles.addBtn} onPress={onAddMoney} activeOpacity={0.8}>
          <Text style={styles.addBtnText}>+ Add Money</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.md,
    position: 'relative',
    overflow: 'hidden',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  cardTitle: {
    color: colors.surface,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  },
  cardStatus: {
    color: colors.primaryLight,
    fontSize: 10,
    fontWeight: typography.fontWeight.medium,
    marginTop: 2,
  },
  cardLogo: {
    fontSize: 28,
    opacity: 0.9,
  },
  middleRow: {
    marginBottom: spacing.xl,
  },
  balanceLabel: {
    color: colors.primaryLight,
    fontSize: 11,
    fontWeight: typography.fontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  balanceValue: {
    color: colors.surface,
    fontSize: 32,
    fontWeight: typography.fontWeight.black,
    marginTop: spacing.xs,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardSubText: {
    color: colors.primaryLight,
    fontSize: 10,
    fontWeight: typography.fontWeight.medium,
  },
  addBtn: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  addBtnText: {
    color: colors.primary,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
});
