import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors, spacing, typography } from '../../theme';
import { StitchBadge } from '../common/StitchBadge';
import { SvgPlumbingHardwareBolt, SvgStatusStarFilled } from '../../assets/svg';

interface ProductCardProps {
  id?: number;
  name: string;
  price: number;
  originalPrice?: number;
  categoryName: string;
  rating?: number;
  reviewsCount?: number;
  quantityInCart: number;
  layout?: 'grid' | 'list';
  inStock?: boolean;
  onAdd: () => void;
  onRemove?: () => void;
  onPress: () => void;
}

export function ProductCard({
  name,
  price,
  originalPrice,
  categoryName,
  rating = 4.8,
  reviewsCount = 100,
  quantityInCart,
  layout = 'list',
  inStock = true,
  onAdd,
  onRemove,
  onPress,
}: ProductCardProps) {
  if (layout === 'grid') {
    return (
      <TouchableOpacity
        style={styles.gridContainer}
        onPress={onPress}
        activeOpacity={0.85}
        accessibilityRole="button"
      >
        <View style={styles.gridImageWrapper}>
          {inStock && (
            <View style={styles.badgeTopLeft}>
              <StitchBadge label="In Stock" variant="verified" />
            </View>
          )}
          <SvgPlumbingHardwareBolt width={36} height={36} stroke={colors.textSecondary} />
        </View>

        <View style={styles.gridContent}>
          <View style={styles.ratingRow}>
            <SvgStatusStarFilled width={13} height={13} fill="#F59E0B" stroke="#F59E0B" style={{ marginRight: 3 }} />
            <Text style={styles.ratingText}>
              {rating.toFixed(1)} <Text style={styles.reviewsText}>({reviewsCount})</Text>
            </Text>
          </View>

          <Text style={styles.gridName} numberOfLines={2}>
            {name}
          </Text>
          <Text style={styles.gridCategory} numberOfLines={1}>
            {categoryName}
          </Text>

          <View style={styles.gridFooter}>
            <View style={styles.priceColumn}>
              <Text style={styles.price}>₹{price}</Text>
              {originalPrice && originalPrice > price ? (
                <Text style={styles.originalPrice}>₹{originalPrice}</Text>
              ) : null}
            </View>

            {quantityInCart > 0 ? (
              <View style={styles.quantityContainer}>
                <TouchableOpacity
                  style={styles.quantityBtn}
                  onPress={onRemove}
                  accessibilityLabel="Decrease quantity"
                >
                  <Text style={styles.quantityBtnText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.quantityText}>{quantityInCart}</Text>
                <TouchableOpacity
                  style={styles.quantityBtn}
                  onPress={onAdd}
                  accessibilityLabel="Increase quantity"
                >
                  <Text style={styles.quantityBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.gridAddButton}
                onPress={onAdd}
                accessibilityLabel="Add to cart"
              >
                <Text style={styles.gridAddButtonText}>+ Add</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={styles.listContainer}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
    >
      <View style={styles.listImagePlaceholder}>
        <SvgPlumbingHardwareBolt width={24} height={24} stroke={colors.textSecondary} />
      </View>

      <View style={styles.listInfo}>
        <Text style={styles.listCategory}>{categoryName}</Text>
        <Text style={styles.listName} numberOfLines={2}>
          {name}
        </Text>

        <View style={styles.ratingRow}>
          <SvgStatusStarFilled width={13} height={13} fill="#F59E0B" stroke="#F59E0B" style={{ marginRight: 3 }} />
          <Text style={styles.ratingText}>
            {rating.toFixed(1)} <Text style={styles.reviewsText}>({reviewsCount})</Text>
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
            <TouchableOpacity
              style={styles.quantityBtn}
              onPress={onRemove}
              accessibilityLabel="Decrease quantity"
            >
              <Text style={styles.quantityBtnText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.quantityText}>{quantityInCart}</Text>
            <TouchableOpacity
              style={styles.quantityBtn}
              onPress={onAdd}
              accessibilityLabel="Increase quantity"
            >
              <Text style={styles.quantityBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.addButton}
            onPress={onAdd}
            accessibilityLabel="Add to cart"
          >
            <Text style={styles.addButtonText}>+ Add</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // Grid layout (Stitch home screen / catalog grid)
  gridContainer: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: spacing.md,
  },
  gridImageWrapper: {
    width: '100%',
    height: 104,
    backgroundColor: colors.surfaceSubtle, // #F1F5F9
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: spacing.xs,
  },
  badgeTopLeft: {
    position: 'absolute',
    top: 6,
    left: 6,
    zIndex: 2,
  },
  gridImageIcon: {
    fontSize: 38,
  },
  gridContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  gridName: {
    fontSize: 13,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    lineHeight: 18,
    marginTop: 2,
  },
  gridCategory: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },
  gridFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  priceColumn: {
    justifyContent: 'center',
  },
  gridAddButton: {
    backgroundColor: colors.secondary, // Stitch Emerald
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridAddButtonText: {
    color: colors.surface,
    fontSize: 11,
    fontWeight: typography.fontWeight.bold,
  },

  // List layout (Stitch detailed lists)
  listContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  listImagePlaceholder: {
    width: 76,
    height: 76,
    borderRadius: 12,
    backgroundColor: colors.surfaceSubtle,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  listImageIcon: {
    fontSize: 34,
  },
  listInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  listCategory: {
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  listName: {
    fontSize: 14,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: 3,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  star: {
    fontSize: 12,
    color: colors.warning, // amber
    marginRight: 3,
  },
  ratingText: {
    fontSize: 11,
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
    fontSize: 15,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  originalPrice: {
    fontSize: 11,
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
  actionContainer: {
    justifyContent: 'center',
    alignItems: 'flex-end',
    minWidth: 70,
  },
  addButton: {
    backgroundColor: colors.secondary, // Stitch Emerald
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: 10,
    minWidth: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: typography.fontWeight.bold,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.secondary,
    borderRadius: 8,
    backgroundColor: colors.surface,
    height: 32,
    overflow: 'hidden',
  },
  quantityBtn: {
    width: 24,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.secondaryLight,
  },
  quantityBtnText: {
    color: colors.secondary,
    fontSize: 15,
    fontWeight: 'bold',
  },
  quantityText: {
    paddingHorizontal: spacing.xs,
    fontSize: 12,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    minWidth: 20,
    textAlign: 'center',
  },
});
