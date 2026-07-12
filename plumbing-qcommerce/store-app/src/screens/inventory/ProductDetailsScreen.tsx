import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Image, ScrollView, Modal, Alert, TouchableOpacity } from 'react-native';
import { colors, borderRadius, spacing, typography, shadows } from '../../theme';
import { ScreenWrapper } from '../../components/common/ScreenWrapper';
import { AppHeader } from '../../components/common/AppHeader';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { SecondaryButton } from '../../components/common/SecondaryButton';
import { StockUpdateForm } from '../../components/forms/ProductOfferStockForms';
import { inventoryService } from '../../services/inventory/inventoryService';
import { useAppDispatch, useAppSelector } from '../../redux/store';
import { updateProductInSlice } from '../../redux/slices/inventorySlice';
import { NavigationProp, RouteProp, useNavigation, useRoute, useIsFocused } from '@react-navigation/native';
import { AppStackParamList } from '../../types/navigation';
import { Product } from '../../types';

export const ProductDetailsScreen = () => {
  const navigation = useNavigation<NavigationProp<AppStackParamList>>();
  const route = useRoute<RouteProp<AppStackParamList, 'ProductDetails'>>();
  const dispatch = useAppDispatch();
  const isFocused = useIsFocused();
  const { productId } = route.params;

  const [product, setProduct] = useState<Product | null>(null);
  const [showStockModal, setShowStockModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadDetails = async () => {
    try {
      const data = await inventoryService.getProductDetails(productId);
      setProduct(data);
    } catch (e: any) {
      Alert.alert('Error', 'Failed to retrieve product details');
    }
  };

  useEffect(() => {
    if (isFocused) {
      loadDetails();
    }
  }, [productId, isFocused]);

  const handleStockSave = async (newStock: number) => {
    if (!product) return;
    setLoading(true);
    try {
      const updated = await inventoryService.updateStock(product.id, newStock);
      setProduct(updated);
      dispatch(updateProductInSlice(updated));
      setShowStockModal(false);
      Alert.alert('Stock Updated', `Stock count updated successfully to ${newStock}`);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  if (!product) {
    return (
      <ScreenWrapper style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading details...</Text>
      </ScreenWrapper>
    );
  }

  const isLowStock = product.stock <= 5;

  return (
    <ScreenWrapper style={styles.container}>
      <AppHeader title="Product Details" onBackPress={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.imageCard}>
          <Image
            source={{ uri: product.imageUrl || 'https://images.unsplash.com/photo-1595206133361-b1fe343e5e23?q=80&w=300' }}
            style={styles.image}
            resizeMode="cover"
          />
        </View>

        <View style={styles.detailsCard}>
          <Text style={styles.skuText}>{product.sku}</Text>
          <Text style={styles.nameText}>{product.name}</Text>
          
          <View style={styles.priceRow}>
            <Text style={styles.priceVal}>₹{product.price}</Text>
            {product.mrp > product.price && (
              <Text style={styles.mrpVal}>₹{product.mrp}</Text>
            )}
            {product.discount && (
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>{product.discount}% OFF</Text>
              </View>
            )}
          </View>

          {product.description && (
            <View style={styles.descSection}>
              <Text style={styles.sectionLabel}>Description</Text>
              <Text style={styles.descText}>{product.description}</Text>
            </View>
          )}

          <View style={styles.metaGrid}>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Category</Text>
              <Text style={styles.metaVal}>{product.categoryName}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Brand</Text>
              <Text style={styles.metaVal}>{product.brand || 'General'}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>GST</Text>
              <Text style={styles.metaVal}>{product.gst}%</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Current Stock</Text>
              <Text style={[styles.metaVal, styles.stockVal, isLowStock && styles.lowStockVal]}>
                {product.stock} Units {isLowStock ? '(Low Stock)' : ''}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <SecondaryButton
          title="Edit Product"
          onPress={() => navigation.navigate('AddProduct', { productId: product.id })}
          style={styles.actionBtn}
        />
        <PrimaryButton
          title="Update Stock"
          onPress={() => setShowStockModal(true)}
          style={[styles.actionBtn, { marginLeft: spacing.md }]}
        />
      </View>

      {/* Stock Update Modal */}
      <Modal
        visible={showStockModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowStockModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <StockUpdateForm
              currentStock={product.stock}
              onCancel={() => setShowStockModal(false)}
              onSave={handleStockSave}
            />
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  scroll: {
    padding: spacing.layout,
  },
  imageCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
    marginBottom: spacing.md,
  },
  image: {
    width: '100%',
    height: 220,
    backgroundColor: colors.background,
  },
  detailsCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
    marginBottom: spacing.giant,
  },
  skuText: {
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  nameText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginTop: 2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  priceVal: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.black,
    color: colors.textPrimary,
    marginRight: spacing.md,
  },
  mrpVal: {
    fontSize: typography.fontSize.sm,
    textDecorationLine: 'line-through',
    color: colors.textMuted,
    marginRight: spacing.md,
  },
  discountBadge: {
    backgroundColor: colors.successLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.xs,
  },
  discountText: {
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
    color: colors.success,
  },
  descSection: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  descText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    lineHeight: 20,
  },
  metaGrid: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  metaLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  metaVal: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  stockVal: {
    color: colors.success,
  },
  lowStockVal: {
    color: colors.danger,
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: spacing.layout,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionBtn: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.layout,
  },
  modalContent: {
    width: '100%',
    alignItems: 'center',
  },
});
export default ProductDetailsScreen;
