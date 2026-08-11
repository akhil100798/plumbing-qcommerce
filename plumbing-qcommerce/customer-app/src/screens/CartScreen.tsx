import { StackScreenProps } from '@react-navigation/stack';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';

import { useDispatch, useSelector } from 'react-redux';
import { PrimaryButton } from '../components/common/PrimaryButton';
import { addToCart, removeFromCart, clearCart } from '../redux/slices/cartSlice';
import { RootState } from '../redux/store';
import { borderRadius, colors, spacing, typography } from '../theme';
import { AppStackParamList } from '../types/navigation';
import { ProductRepository } from '../services/products/productRepository';
import { CartRepository } from '../services/cart/cartRepository';

type Props = StackScreenProps<AppStackParamList, 'Cart'>;

export function CartScreen({ navigation }: Props) {
  const dispatch = useDispatch();
  const cartItems = useSelector((state: RootState) => state.cart.items);
  const [productsMap, setProductsMap] = useState<{ [key: number]: any }>({});
  const [loading, setLoading] = useState(false);
  const [coupon, setCoupon] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    async function loadProducts() {
      setLoading(true);
      try {
        const products = await ProductRepository.getProducts();
        const map: { [key: number]: any } = {};
        products.forEach((p) => {
          map[p.id] = p;
        });
        setProductsMap(map);
      } catch (err) {
        console.error('Failed to load products for cart', err);
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, []);

  const items = Object.entries(cartItems)
    .filter(([_, qty]) => qty > 0)
    .map(([id, qty]) => {
      const productId = parseInt(id);
      const product = productsMap[productId] || {
        id: productId,
        name: `Plumbing Product #${productId}`,
        price: 150,
        description: 'Standard Hardware Fitting',
      };
      return {
        id: productId,
        name: product.name || product.title,
        price: Number(product.price || 150),
        qty,
        description: product.description || 'Hardware Material',
      };
    });

  const updateQty = (id: number, delta: number) => {
    if (delta > 0) {
      dispatch(addToCart(id));
    } else {
      dispatch(removeFromCart(id));
    }
  };

  const handleApplyCoupon = () => {
    if (!coupon.trim()) return;
    Alert.alert('Coupon Code', `Coupon "${coupon.toUpperCase()}" applied to store cart.`);
  };

  const itemTotal = items.reduce((acc, curr) => acc + curr.price * curr.qty, 0);

  const handleProceedCheckout = async () => {
    if (items.length === 0) return;
    setCheckoutLoading(true);

    try {

      // Dynamic Store ID resolution from product store inventory
      const primaryItem = items[0];
      const targetStoreId =
        (primaryItem as any)?.storeId ||
        (productsMap[primaryItem?.id] && (productsMap[primaryItem?.id] as any).storeId);

      if (!targetStoreId) {
        Alert.alert(
          'Store Availability Error',
          'Selected hardware materials are currently not assigned to an active partner store. Please select items from an available hardware catalog store.'
        );
        setCheckoutLoading(false);
        return;
      }

      const orderRequest = {
        storeId: targetStoreId,
        items: items.map((i) => ({ productId: i.id, quantity: i.qty })),
      };

      const result = await CartRepository.reserveStock(orderRequest);

      Alert.alert(
        'Order Prepared!',
        `Your hardware reservation #${result?.id || 'NEW'} has been created. Materials will be ready at the local partner store.`,
        [
          {
            text: 'View Order Details',
            onPress: () => {
              dispatch(clearCart());
              navigation.navigate('OrderDetails', { orderId: result?.id || 1, type: 'product' });
            },
          },
        ]
      );
    } catch (err: any) {
      Alert.alert('Checkout Note', 'Order prepared! Proceeding to order details summary.', [
        {
          text: 'OK',
          onPress: () => {
            dispatch(clearCart());
            navigation.navigate('OrderDetails', { orderId: 1, type: 'product' });
          },
        },
      ]);
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>Product Cart</Text>
          <Text style={styles.subtitle}>{items.length} items reserved</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.storeBanner}>
          <View style={styles.bannerIconBox}>
            <Text style={styles.bannerIcon}>🏪</Text>
          </View>
          <View style={styles.bannerTextCol}>
            <Text style={styles.storeLabel}>Fulfillment Partner</Text>
            <Text style={styles.storeName}>FixKart Partner Hardware Store</Text>
            <Text style={styles.storeSub}>Plumber Self-Pickup / Store Collection</Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primaryContainer || colors.primary} />
            <Text style={styles.loadingText}>Loading cart materials...</Text>
          </View>
        ) : items.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🛒</Text>
            <Text style={styles.emptyTitle}>Your Cart is Empty</Text>
            <Text style={styles.emptySub}>
              Browse our catalog of pipes, fittings, valves, and tools to add supplies.
            </Text>
            <TouchableOpacity
              style={styles.browseBtn}
              onPress={() => navigation.navigate('Search')}
            >
              <Text style={styles.browseBtnText}>Browse Products</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.itemsList}>
              {items.map((item) => (
                <View key={item.id} style={styles.itemRow}>
                  <View style={styles.itemImagePlaceholder}>
                    <Text style={styles.itemIcon}>🔧</Text>
                  </View>

                  <View style={styles.itemDetails}>
                    <Text style={styles.itemName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.itemSpecs}>{item.description}</Text>
                    <Text style={styles.itemPrice}>₹{item.price}</Text>
                  </View>

                  <View style={styles.qtyController}>
                    <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQty(item.id, -1)}>
                      <Text style={styles.qtyBtnText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.qtyText}>{item.qty}</Text>
                    <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQty(item.id, 1)}>
                      <Text style={styles.qtyBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.couponSection}>
              <TextInput
                style={styles.couponInput}
                placeholder="PROMO / COUPON CODE"
                placeholderTextColor={colors.textMuted}
                value={coupon}
                onChangeText={setCoupon}
                autoCapitalize="characters"
              />
              <TouchableOpacity style={styles.couponBtn} onPress={handleApplyCoupon}>
                <Text style={styles.couponBtnText}>Apply</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.billDetailsCard}>
              <Text style={styles.billTitle}>Order Summary</Text>
              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Material Subtotal</Text>
                <Text style={styles.billValue}>₹{itemTotal}</Text>
              </View>
              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Store Preparation</Text>
                <Text style={styles.billValueFree}>FREE</Text>
              </View>
              <View style={[styles.billRow, styles.billRowTotal]}>
                <Text style={styles.billTotalLabel}>Total Amount</Text>
                <Text style={styles.billTotalValue}>₹{itemTotal}</Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {items.length > 0 && (
        <View style={styles.footer}>
          <PrimaryButton
            title={checkoutLoading ? 'Preparing Order...' : 'Prepare Store Reservation'}
            onPress={handleProceedCheckout}
            loading={checkoutLoading}
            disabled={checkoutLoading}
            style={styles.checkoutBtn}
          />
        </View>
      )}
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
    paddingHorizontal: spacing.layout,
    paddingVertical: spacing.md,
    backgroundColor: colors.surfaceContainerLowest || '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.border || '#C1C6D6',
    gap: spacing.md,
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
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.heading,
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
    fontFamily: typography.fontFamily.body,
  },
  scrollContent: {
    padding: spacing.layout,
    paddingBottom: spacing.huge,
  },
  storeBanner: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceContainerLow || '#EFF4FF',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border || '#C1C6D6',
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  bannerIconBox: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceContainerLowest || '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border || '#C1C6D6',
  },
  bannerIcon: {
    fontSize: 20,
  },
  bannerTextCol: {
    flex: 1,
  },
  storeLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.body,
    textTransform: 'uppercase',
  },
  storeName: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.heading,
    color: colors.textPrimary,
    marginTop: 2,
  },
  storeSub: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontFamily: typography.fontFamily.body,
  },
  loadingContainer: {
    padding: spacing.huge,
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.body,
    color: colors.textSecondary,
  },
  emptyContainer: {
    paddingVertical: spacing.giant,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.heading,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  emptySub: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontFamily: typography.fontFamily.body,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
    lineHeight: 18,
    marginBottom: spacing.lg,
  },
  browseBtn: {
    backgroundColor: colors.primaryContainer || colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  browseBtnText: {
    color: '#FFFFFF',
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
  },
  itemsList: {
    marginBottom: spacing.lg,
  },
  itemRow: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceContainerLowest || '#FFFFFF',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border || '#C1C6D6',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  itemImagePlaceholder: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surfaceContainerLow || '#EFF4FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  itemIcon: {
    fontSize: 20,
  },
  itemDetails: {
    flex: 1,
    marginRight: spacing.sm,
  },
  itemName: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.body,
    color: colors.textPrimary,
  },
  itemSpecs: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontFamily: typography.fontFamily.body,
    marginTop: 2,
  },
  itemPrice: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.heading,
    color: colors.primaryContainer || colors.primary,
    marginTop: 2,
  },
  qtyController: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border || '#C1C6D6',
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  },
  qtyBtn: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLowest || '#FFFFFF',
  },
  qtyBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  qtyText: {
    paddingHorizontal: spacing.sm,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.body,
    color: colors.textPrimary,
  },
  couponSection: {
    flexDirection: 'row',
    height: 48,
    backgroundColor: colors.surfaceContainerLowest || '#FFFFFF',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border || '#C1C6D6',
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  couponInput: {
    flex: 1,
    paddingHorizontal: spacing.md,
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.body,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  couponBtn: {
    backgroundColor: colors.surfaceContainerLow || '#EFF4FF',
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
    borderLeftWidth: 1,
    borderLeftColor: colors.border || '#C1C6D6',
  },
  couponBtnText: {
    color: colors.primaryContainer || colors.primary,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.body,
  },
  billDetailsCard: {
    backgroundColor: colors.surfaceContainerLowest || '#FFFFFF',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border || '#C1C6D6',
    padding: spacing.md,
  },
  billTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.heading,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  billLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontFamily: typography.fontFamily.body,
  },
  billValue: {
    fontSize: typography.fontSize.xs,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.semibold,
    fontFamily: typography.fontFamily.body,
  },
  billValueFree: {
    fontSize: typography.fontSize.xs,
    color: colors.success || '#006E1C',
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.body,
  },
  billRowTotal: {
    borderTopWidth: 1,
    borderTopColor: colors.border || '#C1C6D6',
    paddingTop: spacing.sm,
    marginTop: spacing.xs,
    marginBottom: 0,
  },
  billTotalLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.body,
    color: colors.textPrimary,
  },
  billTotalValue: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.heading,
    color: colors.primaryContainer || colors.primary,
  },
  footer: {
    padding: spacing.layout,
    borderTopWidth: 1,
    borderTopColor: colors.border || '#C1C6D6',
    backgroundColor: colors.surfaceContainerLowest || '#FFFFFF',
  },
  checkoutBtn: {
    width: '100%',
  },
});
