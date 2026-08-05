import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import PlusIcon from '../../assets/icons/plus.svg';
import MinusIcon from '../../assets/icons/minus.svg';
import { colors, typography, spacing, borderRadius } from '../../theme';

interface QuantityStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}

export function QuantityStepper({ value, onChange, min = 0, max = 99 }: QuantityStepperProps) {
  const dec = () => onChange(Math.max(min, value - 1));
  const inc = () => onChange(Math.min(max, value + 1));

  const isMin = value <= min;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.btn, isMin && styles.btnDisabled]}
        onPress={dec}
        disabled={isMin}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessibilityLabel="Decrease quantity"
      >
        <MinusIcon width={14} height={14} stroke={isMin ? colors.textMuted : colors.primary} />
      </TouchableOpacity>

      <Text style={styles.value}>{value}</Text>

      <TouchableOpacity
        style={styles.btn}
        onPress={inc}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessibilityLabel="Increase quantity"
      >
        <PlusIcon width={14} height={14} stroke={colors.primary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: borderRadius.round,
    paddingHorizontal: spacing.xs,
  },
  btn: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.round,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  value: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    width: 28,
    textAlign: 'center',
  },
});
