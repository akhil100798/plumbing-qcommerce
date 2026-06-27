import { StackScreenProps } from '@react-navigation/stack';
import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import { StoreCategorySection } from '../components/cards/StoreCategorySection';
import { StoreInventoryCard } from '../components/cards/StoreInventoryCard';
import { borderRadius, colors, spacing, typography } from '../theme';
import { AppStackParamList } from '../types/navigation';
import { RootState } from '../redux/store';
import { addToCart, removeFromCart } from '../redux/slices/cartSlice';
import { apiClient } from '../services/apiClient';

type Props = StackScreenProps<AppStackParamList, 'StoreDetails'>;

interface ProductItem {
  id: number;
  name: string;
  price: number;
  categoryName: string;
  icon: string;
}

export function StoreDetailsScreen({ route, navigation }: Props) {
  const dispatch = useDispatch();
  const cartItems = useSelector((state: RootState) => state.cart.items);
  const { storeId, storeName } = route.params;
  const [selectedCategory, setSelectedCategory] = useState('Pipes');
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<string[]>(['Pipes']);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchInventory = async () => {
      setLoading(true);
      try {
        const response = await apiClient.get<any[]>(`/stores/${storeId}/inventory`);
        const mapped = response.data.map((stock) => {
          const catName = stock.product.categoryName || (stock.product.category ? stock.product.category.name : 'Pipes');
          return {
            id: stock.product.id,
            name: stock.product.name,
            price: stock.product.price,
            categoryName: catName,
            icon: stock.product.name.toLowerCase().includes('tap')
              ? '🚰'
              : stock.product.name.toLowerCase().includes('elbow')
              ? '🔩'
              : '🛢️',
          };
        });
        setProducts(mapped);

        const uniqCats = Array.from(new Set(mapped.map((p) => p.categoryName))) as string[];
        if (uniqCats.length > 0) {
          setCategories(uniqCats);
          setSelectedCategory(uniqCats[0]);
        }
      } catch (err) {
        console.error('Failed to load store inventory', err);
      } finally {
        setLoading(false);
      }
    };
    fetchInventory();
  }, [storeId]);

  const filteredProducts = products.filter(
    (p) => p.categoryName === selectedCategory
  );

  const cartQuantitySum = Object.values(cartItems).reduce((sum, count) => sum + count, 0);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{storeName}</Text>
      </View>

      {/* Store Profile Card */}
      <View style={styles.profileSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>🏪</Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{storeName}</Text>
          <Text style={styles.profileSub}>Verified Hardware Partner • ⭐ 4.7 (120 reviews)</Text>
          <Text style={styles.profileAddress}>Plot 45, Kavuri Hills Rd, Madhapur, Hyderabad</Text>
        </View>
      </View>

      {/* Category Section */}
      <StoreCategorySection
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>{selectedCategory} Catalog</Text>

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : filteredProducts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No products available in this category.</Text>
          </View>
        ) : (
          filteredProducts.map((p) => (
            <StoreInventoryCard
              key={p.id}
              id={p.id}
              name={p.name}
              price={p.price}
              categoryName={p.categoryName}
              icon={p.icon}
              qtyInCart={cartItems[p.id] || 0}
              onAdd={() => dispatch(addToCart(p.id))}
              onRemove={() => dispatch(removeFromCart(p.id))}
              onPress={() => navigation.navigate('ProductDetails', { productId: p.id })}
            />
          ))
        )}
      </ScrollView>

      {cartQuantitySum > 0 && (
        <View style={styles.cartBar}>
          <View>
            <Text style={styles.cartCount}>
              {cartQuantitySum} Items Added
            </Text>
            <Text style={styles.cartSub}>Items reserved for checkout</Text>
          </View>
          <TouchableOpacity
            style={styles.checkoutBtn}
            onPress={() => navigation.navigate('Cart')}
          >
            <Text style={styles.checkoutBtnText}>Go to Cart</Text>
          </TouchableOpacity>
        </View>
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
  profileSection: {
    flexDirection: 'row',
    padding: spacing.layout,
    backgroundColor: colors.surface,
    borderBottomWidth: 1.5,
    borderBottomColor: colors.border,
    alignItems: 'center',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    fontSize: 24,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  profileSub: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.bold,
    marginTop: 2,
  },
  profileAddress: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: typography.fontWeight.medium,
    marginTop: 2,
  },
  scrollContent: {
    padding: spacing.layout,
    paddingBottom: spacing.huge,
  },
  sectionTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cartBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.layout,
    borderTopWidth: 1.5,
    borderTopColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
  },
  emptyContainer: {
    paddingVertical: spacing.huge,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
  },
  centerContainer: {
    paddingVertical: spacing.huge,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartCount: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.black,
    color: colors.primary,
  },
  cartSub: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },
  checkoutBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  checkoutBtnText: {
    color: colors.surface,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  },
});
