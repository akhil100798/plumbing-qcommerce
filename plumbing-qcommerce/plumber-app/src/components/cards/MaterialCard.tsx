import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from 'react-native';

import { borderRadius, colors, shadows, spacing, typography } from '../../theme';

interface MaterialCardProps {
  name: string;
  price: number;
  quantity: number;
  onIncrement: () => void;
  onDecrement: () => void;
}

export function MaterialCard({
  name,
  price,
  quantity,
  onIncrement,
  onDecrement,
}: MaterialCardProps) {
  return (
    <View style={styles.container}>
      <View style={styles.imagePlaceholder}>
        <Text style={styles.imageIcon}>🔩</Text>
      </View>

      <View style={styles.details}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.price}>₹{price}</Text>
      </View>

      <View style={styles.stepper}>
        {quantity > 0 ? (
          <>
            <TouchableOpacity style={styles.stepperButton} onPress={onDecrement}>
              <Text style={styles.stepperText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.quantity}>{quantity}</Text>
          </>
        ) : null}
        <TouchableOpacity style={[styles.stepperButton, styles.incrementButton]} onPress={onIncrement}>
          <Text style={[styles.stepperText, quantity === 0 && styles.addText]}>
            {quantity === 0 ? '+' : '+'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  imagePlaceholder: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  imageIcon: {
    fontSize: 22,
  },
  details: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  price: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textSecondary,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: borderRadius.sm,
    padding: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepperButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  incrementButton: {
    // optional styling
  },
  stepperText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  addText: {
    color: colors.primary,
  },
  quantity: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    minWidth: 20,
    textAlign: 'center',
  },
});
