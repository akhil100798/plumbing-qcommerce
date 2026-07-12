import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, borderRadius, spacing, typography, shadows } from '../../theme';
import { Product, Category } from '../../types';
import WarehouseIcon from '../../assets/icons/warehouse.svg';
import ArrowRightIcon from '../../assets/icons/arrow-right.svg';

// ==========================================
// INVENTORY CATEGORY CARD
// ==========================================
interface InventoryCategoryCardProps {
  category: Category;
  productCount?: number;
  onPress: () => void;
}

export const InventoryCategoryCard: React.FC<InventoryCategoryCardProps> = ({
  category,
  productCount,
  onPress,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      style={styles.categoryCard}
      onPress={onPress}
    >
      <View style={styles.catLeft}>
        <View style={styles.catIconBox}>
          <WarehouseIcon width={16} height={16} stroke={colors.primary} />
        </View>
        <View>
          <Text style={styles.catName}>{category.name}</Text>
          {productCount !== undefined && (
            <Text style={styles.catCount}>{productCount} Products</Text>
          )}
        </View>
      </View>
      <ArrowRightIcon width={12} height={12} stroke={colors.textMuted} />
    </TouchableOpacity>
  );
};

// ==========================================
// PRODUCT CARD
// ==========================================
interface ProductCardProps {
  product: Product;
  onPress: () => void;
  onEditPress?: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onPress,
  onEditPress,
}) => {
  const isLowStock = product.stock <= 5;

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      style={styles.productCard}
      onPress={onPress}
    >
      <View style={styles.prodRow}>
        <Image
          source={{ uri: product.imageUrl || 'https://images.unsplash.com/photo-1595206133361-b1fe343e5e23?q=80&w=200' }}
          style={styles.prodImage}
        />
        <View style={styles.prodDetails}>
          <Text style={styles.prodSku}>{product.sku}</Text>
          <Text numberOfLines={1} style={styles.prodName}>{product.name}</Text>
          
          <View style={styles.priceRow}>
            <Text style={styles.prodPrice}>₹{product.price}</Text>
            {product.mrp > product.price && (
              <Text style={styles.prodMrp}>₹{product.mrp}</Text>
            )}
            {product.discount && (
              <Text style={styles.prodDiscount}>{product.discount}% OFF</Text>
            )}
          </View>

          <View style={styles.stockRow}>
            <Text style={styles.stockLabel}>Stock: </Text>
            <Text style={[styles.stockVal, isLowStock && styles.lowStockVal]}>
              {product.stock} Units {isLowStock ? '(Low)' : ''}
            </Text>
          </View>
        </View>
      </View>

      {onEditPress && (
        <TouchableOpacity
          style={styles.editButton}
          onPress={(e) => {
            e.stopPropagation();
            onEditPress();
          }}
        >
          <Text style={styles.editText}>Edit</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  categoryCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  catLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  catIconBox: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.sm,
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  catEmoji: {
    fontSize: 16,
  },
  catName: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  catCount: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
  },
  catArrow: {
    fontSize: 12,
    color: colors.textMuted,
  },

  // ProductCard
  productCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    ...shadows.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  prodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  prodImage: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.sm,
    marginRight: spacing.md,
    backgroundColor: colors.background,
  },
  prodDetails: {
    flex: 1,
  },
  prodSku: {
    fontSize: 9,
    fontWeight: typography.fontWeight.bold,
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  prodName: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginTop: 1,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  prodPrice: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.black,
    color: colors.textPrimary,
    marginRight: spacing.sm,
  },
  prodMrp: {
    fontSize: typography.fontSize.xs,
    textDecorationLine: 'line-through',
    color: colors.textMuted,
    marginRight: spacing.sm,
  },
  prodDiscount: {
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
    color: colors.success,
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  stockLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  stockVal: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.success,
  },
  lowStockVal: {
    color: colors.danger,
  },
  editButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.xs,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  editText: {
    fontSize: 11,
    color: colors.textPrimary,
  },
});
