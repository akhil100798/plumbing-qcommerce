import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { borderRadius, colors, spacing, typography } from '../../theme';

interface ProductCardProps {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
  categoryName: string;
  rating?: number;
  reviewsCount?: number;
  quantityInCart: number;
  onAdd: () => void;
  onRemove?: () => void;
  onPress: () => void;
}

export function ProductCard({
  name,
  price,
  originalPrice,
  categoryName,
  rating = 4.5,
  reviewsCount = 100,
  quantityInCart,
  onAdd,
  onRemove,
  onPress,
}: ProductCardProps) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.imagePlaceholder}>
        <Text style={styles.imageIcon}>🔩</Text>
      </View>

      <View style={styles.info}>
        <Text style={styles.category}>{categoryName}</Text>
        <Text style={styles.name} numberOfLines={2}>
          {name}
        </Text>

        <View style={styles.ratingRow}>
          <Text style={styles.star}>⭐</Text>
          <Text style={styles.ratingText}>
            {rating} <Text style={styles.reviewsText}>({reviewsCount})</Text>
          </Text>
        </View>

        <View style={styles.priceRow}>
          <Text style={styles.price}>₹{price}</Text>
          {originalPrice && originalPrice > price && (
            <Text style={styles.originalPrice}>₹{originalPrice}</Text>
          )}
        </View>
      </View>

      <View style={styles.actionContainer}>
        {quantityInCart > 0 ? (
          <View style={styles.quantityContainer}>
            <TouchableOpacity style={styles.quantityBtn} onPress={onRemove}>
              <Text style={styles.quantityBtnText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.quantityText}>{quantityInCart}</Text>
            <TouchableOpacity style={styles.quantityBtn} onPress={onAdd}>
              <Text style={styles.quantityBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.addButton} onPress={onAdd}>
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
    alignItems: 'center',
  },
  imagePlaceholder: {
    width: 72,
    height: 72,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  imageIcon: {
    fontSize: 32,
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
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  star: {
    fontSize: 12,
    marginRight: 2,
  },
  ratingText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.textSecondary,
  },
  reviewsText: {
    color: colors.textMuted,
    fontWeight: typography.fontWeight.medium,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  price: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  originalPrice: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
    textDecorationLine: 'line-through',
    fontWeight: typography.fontWeight.medium,
  },
  actionContainer: {
    justifyContent: 'center',
    alignItems: 'flex-end',
    width: 80,
  },
  addButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    height: 36,
    width: 64,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: colors.surface,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surface,
    height: 36,
    overflow: 'hidden',
  },
  quantityBtn: {
    width: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
  },
  quantityBtnText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  quantityText: {
    paddingHorizontal: spacing.sm,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
});
