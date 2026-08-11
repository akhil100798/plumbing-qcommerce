import { StackScreenProps } from '@react-navigation/stack';
import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { PrimaryButton } from '../components/common/PrimaryButton';
import { SecondaryButton } from '../components/common/SecondaryButton';
import {
  createBackendUnavailableError,
  canUseDevMockFallbacks,
  warnUsingDevMockFallback,
} from '../services/mockPolicy';
import { borderRadius, colors, spacing, typography } from '../theme';
import { AppStackParamList } from '../types/navigation';

import { addToCart } from '../redux/slices/cartSlice';
import { ProductRepository } from '../services/products/productRepository';
import { ProductDTO } from '../services/products/productTypes';

type Props = StackScreenProps<AppStackParamList, 'ProductDetails'>;

export function ProductDetailsScreen({ route, navigation }: Props) {
  const { productId } = route.params;
  const dispatch = useDispatch();
  const [product, setProduct] = useState<ProductDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  const loadProduct = () => {
    setLoading(true);
    setError(null);

    ProductRepository.getProductById(productId)
      .then((data) => {
        setProduct(data);
        setLoading(false);
      })
      .catch((err) => {
        if (canUseDevMockFallbacks()) {
          warnUsingDevMockFallback('Product details', err);
          setProduct({
            id: productId,
            sku: 'ASH-PVC-20',
            name: 'Ashirvad PVC Pipe',
            description:
              'Premium quality PVC pipe for standard water distribution and plumbing work. Durable design with high flow rates.',
            price: 220,
            imageUrl: '',
            categoryId: 1,
            categoryName: 'Pipes',
          });
        } else {
          setProduct(null);
          setError(createBackendUnavailableError('product details', err).message);
        }
        setLoading(false);
      });
  };

  useEffect(() => {
    loadProduct();
  }, [productId]);

  const handleBuyNow = () => {
    Array.from({ length: quantity }).forEach(() => dispatch(addToCart(productId)));
    navigation.navigate('Cart');
  };

  const handleAddToCart = () => {
    Array.from({ length: quantity }).forEach(() => dispatch(addToCart(productId)));
    Alert.alert('Added to Cart', `${quantity} x ${product?.name || 'Item'} added to your product cart.`);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={colors.primaryContainer || colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loader}>
          <Text style={styles.errorText}>{error || 'Product not found.'}</Text>
          {!!error && (
            <TouchableOpacity style={styles.retryButton} onPress={loadProduct}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('Cart')}>
            <Text style={styles.iconEmoji}>🛒</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => Alert.alert('Share Product', `${product.name} - ₹${product.price}`)}
          >
            <Text style={styles.iconEmoji}>🔗</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.imageGallery}>
          <Text style={styles.largeEmoji}>🔧</Text>
        </View>

        <View style={styles.detailsBlock}>
          <Text style={styles.categoryName}>{product.categoryName || 'Hardware Category'}</Text>
          <Text style={styles.title}>{product.name}</Text>
          <Text style={styles.subtitle}>SKU: {product.sku || `PROD-${product.id}`}</Text>

          <View style={styles.ratingRow}>
            <Text style={styles.star}>⭐</Text>
            <Text style={styles.ratingValue}>4.8</Text>
            <Text style={styles.reviewsCount}>(Verified Store Inventory)</Text>
            <View style={styles.dividerDot} />
            <Text style={styles.brandLabel}>In Stock</Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.price}>₹{product.price}</Text>
          </View>

          {/* Store Availability & Hardware Fulfillment Widget */}
          <View style={styles.storeWidget}>
            <Text style={styles.storeIcon}>🏪</Text>
            <View style={styles.storeTextCol}>
              <Text style={styles.storeTitle}>Partner Hardware Store Availability</Text>
              <Text style={styles.storeSub}>
                Available for local store collection & plumber self-pickup.
              </Text>
            </View>
          </View>

          <View style={styles.badgesRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeIcon}>🛡️</Text>
              <Text style={styles.badgeText}>Genuine Hardware</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeIcon}>📄</Text>
              <Text style={styles.badgeText}>Store Bill</Text>
            </View>
          </View>

          <Text style={styles.descriptionHeader}>Product Description</Text>
          <Text style={styles.description}>{product.description || 'No description provided.'}</Text>

          <View style={styles.quantitySection}>
            <Text style={styles.quantityLabel}>Select Quantity</Text>
            <View style={styles.quantitySelector}>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => setQuantity((q) => Math.max(1, q - 1))}
              >
                <Text style={styles.qtyBtnText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.qtyNumber}>{quantity}</Text>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => setQuantity((q) => q + 1)}
              >
                <Text style={styles.qtyBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <SecondaryButton
          title="Add to Cart"
          onPress={handleAddToCart}
          style={styles.cartButton}
        />
        <PrimaryButton
          title="Buy Now"
          onPress={handleBuyNow}
          style={styles.buyButton}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background || '#F8F9FF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.layout,
    paddingVertical: spacing.md,
    backgroundColor: colors.surfaceContainerLowest || '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.border || '#C1C6D6',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLowest || '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border || '#C1C6D6',
  },
  backButtonText: {
    fontSize: 20,
    color: colors.textPrimary,
    fontWeight: 'bold',
  },
  headerRight: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLowest || '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border || '#C1C6D6',
  },
  iconEmoji: {
    fontSize: 18,
  },
  scrollContent: {
    paddingBottom: spacing.huge,
  },
  imageGallery: {
    height: 200,
    backgroundColor: colors.surfaceContainerLow || '#EFF4FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  largeEmoji: {
    fontSize: 80,
  },
  detailsBlock: {
    padding: spacing.layout,
  },
  categoryName: {
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.body,
    color: colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.heading,
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontFamily: typography.fontFamily.body,
    marginTop: 2,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  star: {
    fontSize: 14,
    marginRight: 4,
  },
  ratingValue: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.body,
    color: colors.textPrimary,
    marginRight: 4,
  },
  reviewsCount: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontFamily: typography.fontFamily.body,
  },
  dividerDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderDark || '#727785',
    marginHorizontal: spacing.sm,
  },
  brandLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.body,
    color: colors.success || '#006E1C',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  price: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.heading,
    color: colors.primaryContainer || colors.primary,
  },
  storeWidget: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceContainerLow || '#EFF4FF',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border || '#C1C6D6',
  },
  storeIcon: {
    fontSize: 20,
  },
  storeTextCol: {
    flex: 1,
  },
  storeTitle: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.body,
    color: colors.textPrimary,
  },
  storeSub: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontFamily: typography.fontFamily.body,
    marginTop: 2,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  badgeIcon: {
    fontSize: 14,
  },
  badgeText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontFamily: typography.fontFamily.body,
    fontWeight: typography.fontWeight.bold,
  },
  descriptionHeader: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.body,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  description: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontFamily: typography.fontFamily.body,
    lineHeight: 18,
    marginBottom: spacing.lg,
  },
  quantitySection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border || '#C1C6D6',
    paddingTop: spacing.md,
  },
  quantityLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.body,
    color: colors.textPrimary,
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border || '#C1C6D6',
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  },
  qtyBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLowest || '#FFFFFF',
  },
  qtyBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  qtyNumber: {
    paddingHorizontal: spacing.md,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.body,
    color: colors.textPrimary,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.layout,
    backgroundColor: colors.background || '#F8F9FF',
  },
  errorText: {
    fontSize: typography.fontSize.sm,
    color: colors.error || '#BA1A1A',
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.body,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: spacing.md,
    backgroundColor: colors.primaryContainer || colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.body,
  },
  footer: {
    flexDirection: 'row',
    padding: spacing.layout,
    borderTopWidth: 1,
    borderTopColor: colors.border || '#C1C6D6',
    gap: spacing.md,
    backgroundColor: colors.surfaceContainerLowest || '#FFFFFF',
  },
  cartButton: {
    flex: 1,
  },
  buyButton: {
    flex: 1.2,
  },
});
