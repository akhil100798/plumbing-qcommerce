import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { borderRadius, colors, spacing, typography } from '../../theme';

interface StoreInventoryCardProps {
  id: number;
  name: string;
  price: number;
  categoryName: string;
  qtyInCart: number;
  onAdd: () => void;
  onRemove: () => void;
  onPress: () => void;
  icon?: string;
}

export function StoreInventoryCard({
  name,
  price,
  categoryName,
  qtyInCart,
  onAdd,
  onRemove,
  onPress,
  icon = '🔩',
}: StoreInventoryCardProps) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.imageBox}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.category}>{categoryName}</Text>
        <Text style={styles.name} numberOfLines={2}>{name}</Text>
        <Text style={styles.price}>₹{price}</Text>
      </View>
      <View style={styles.action}>
        {qtyInCart > 0 ? (
          <View style={styles.qtyContainer}>
            <TouchableOpacity style={styles.qtyBtn} onPress={onRemove}>
              <Text style={styles.qtyBtnText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.qtyVal}>{qtyInCart}</Text>
            <TouchableOpacity style={styles.qtyBtn} onPress={onAdd}>
              <Text style={styles.qtyBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.addBtn} onPress={onAdd}>
            <Text style={styles.addBtnText}>Add</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  imageBox: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  icon: {
    fontSize: 24,
  },
  info: {
    flex: 1,
    marginRight: spacing.sm,
  },
  category: {
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  name: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  price: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  action: {
    width: 80,
    alignItems: 'flex-end',
  },
  addBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.sm,
    width: 64,
    alignItems: 'center',
  },
  addBtnText: {
    color: colors.surface,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
  qtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surface,
    height: 30,
  },
  qtyBtn: {
    width: 20,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
  },
  qtyBtnText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  qtyVal: {
    paddingHorizontal: spacing.sm,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
});
