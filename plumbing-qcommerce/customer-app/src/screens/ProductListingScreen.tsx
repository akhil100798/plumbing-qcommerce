import { StackScreenProps } from '@react-navigation/stack';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { ProductCard } from '../components/cards/ProductCard';
import {
  createBackendUnavailableError,
  canUseDevMockFallbacks,
  warnUsingDevMockFallback,
} from '../services/mockPolicy';
import { colors, spacing, typography } from '../theme';
import { AppStackParamList } from '../types/navigation';

import { ProductRepository } from '../services/products/productRepository';
import { ProductDTO } from '../services/products/productTypes';

type Props = StackScreenProps<AppStackParamList, 'ProductListing'>;

export function ProductListingScreen({ route, navigation }: Props) {
  const { categoryId, categoryName } = route.params;
  const [products, setProducts] = useState<ProductDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cartCounts, setCartCounts] = useState<{ [key: number]: number }>({});

  const loadProducts = () => {
    setLoading(true);
    setError(null);

    ProductRepository.getProducts(categoryId)
      .then((data) => {
        setProducts(data);
        setLoading(false);
      })
      .catch((err) => {
        if (canUseDevMockFallbacks()) {
          warnUsingDevMockFallback('Product listing', err);
          setProducts([
            {
              id: 101,
              sku: 'ASH-PVC-20',
              name: 'Ashirvad PVC Pipe (20mm) 3 Meter',
              description: 'Premium quality PVC pipe for standard water distribution.',
              price: 220,
              imageUrl: '',
              categoryId: categoryId,
              categoryName: 'Pipes',
            },
            {
              id: 102,
              sku: 'PRN-CPVC-25',
              name: 'Prince CPVC Pipe (25mm) 3 Meter',
              description: 'High-temperature resistant CPVC pipe.',
              price: 240,
              imageUrl: '',
              categoryId: categoryId,
              categoryName: 'Pipes',
            },
            {
              id: 103,
              sku: 'SUP-PVC-25',
              name: 'Supreme PVC Pipe (25mm) 3 Meter',
              description: 'Heavy duty supreme PVC pipe.',
              price: 350,
              imageUrl: '',
              categoryId: categoryId,
              categoryName: 'Pipes',
            },
          ]);
        } else {
          setProducts([]);
          setError(createBackendUnavailableError('products for this category', err).message);
        }
        setLoading(false);
      });
  };

  useEffect(() => {
    loadProducts();
  }, [categoryId]);

  const handleAdd = (productId: number) => {
    setCartCounts((prev) => ({
      ...prev,
      [productId]: (prev[productId] || 0) + 1,
    }));
  };

  const handleRemove = (productId: number) => {
    setCartCounts((prev) => {
      const current = prev[productId] || 0;
      if (current <= 1) {
        const next = { ...prev };
        delete next[productId];
        return next;
      }
      return {
        ...prev,
        [productId]: current - 1,
      };
    });
  };

  const totalItemsInCart = Object.values(cartCounts).reduce((a, b) => a + b, 0);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>?</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{categoryName}</Text>
      </View>

      <View style={styles.filterRow}>
        <TouchableOpacity style={styles.filterBtn} onPress={() => Alert.alert('Filter', 'Product filters are coming soon. Use category search for now.') }>
          <Text style={styles.filterBtnText}>?? Filter</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterBtn} onPress={() => Alert.alert('Sort', 'Sorting is coming soon. Products are currently shown by backend relevance.')}>
          <Text style={styles.filterBtnText}>Sort ??</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.loader}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadProducts}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <ProductCard
              id={item.id}
              name={item.name}
              price={item.price}
              originalPrice={item.price + 30}
              categoryName={item.categoryName}
              quantityInCart={cartCounts[item.id] || 0}
              onAdd={() => handleAdd(item.id)}
              onRemove={() => handleRemove(item.id)}
              onPress={() => navigation.navigate('ProductDetails', { productId: item.id })}
            />
          )}
        />
      )}

      {totalItemsInCart > 0 && (
        <TouchableOpacity
          style={styles.checkoutBar}
          onPress={() => navigation.navigate('Cart')}
        >
          <View>
            <Text style={styles.checkoutBarLabel}>{totalItemsInCart} Items Selected</Text>
            <Text style={styles.checkoutBarTitle}>Ready to purchase</Text>
          </View>
          <View style={styles.checkoutBarAction}>
            <Text style={styles.checkoutBarBtnText}>Go to Cart ?</Text>
          </View>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.layout,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
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
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.layout,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    justifyContent: 'space-between',
  },
  filterBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 9999,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  filterBtnText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.textSecondary,
  },
  listContent: {
    padding: spacing.layout,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.layout,
    gap: spacing.md,
  },
  errorText: {
    fontSize: typography.fontSize.sm,
    color: colors.error,
    fontWeight: typography.fontWeight.bold,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 9999,
  },
  retryButtonText: {
    color: colors.surface,
    fontWeight: typography.fontWeight.bold,
  },
  checkoutBar: {
    position: 'absolute',
    bottom: spacing.lg,
    left: spacing.layout,
    right: spacing.layout,
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  checkoutBarLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    fontWeight: 'bold',
  },
  checkoutBarTitle: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: '900',
  },
  checkoutBarAction: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 8,
  },
  checkoutBarBtnText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: 'bold',
  },
});
