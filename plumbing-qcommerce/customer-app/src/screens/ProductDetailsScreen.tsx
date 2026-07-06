import { StackScreenProps } from '@react-navigation/stack';
import React, { useEffect, useState } from 'react';
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

import { ProductRepository } from '../services/products/productRepository';
import { ProductDTO } from '../services/products/productTypes';

type Props = StackScreenProps<AppStackParamList, 'ProductDetails'>;

export function ProductDetailsScreen({ route, navigation }: Props) {
  const { productId } = route.params;
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
    navigation.navigate('Cart');
  };

  const handleAddToCart = () => {
    Alert.alert('Added to Cart', `${product?.name} has been added to your cart.`);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={colors.primary} />
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
          <Text style={styles.backButtonText}>?</Text>
        </TouchableOpacity>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconBtn}>
            <Text style={styles.iconEmoji}>??</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}>
            <Text style={styles.iconEmoji}>??</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.imageGallery}>
          <Text style={styles.largeEmoji}>??</Text>
        </View>

        <View style={styles.detailsBlock}>
          <Text style={styles.categoryName}>{product.categoryName}</Text>
          <Text style={styles.title}>{product.name}</Text>
          <Text style={styles.subtitle}>(20mm) 3 Meter</Text>

          <View style={styles.ratingRow}>
            <Text style={styles.star}>?</Text>
            <Text style={styles.ratingValue}>4.5</Text>
            <Text style={styles.reviewsCount}>(120 Reviews)</Text>
            <View style={styles.dividerDot} />
            <Text style={styles.brandLabel}>Brand: Ashirvad</Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.price}>?{product.price}</Text>
            <Text style={styles.originalPrice}>?{product.price + 30}</Text>
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>12% OFF</Text>
            </View>
          </View>

          <View style={styles.deliveryWidget}>
            <Text style={styles.deliveryIcon}>??</Text>
            <Text style={styles.deliveryText}>
              Delivery in <Text style={styles.deliveryBold}>20 mins</Text> from Sai Pipes (0.8 km)
            </Text>
          </View>

          <View style={styles.badgesRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeIcon}>???</Text>
              <Text style={styles.badgeText}>Genuine Product</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeIcon}>??</Text>
              <Text style={styles.badgeText}>GST Bill</Text>
            </View>
          </View>

          <Text style={styles.descriptionHeader}>Product Description</Text>
          <Text style={styles.description}>{product.description}</Text>

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
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.layout,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  backButtonText: {
    fontSize: 22,
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
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  iconEmoji: {
    fontSize: 18,
  },
  scrollContent: {
    paddingBottom: spacing.huge,
  },
  imageGallery: {
    height: 240,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  largeEmoji: {
    fontSize: 120,
  },
  detailsBlock: {
    padding: spacing.layout,
  },
  categoryName: {
    fontSize: 11,
    fontWeight: typography.fontWeight.bold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.black,
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
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
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginRight: 4,
  },
  reviewsCount: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },
  dividerDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderDark,
    marginHorizontal: spacing.sm,
  },
  brandLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  price: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.black,
    color: colors.textPrimary,
  },
  originalPrice: {
    fontSize: typography.fontSize.md,
    color: colors.textMuted,
    textDecorationLine: 'line-through',
    fontWeight: typography.fontWeight.medium,
  },
  discountBadge: {
    backgroundColor: colors.successLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountText: {
    color: colors.success,
    fontSize: 11,
    fontWeight: typography.fontWeight.bold,
  },
  deliveryWidget: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  deliveryIcon: {
    fontSize: 20,
  },
  deliveryText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },
  deliveryBold: {
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
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
    fontWeight: typography.fontWeight.bold,
  },
  descriptionHeader: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  description: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
    fontWeight: typography.fontWeight.medium,
    marginBottom: spacing.lg,
  },
  quantitySection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1.5,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  quantityLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.borderDark,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  qtyBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  qtyBtnText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  qtyNumber: {
    paddingHorizontal: spacing.md,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.layout,
  },
  errorText: {
    fontSize: typography.fontSize.md,
    color: colors.error,
    fontWeight: typography.fontWeight.bold,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 9999,
  },
  retryButtonText: {
    color: colors.surface,
    fontWeight: typography.fontWeight.bold,
  },
  footer: {
    flexDirection: 'row',
    padding: spacing.layout,
    borderTopWidth: 1.5,
    borderTopColor: colors.border,
    gap: spacing.md,
    backgroundColor: colors.surface,
  },
  cartButton: {
    flex: 1,
  },
  buyButton: {
    flex: 1.2,
  },
});
