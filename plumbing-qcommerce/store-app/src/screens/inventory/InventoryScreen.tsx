import { NavigationProp, useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import SearchIcon from '../../assets/icons/search.svg';
import WarehouseIcon from '../../assets/icons/warehouse.svg';
import { inventoryService } from '../../services/inventory/inventoryService';
import { borderRadius, colors, shadows, spacing, typography } from '../../theme';
import { InventoryItem } from '../../types';
import { AppStackParamList } from '../../types/navigation';

const tabs = [
  { key: 'all', label: 'All' },
  { key: 'inStock', label: 'In Stock' },
  { key: 'lowStock', label: 'Low Stock' },
  { key: 'outOfStock', label: 'Out of Stock' },
];

export function InventoryScreen() {
  const navigation = useNavigation<NavigationProp<AppStackParamList>>();
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchInventory = useCallback(async () => {
    try {
      const items = await inventoryService.getStoreInventory();
      setInventory(items || []);
    } catch {
      setInventory([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchInventory();
  };

  const filteredItems = useMemo(() => {
    let result = inventory;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (i: any) => (i.productName || i.name || '').toLowerCase().includes(q) || (i.categoryName || i.category || '').toLowerCase().includes(q)
      );
    }

    if (activeTab === 'inStock') {
      result = result.filter((i: any) => (i.stock ?? i.availableQuantity ?? i.quantity ?? 0) > 5);
    } else if (activeTab === 'lowStock') {
      result = result.filter((i: any) => (i.stock ?? i.availableQuantity ?? i.quantity ?? 0) > 0 && (i.stock ?? i.availableQuantity ?? i.quantity ?? 0) <= 5);
    } else if (activeTab === 'outOfStock') {
      result = result.filter((i: any) => (i.stock ?? i.availableQuantity ?? i.quantity ?? 0) === 0);
    }

    return result;
  }, [inventory, searchQuery, activeTab]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Hardware Inventory</Text>
        <TouchableOpacity style={styles.iconButton} onPress={() => setShowSearch(!showSearch)}>
          <SearchIcon width={20} height={20} stroke={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {showSearch && (
        <View style={styles.searchBarContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search products, category, SKU..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
        </View>
      )}

      {/* Tabs */}
      <View style={styles.tabsRow}>
        {tabs.map((tab) => {
          const isActive = tab.key === activeTab;
          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.tabItem}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {tab.label}
              </Text>
              {isActive && <View style={styles.tabIndicator} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Inventory List */}
      {loading && !refreshing ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.loadingText}>Fetching Store Inventory...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item: any) => String(item.id)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }: { item: any }) => {
            const qty = item.stock ?? item.availableQuantity ?? item.quantity ?? 0;
            const statusLabel = qty === 0 ? 'Out of Stock' : qty <= 5 ? 'Low Stock' : 'In Stock';
            const pillColor = qty === 0 ? colors.danger : qty <= 5 ? colors.warning : colors.success;

            return (
              <TouchableOpacity
                style={styles.productCard}
                onPress={() => navigation.navigate('ProductDetails', { productId: item.id } as any)}
              >
                <View style={styles.productImage}>
                  <WarehouseIcon width={24} height={24} stroke={colors.textMuted} />
                </View>
                <View style={{ flex: 1, marginLeft: spacing.md }}>
                  <Text style={styles.productName}>{item.name || item.productName || 'Hardware Part'}</Text>
                  <Text style={styles.productCategory}>{item.categoryName || item.category || 'Plumbing Supplies'}</Text>
                  <Text style={styles.productQty}>Available Stock: {qty} units</Text>
                </View>
                <View style={[styles.statusPill, { borderColor: pillColor }]}>
                  <Text style={[styles.statusPillText, { color: pillColor }]}>{statusLabel}</Text>
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📦</Text>
              <Text style={styles.emptyText}>No hardware products in this stock category.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background || '#F9F9F9' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.layout,
    paddingVertical: spacing.md,
    backgroundColor: colors.surfaceContainerLowest || '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.border || '#C6C5D4',
  },
  headerTitle: { fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surfaceContainerLow || '#F4F3F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBarContainer: {
    paddingHorizontal: spacing.layout,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surfaceContainerLowest || '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.border || '#C6C5D4',
  },
  searchInput: {
    backgroundColor: colors.surfaceContainerLow || '#F4F3F7',
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    fontSize: typography.fontSize.xs,
    color: colors.textPrimary,
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.layout,
    backgroundColor: colors.surfaceContainerLowest || '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.border || '#C6C5D4',
  },
  tabItem: { marginRight: 20, paddingVertical: spacing.xs },
  tabLabel: { fontSize: typography.fontSize.xs, color: colors.textMuted, fontWeight: '600' },
  tabLabelActive: { color: colors.primary, fontWeight: typography.fontWeight.bold },
  tabIndicator: {
    height: 2,
    backgroundColor: colors.primary,
    marginTop: 4,
    borderRadius: 2,
  },
  centerLoading: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.xs },
  loadingText: { fontSize: typography.fontSize.xs, color: colors.textSecondary },
  listContainer: { padding: spacing.layout, paddingBottom: spacing.giant },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLowest || '#FFFFFF',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border || '#C6C5D4',
    ...shadows.sm,
  },
  productImage: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surfaceContainerLow || '#F4F3F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productName: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
  productCategory: { fontSize: typography.fontSize.xs, color: colors.textMuted, marginTop: 2 },
  productQty: { fontSize: typography.fontSize.xs, color: colors.textSecondary, marginTop: 2 },
  statusPill: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  statusPillText: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.bold },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: spacing.giant },
  emptyIcon: { fontSize: 32, marginBottom: spacing.xs },
  emptyText: { fontSize: typography.fontSize.xs, color: colors.textMuted, textAlign: 'center' },
});
