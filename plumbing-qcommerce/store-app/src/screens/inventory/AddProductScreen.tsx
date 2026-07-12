import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Alert } from 'react-native';
import { colors, spacing, typography } from '../../theme';
import { ScreenWrapper } from '../../components/common/ScreenWrapper';
import { AppHeader } from '../../components/common/AppHeader';
import { ProductForm } from '../../components/forms/ProductOfferStockForms';
import { inventoryService } from '../../services/inventory/inventoryService';
import { useAppDispatch, useAppSelector } from '../../redux/store';
import { addProductInSlice, updateProductInSlice } from '../../redux/slices/inventorySlice';
import { NavigationProp, RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { AppStackParamList } from '../../types/navigation';
import { Product } from '../../types';

export const AddProductScreen = () => {
  const navigation = useNavigation<NavigationProp<AppStackParamList>>();
  const route = useRoute<RouteProp<AppStackParamList, 'AddProduct'>>();
  const dispatch = useAppDispatch();
  const productId = route.params?.productId;

  const [initialProduct, setInitialProduct] = useState<Product | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (productId) {
      const fetchProduct = async () => {
        try {
          const data = await inventoryService.getProductDetails(productId);
          setInitialProduct(data);
        } catch (e) {
          Alert.alert('Error', 'Failed to retrieve product details');
        }
      };
      fetchProduct();
    }
  }, [productId]);

  const handleSubmit = async (values: Partial<Product>) => {
    setLoading(true);
    try {
      if (productId) {
        // Edit Mode
        const updated = await inventoryService.updateProduct(productId, values);
        dispatch(updateProductInSlice(updated));
        Alert.alert('Product Saved', 'Catalog item updated successfully!', [
          { text: 'OK', onPress: () => navigation.navigate('Inventory') }
        ]);
      } else {
        // Add Mode
        const added = await inventoryService.addProduct(values);
        dispatch(addProductInSlice(added));
        Alert.alert('Product Added', 'Catalog item registered successfully!', [
          { text: 'OK', onPress: () => navigation.navigate('Inventory') }
        ]);
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const isEditMode = !!productId;

  if (isEditMode && !initialProduct) {
    return (
      <ScreenWrapper style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading details...</Text>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper style={styles.container}>
      <AppHeader
        title={isEditMode ? 'Edit Product' : 'Add Product'}
        onBackPress={() => navigation.goBack()}
      />

      <ProductForm
        initialValues={initialProduct}
        onSubmit={handleSubmit}
        submitTitle={isEditMode ? 'Update Product Details' : 'Register Product'}
      />
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
});
export default AddProductScreen;
