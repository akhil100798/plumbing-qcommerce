import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { colors, spacing, typography, borderRadius } from '../../theme';
import PlusIcon from '../../assets/icons/plus.svg';
import MinusIcon from '../../assets/icons/minus.svg';

interface MaterialRowProps {
  id: string | number;
  name: string;
  category?: string;
  price: number;
  unit?: string;
  quantity: number;
  onIncrement: () => void;
  onDecrement: () => void;
}

export function MaterialRow({
  name,
  category,
  price,
  unit = 'pcs',
  quantity,
  onIncrement,
  onDecrement,
}: MaterialRowProps) {
  return (
    <View style={styles.container}>
      <View style={styles.info}>
        <Text style={styles.name}>{name}</Text>
        {category && <Text style={styles.category}>{category}</Text>}
        <Text style={styles.price}>
          ₹{price} <Text style={styles.unit}>/ {unit}</Text>
        </Text>
      </View>

      <View style={styles.quantityControls}>
        <TouchableOpacity
          onPress={onDecrement}
          disabled={quantity <= 0}
          style={[styles.counterBtn, quantity <= 0 && styles.counterBtnDisabled]}
        >
          <MinusIcon width={14} height={14} stroke={quantity <= 0 ? colors.textMuted : colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.quantityText}>{quantity}</Text>
        <TouchableOpacity onPress={onIncrement} style={styles.counterBtn}>
          <PlusIcon width={14} height={14} stroke={colors.textPrimary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  info: {
    flex: 1,
    marginRight: spacing.md,
  },
  name: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  category: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
    marginTop: 1,
  },
  price: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
    marginTop: 4,
  },
  unit: {
    fontSize: typography.fontSize.xs,
    fontWeight: '400',
    color: colors.textSecondary,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  counterBtn: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.xs,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterBtnDisabled: {
    opacity: 0.4,
  },
  quantityText: {
    minWidth: 24,
    textAlign: 'center',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
});
