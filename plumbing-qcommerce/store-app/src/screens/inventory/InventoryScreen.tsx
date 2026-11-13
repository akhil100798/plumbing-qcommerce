import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
} from 'react-native';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { AppStackParamList } from '../../types/navigation';
import { StoreIcon } from '../../components/common/StoreIcon';
import { colors, borderRadius, spacing, typography } from '../../theme';

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  qty: number;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
  icon: 'pvc-elbow' | 'brass-valve' | 'cpvc-pipe' | 'thread-tape' | 'plumbing-fitting';
  price: string;
}

const mockProducts: InventoryItem[] = [
  {
    id: '1',
    name: 'PVC Elbow 1/2 Inch',
    category: 'Plumbing fittings',
    qty: 5,
    status: 'Low Stock',
    icon: 'pvc-elbow',
    price: '₹12.00',
  },
  {
    id: '2',
    name: 'Brass Angle Valve 1/2 Inch',
    category: 'Plumbing fittings',
    qty: 3,
    status: 'Low Stock',
    icon: 'brass-valve',
    price: '₹185.00',
  },
  {
    id: '3',
    name: 'CPVC Pipe 1/2 Inch (3m)',
    category: 'Plumbing fittings',
    qty: 6,
    status: 'Low Stock',
    icon: 'cpvc-pipe',
    price: '₹240.00',
  },
  {
    id: '4',
    name: 'PTFE Thread Tape (10m)',
    category: 'Plumbing fittings',
    qty: 5,
    status: 'Low Stock',
    icon: 'thread-tape',
    price: '₹25.00',
  },
  {
    id: '5',
    name: 'PVC Ball Valve 1 Inch',
    category: 'Valves & Controls',
    qty: 28,
    status: 'In Stock',
    icon: 'brass-valve',
    price: '₹120.00',
  },
  {
    id: '6',
    name: 'CPVC Coupler 1/2 Inch',
    category: 'Plumbing fittings',
    qty: 45,
    status: 'In Stock',
    icon: 'plumbing-fitting',
    price: '₹18.00',
  },
];

type FilterTabKey = 'all' | 'inStock' | 'lowStock' | 'outOfStock';

export function InventoryScreen() {
  const navigation = useNavigation<NavigationProp<AppStackParamList>>();
  const [activeTab, setActiveTab] = useState<FilterTabKey>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const lowStockCount = mockProducts.filter((p) => p.status === 'Low Stock').length;

  const tabs: { key: FilterTabKey; label: string; count?: number }[] = [
    { key: 'all', label: 'All' },
    { key: 'inStock', label: 'In Stock' },
    { key: 'lowStock', label: `Low Stock (${lowStockCount})` },
    { key: 'outOfStock', label: 'Out of Stock' },
  ];

  const filteredProducts = mockProducts.filter((item) => {
    const matchesTab =
      activeTab === 'all'
        ? true
        : activeTab === 'inStock'
        ? item.status === 'In Stock'
        : activeTab === 'lowStock'
        ? item.status === 'Low Stock'
        : item.status === 'Out of Stock';

    const matchesSearch =
      searchQuery.trim().length === 0 ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesTab && matchesSearch;
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

      {/* Top Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Inventory</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setShowSearch(!showSearch)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <StoreIcon name="search" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.navigate('LowStockAlert')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <StoreIcon name="filter" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar (Expandable) */}
      {showSearch && (
        <View style={styles.searchBarContainer}>
          <StoreIcon name="search" size={16} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search items by name or category..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <StoreIcon name="close" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Filter Tabs */}
      <View style={styles.tabsContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={tabs}
          keyExtractor={(tab) => tab.key}
          contentContainerStyle={styles.tabsRow}
          renderItem={({ item: tab }) => {
            const isActive = tab.key === activeTab;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tabChip, isActive && styles.tabChipActive]}
                onPress={() => setActiveTab(tab.key)}
              >
                <Text style={[styles.tabChipText, isActive && styles.tabChipTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Inventory Product List */}
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const isLow = item.status === 'Low Stock';
          return (
            <TouchableOpacity
              testID={`store-product-card-${item.id}`}
              style={styles.productCard}
              onPress={() => navigation.navigate('ProductDetails', { productId: item.id } as any)}
              activeOpacity={0.7}
            >
              {/* Product Thumbnail */}
              <View style={[styles.productThumb, isLow && styles.productThumbLow]}>
                <StoreIcon name={item.icon} size={28} color={isLow ? colors.warning : colors.primary} />
              </View>

              {/* Product Info */}
              <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.productCategory}>{item.category}</Text>
                <View style={styles.qtyPriceRow}>
                  <Text style={styles.productQty}>Qty: {item.qty}</Text>
                  <Text style={styles.productPrice}>{item.price}</Text>
                </View>
              </View>

              {/* Stock Status Pill */}
              <View
                style={[
                  styles.statusBadge,
                  isLow ? styles.statusBadgeLow : styles.statusBadgeNormal,
                ]}
              >
                <Text
                  style={[
                    styles.statusBadgeText,
                    isLow ? styles.statusBadgeTextLow : styles.statusBadgeTextNormal,
                  ]}
                >
                  {item.status}
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <StoreIcon name="inventory" size={40} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No products found</Text>
            <Text style={styles.emptySubtitle}>Try adjusting your filter or search query</Text>
          </View>
        }
        ListFooterComponent={
          activeTab === 'lowStock' || activeTab === 'all' ? (
            <TouchableOpacity
              style={styles.reorderBanner}
              onPress={() => navigation.navigate('LowStockAlert')}
            >
              <View style={styles.reorderBannerContent}>
                <StoreIcon name="warning" size={18} color={colors.error} />
                <Text style={styles.reorderBannerText}>
                  {lowStockCount} items require reordering
                </Text>
              </View>
              <StoreIcon name="arrow-right" size={16} color={colors.error} />
            </TouchableOpacity>
          ) : null
        }
      />

      {/* Floating Action Button (Add Product) */}
      <TouchableOpacity
        testID="store-add-product-fab"
        style={styles.fab}
        onPress={() => navigation.navigate('AddProduct')}
        activeOpacity={0.85}
      >
        <StoreIcon name="plus" size={24} color={colors.surface} />
      </TouchableOpacity>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.surface,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.xl,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    height: 40,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
  },
  tabsContainer: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.sm,
  },
  tabsRow: {
    paddingHorizontal: spacing.xl,
    gap: 8,
  },
  tabChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: borderRadius.round,
    backgroundColor: colors.background,
  },
  tabChipActive: {
    backgroundColor: colors.primary,
  },
  tabChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabChipTextActive: {
    color: colors.surface,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: 96,
  },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  productThumb: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.md,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  productThumbLow: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FEE2E2',
  },
  productInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  productName: {
    fontSize: 14,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  productCategory: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  qtyPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 12,
  },
  productQty: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  productPrice: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  statusBadge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: borderRadius.round,
  },
  statusBadgeNormal: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  statusBadgeLow: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusBadgeTextNormal: {
    color: '#059669',
  },
  statusBadgeTextLow: {
    color: colors.error,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl * 2,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
  reorderBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  reorderBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reorderBannerText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.error,
  },
  fab: {
    position: 'absolute',
    right: spacing.xl,
    bottom: 24,
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
});

export default InventoryScreen;
