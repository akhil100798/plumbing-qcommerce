import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from 'react-native';

import { borderRadius, colors, shadows, spacing, typography } from '../../theme';

interface WalletCardProps {
  balance: number;
  onWithdrawPress: () => void;
}

export function WalletCard({
  balance,
  onWithdrawPress,
}: WalletCardProps) {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.label}>Available Balance</Text>
        <Text style={styles.balance}>₹{balance.toLocaleString()}</Text>
      </View>
      
      <TouchableOpacity style={styles.button} onPress={onWithdrawPress}>
        <Text style={styles.buttonText}>Withdraw</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shadows.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  content: {
    flex: 1,
  },
  label: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.bold,
    textTransform: 'uppercase',
  },
  balance: {
    fontSize: 26,
    fontWeight: typography.fontWeight.black,
    color: colors.textPrimary,
    marginTop: 4,
  },
  button: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  buttonText: {
    color: colors.surface,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  },
});
