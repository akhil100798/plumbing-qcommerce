import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { borderRadius, colors, spacing, typography } from '../../theme';

interface OfferCardProps {
  code: string;
  discountText: string;
  description: string;
  expiryText: string;
  onApply?: () => void;
  onCopy?: () => void;
}

export function OfferCard({
  code,
  discountText,
  description,
  expiryText,
  onApply,
  onCopy,
}: OfferCardProps) {
  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{discountText}</Text>
        </View>
        <View style={styles.details}>
          <Text style={styles.description}>{description}</Text>
          <Text style={styles.expiry}>{expiryText}</Text>
          <View style={styles.couponCodeRow}>
            <Text style={styles.codeLabel}>Use Code: </Text>
            <Text style={styles.codeText}>{code}</Text>
          </View>
        </View>
      </View>
      <View style={styles.right}>
        {onApply ? (
          <TouchableOpacity style={styles.actionBtn} onPress={onApply}>
            <Text style={styles.actionBtnText}>APPLY</Text>
          </TouchableOpacity>
        ) : onCopy ? (
          <TouchableOpacity style={[styles.actionBtn, styles.copyBtn]} onPress={onCopy}>
            <Text style={[styles.actionBtnText, styles.copyBtnText]}>COPY</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  left: {
    flex: 1,
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.md,
  },
  badge: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.successLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.success,
  },
  badgeText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.black,
    color: colors.success,
    textAlign: 'center',
  },
  details: {
    flex: 1,
    justifyContent: 'center',
  },
  description: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    lineHeight: 18,
  },
  expiry: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
    fontWeight: typography.fontWeight.bold,
  },
  couponCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  codeLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },
  codeText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: typography.fontWeight.black,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.xs,
  },
  right: {
    borderLeftWidth: 1.5,
    borderLeftColor: colors.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    width: 90,
  },
  actionBtn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
    width: '100%',
    alignItems: 'center',
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: typography.fontWeight.black,
    color: colors.surface,
  },
  copyBtn: {
    backgroundColor: colors.background,
    borderWidth: 1.5,
    borderColor: colors.borderDark,
  },
  copyBtnText: {
    color: colors.textSecondary,
  },
});
