import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { Product, products as fallbackProducts } from '../../data/products';
import { CatalogService } from '../../services/catalogService';
import { useCart } from '../../services/cartService';
import { QuantitySelector } from '../../components/common/QuantitySelector';
import {
  ChevronLeftIcon,
  StarIcon,
  ShieldCheckIcon,
} from '../../assets/svg/Icons';

interface ProductDetailScreenProps {
  productId: string;
  onBack: () => void;
  onNavigateToCart: () => void;
}

export const ProductDetailScreen: React.FC<ProductDetailScreenProps> = ({
  productId,
  onBack,
  onNavigateToCart,
}) => {
  const [product, setProduct] = useState<Product>(
    fallbackProducts.find((p) => p.id === productId) || fallbackProducts[0]
  );
  const { addItem, items, updateQuantity } = useCart();

  useEffect(() => {
    let isMounted = true;
    CatalogService.getProductById(productId).then((res) => {
      if (res && isMounted) {
        setProduct(res);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [productId]);

  const cartItem = items.find((i) => i.id === product.id);
  const qty = cartItem ? cartItem.quantity : 0;

  const handleAdd = () => {
    addItem(product, 'product');
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7} accessibilityLabel="Back button">
          <ChevronLeftIcon size={22} color={colors.onBackground} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {product.name}
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Product Image */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: product.imageUrl }} style={styles.productImage} />
          {product.badge && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{product.badge}</Text>
            </View>
          )}
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.brand}>{product.brand}</Text>
          <Text style={styles.name}>{product.name}</Text>

          <View style={styles.ratingRow}>
            <View style={styles.ratingBox}>
              <StarIcon size={14} fill={colors.star} />
              <Text style={styles.ratingScore}>{product.rating}</Text>
            </View>
            <Text style={styles.reviewsCount}>({product.reviewsCount} verified reviews)</Text>
            <View style={styles.stockBadge}>
              <Text style={styles.stockText}>In Stock</Text>
            </View>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.price}>₹{product.price}</Text>
            <Text style={styles.originalPrice}>₹{product.originalPrice}</Text>
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>
                {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
              </Text>
            </View>
          </View>
          <Text style={styles.unitText}>Inclusive of all taxes • {product.unit}</Text>
        </View>

        {/* Specifications */}
        <View style={styles.specsCard}>
          <Text style={styles.specsTitle}>Product Specifications</Text>
          {Object.entries(product.specs).map(([key, value], idx) => (
            <View key={idx} style={styles.specRow}>
              <Text style={styles.specKey}>{key}</Text>
              <Text style={styles.specValue}>{value}</Text>
            </View>
          ))}
        </View>

        {/* Description */}
        <View style={styles.descCard}>
          <Text style={styles.descTitle}>About the Product</Text>
          <Text style={styles.descText}>{product.description}</Text>
        </View>

        {/* FixKart Genuine Parts Guarantee */}
        <View style={styles.guaranteeCard}>
          <ShieldCheckIcon size={20} color={colors.primary} />
          <View style={styles.guaranteeInfo}>
            <Text style={styles.guaranteeTitle}>FixKart 100% Genuine Guarantee</Text>
            <Text style={styles.guaranteeSub}>
              Directly sourced from manufacturer authorized distributors with official warranty.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.bottomPriceLabel}>Total Price</Text>
          <Text style={styles.bottomPrice}>₹{product.price * (qty || 1)}</Text>
        </View>

        {qty === 0 ? (
          <TouchableOpacity style={styles.addBtn} onPress={handleAdd} activeOpacity={0.8} accessibilityRole="button">
            <Text style={styles.addBtnText}>Add to Cart</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.qtyContainer}>
            <QuantitySelector
              quantity={qty}
              onIncrease={() => updateQuantity(product.id, 1)}
              onDecrease={() => updateQuantity(product.id, -1)}
            />
            <TouchableOpacity
              style={styles.goToCartBtn}
              onPress={onNavigateToCart}
              activeOpacity={0.8}
              accessibilityRole="button"
            >
              <Text style={styles.goToCartText}>View Cart</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceVariant,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  headerTitle: {
    fontFamily: typography.h4.fontFamily,
    fontSize: 16,
    fontWeight: '600',
    color: colors.onBackground,
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  imageContainer: {
    height: 240,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  badge: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.lg,
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.onPrimary,
  },
  infoCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceVariant,
  },
  brand: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  name: {
    fontFamily: typography.h2.fontFamily,
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
    color: colors.onBackground,
    marginBottom: spacing.sm,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceVariant,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: 6,
  },
  ratingScore: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.onBackground,
    marginLeft: 3,
  },
  reviewsCount: {
    fontSize: 11,
    color: colors.secondary,
    marginRight: 8,
  },
  stockBadge: {
    backgroundColor: colors.successContainer,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  stockText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.onSuccess,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  price: {
    fontFamily: typography.h2.fontFamily,
    fontSize: 22,
    fontWeight: '700',
    color: colors.onBackground,
    marginRight: spacing.sm,
  },
  originalPrice: {
    fontFamily: typography.body2.fontFamily,
    fontSize: 14,
    color: colors.secondary,
    textDecorationLine: 'line-through',
    marginRight: spacing.sm,
  },
  discountBadge: {
    backgroundColor: colors.primaryFixed,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
  },
  unitText: {
    fontSize: 11,
    color: colors.secondary,
  },
  specsCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    marginTop: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceVariant,
  },
  specsTitle: {
    fontFamily: typography.h4.fontFamily,
    fontSize: 16,
    fontWeight: '600',
    color: colors.onBackground,
    marginBottom: spacing.sm,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceVariant,
  },
  specKey: {
    fontSize: 12,
    color: colors.secondary,
    flex: 1,
  },
  specValue: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.onBackground,
    flex: 1,
    textAlign: 'right',
  },
  descCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    marginTop: spacing.sm,
  },
  descTitle: {
    fontFamily: typography.h4.fontFamily,
    fontSize: 16,
    fontWeight: '600',
    color: colors.onBackground,
    marginBottom: 6,
  },
  descText: {
    fontFamily: typography.body2.fontFamily,
    fontSize: 14,
    color: colors.onSurfaceVariant,
    lineHeight: 20,
  },
  guaranteeCard: {
    flexDirection: 'row',
    backgroundColor: colors.primaryFixed,
    margin: spacing.lg,
    padding: spacing.md,
    borderRadius: 14,
    alignItems: 'center',
  },
  guaranteeInfo: {
    marginLeft: spacing.sm,
    flex: 1,
  },
  guaranteeTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  guaranteeSub: {
    fontSize: 10,
    color: colors.onSurfaceVariant,
    marginTop: 2,
    lineHeight: 14,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceVariant,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bottomPriceLabel: {
    fontSize: 10,
    color: colors.secondary,
    textTransform: 'uppercase',
  },
  bottomPrice: {
    fontFamily: typography.h2.fontFamily,
    fontSize: 22,
    fontWeight: '700',
    color: colors.onBackground,
  },
  addBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 12,
  },
  addBtnText: {
    fontFamily: typography.button.fontFamily,
    fontSize: 15,
    fontWeight: '600',
    color: colors.onPrimary,
  },
  qtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  goToCartBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    marginLeft: spacing.sm,
  },
  goToCartText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.onPrimary,
  },
});
