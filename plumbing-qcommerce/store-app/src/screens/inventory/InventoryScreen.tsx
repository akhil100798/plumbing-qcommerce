import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { colors, borderRadius, spacing, typography, shadows } from '../../theme';
import { ScreenWrapper } from '../../components/common/ScreenWrapper';
import { AppHeader } from '../../components/common/AppHeader';
import { SearchInput } from '../../components/common/SearchInput';
import { ProductCard } from '../../components/cards/InventoryCards';
import { useAppDispatch, useAppSelector } from '../../redux/store';
import { fetchInventoryStart, fetchInventorySuccess, fetchInventoryFailure, setSelectedProduct } from '../../redux/slices/inventorySlice';
import { inventoryService } from '../../services/inventory/inventoryService';
import { NavigationProp, useNavigation, useIsFocused } from '@react-navigation/native';
import { AppStackParamList } from '../../types/navigation';
import { Product } from '../../types';
import PlusIcon from '../../assets/icons/plus.svg';
import WarehouseIcon from '../../assets/icons/warehouse.svg';

export const InventoryScreen = () => {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<NavigationProp<AppStackParamList>>();
  const isFocused = useIsFocused();

  const { products, categories, totalProducts, inStock, lowStock, loading } = useAppSelector(state => state.inventory);
  
  const [search, setSearch] = useState('');
  const [selectedCatId, setSelectedCatId] = useState<number | null>(null);

  const loadInventory = async () => {
    dispatch(fetchInventoryStart());
    try {
      const data = await inventoryService.getInventory(123); // store ID 123
      dispatch(fetchInventorySuccess({
        products: data.products,
        categories: data.categories,
        totalProducts: data.products.length,
        inStock: data.products.filter(p => p.stock > 0).length,
        lowStock: data.products.filter(p => p.stock <= 5).length,
      }));
    } catch (e: any) {
      dispatch(fetchInventoryFailure(e.message || 'Failed to sync inventory'));
    }
  };

  useEffect(() => {
    if (isFocused) {
      loadInventory();
    }
  }, [isFocused]);

  const getFilteredProducts = () => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
      const matchesCat = selectedCatId === null || p.categoryId === selectedCatId;
      return matchesSearch && matchesCat;
    });
  };

  return (
    <ScreenWrapper style={styles.container}>
      <AppHeader
        title="Inventory"
        rightAction={
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('AddProduct')}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <PlusIcon width={14} height={14} stroke={colors.primary} />
              <Text style={styles.addBtnText}>Add</Text>
            </View>
          </TouchableOpacity>
        }
      />

      <View style={styles.topSection}>
        {/* Search */}
        <SearchInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search SKU or Product..."
          onClear={() => setSearch('')}
        />

        {/* Stats Row */}
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{totalProducts}</Text>
            <Text style={styles.statLabel}>Total Products</Text>
          </View>
          <View style={[styles.statBox, styles.borderLeft]}>
            <Text style={[styles.statVal, { color: colors.success }]}>{inStock}</Text>
            <Text style={styles.statLabel}>In Stock</Text>
          </View>
          <View style={[styles.statBox, styles.borderLeft]}>
            <Text style={[styles.statVal, { color: colors.danger }]}>{lowStock}</Text>
            <Text style={styles.statLabel}>Low Stock</Text>
          </View>
        </View>

        {/* Categories Horizontal Selector */}
        <Text style={styles.catTitle}>Filter by Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catScroll}>
          <TouchableOpacity
            style={[styles.catFilterBtn, selectedCatId === null && styles.activeCatFilterBtn]}
            onPress={() => setSelectedCatId(null)}
          >
            <Text style={[styles.catFilterLabel, selectedCatId === null && styles.activeCatFilterLabel]}>
              All Categories
            </Text>
          </TouchableOpacity>
          {categories.map((cat) => {
            const isActive = selectedCatId === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.catFilterBtn, isActive && styles.activeCatFilterBtn]}
                onPress={() => setSelectedCatId(cat.id)}
              >
                <Text style={[styles.catFilterLabel, isActive && styles.activeCatFilterLabel]}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <FlatList
        data={getFilteredProducts()}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.list}
        refreshing={loading}
        onRefresh={loadInventory}
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            onPress={() => {
              dispatch(setSelectedProduct(item));
              navigation.navigate('ProductDetails', { productId: item.id });
            }}
            onEditPress={() => navigation.navigate('AddProduct', { productId: item.id })}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <WarehouseIcon width={40} height={40} stroke={colors.textMuted} style={{ marginBottom: spacing.md }} />
            <Text style={styles.emptyText}>No matching products found</Text>
          </View>
        }
      />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
  },
  addButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.xs,
  },
  addBtnText: {
    color: colors.card,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
  topSection: {
    backgroundColor: colors.card,
    padding: spacing.layout,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  borderLeft: {
    borderLeftWidth: 1.5,
    borderLeftColor: colors.border,
  },
  statVal: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.black,
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: 9,
    color: colors.textSecondary,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  catTitle: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.textSecondary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
  },
  catScroll: {
    paddingVertical: spacing.xs,
  },
  catFilterBtn: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    height: 32,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  activeCatFilterBtn: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  catFilterLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.bold,
  },
  activeCatFilterLabel: {
    color: colors.card,
  },
  list: {
    padding: spacing.layout,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.giant,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.bold,
  },
});
export default InventoryScreen;
