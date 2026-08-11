import { NavigationProp, useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import ArrowLeftIcon from '../../assets/icons/arrow-left.svg';
import WarehouseIcon from '../../assets/icons/warehouse.svg';
import { inventoryService } from '../../services/inventory/inventoryService';
import { borderRadius, colors, shadows, spacing, typography } from '../../theme';
import { Product } from '../../types';
import { AppStackParamList } from '../../types/navigation';

export function AddProductScreen() {
  const navigation = useNavigation<NavigationProp<AppStackParamList>>();
  const [catalogProducts, setCatalogProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [initialStock, setInitialStock] = useState('20');
  const [lowStockThreshold, setLowStockThreshold] = useState('5');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const products = await inventoryService.getCatalogProducts();
        setCatalogProducts(products);
        if (products.length > 0) {
          setSelectedProductId(products[0].id);
        }
      } catch {
        // fetch fallback
      } finally {
        setLoading(false);
      }
    };

    fetchCatalog();
  }, []);

  const handleAttachProduct = async () => {
    if (!selectedProductId) {
      Alert.alert('Selection Error', 'Please select a catalog product first.');
      return;
    }
    setSaving(true);
    try {
      await inventoryService.addCatalogProductToInventory(
        selectedProductId,
        Number(initialStock) || 10,
        Number(lowStockThreshold) || 5
      );
      Alert.alert(
        'Product Attached!',
        'Catalog product successfully added to your store inventory.',
        [{ text: 'View Inventory', onPress: () => navigation.navigate('Main', { screen: 'InventoryTab' } as any) }]
      );
    } catch (err: any) {
      Alert.alert('Failed to Add', err?.message || 'Could not attach product to store inventory.');
    } finally {
      setSaving(false);
    }
  };

  const filteredCatalog = catalogProducts.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.categoryName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            if (navigation.canGoBack()) navigation.goBack();
            else navigation.navigate('Main', { screen: 'InventoryTab' } as any);
          }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <ArrowLeftIcon width={24} height={24} stroke={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Attach Product to Inventory</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.loadingText}>Fetching Product Catalog...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
          <View style={styles.noticeCard}>
            <WarehouseIcon width={20} height={20} stroke={colors.primaryContainer || colors.primary} />
            <Text style={styles.noticeText}>
              Select an existing product from the global FixKart catalog to attach to your hardware store inventory.
            </Text>
          </View>

          {/* Search Filter */}
          <Text style={styles.fieldLabel}>Search Catalog</Text>
          <TextInput
            style={styles.input}
            placeholder="Search by product or category name..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />

          {/* Product Selection List */}
          <Text style={styles.fieldLabel}>Select Catalog Product *</Text>
          <View style={styles.catalogList}>
            {filteredCatalog.map((product) => {
              const isSelected = selectedProductId === product.id;
              return (
                <TouchableOpacity
                  key={product.id}
                  style={[styles.productOption, isSelected && styles.productOptionSelected]}
                  onPress={() => setSelectedProductId(product.id)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.productName, isSelected && styles.productNameSelected]}>
                      {product.name}
                    </Text>
                    <Text style={styles.productMeta}>
                      Category: {product.categoryName} | MRP: ₹{product.price}
                    </Text>
                  </View>
                  {isSelected && <Text style={styles.selectedBadge}>✓ Selected</Text>}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Stock Configuration Inputs */}
          <View style={styles.rowTwo}>
            <View style={styles.halfField}>
              <Text style={styles.fieldLabel}>Initial Stock Qty *</Text>
              <TextInput
                style={styles.input}
                value={initialStock}
                onChangeText={setInitialStock}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.halfField}>
              <Text style={styles.fieldLabel}>Low Stock Alert Threshold *</Text>
              <TextInput
                style={styles.input}
                value={lowStockThreshold}
                onChangeText={setLowStockThreshold}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Action CTA */}
          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={handleAttachProduct}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveBtnText}>Attach to Store Inventory</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background || '#F9F9F9' },
  centerLoading: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.xs },
  loadingText: { fontSize: typography.fontSize.xs, color: colors.textSecondary },
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
  scrollBody: { padding: spacing.layout, paddingBottom: spacing.giant },
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLow || '#F4F3F7',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: spacing.xs,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border || '#C6C5D4',
  },
  noticeText: { flex: 1, fontSize: 11, color: colors.textSecondary, lineHeight: 16 },
  fieldLabel: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.bold, color: colors.textPrimary, marginBottom: 4, marginTop: spacing.xs },
  input: {
    borderWidth: 1,
    borderColor: colors.border || '#C6C5D4',
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    fontSize: typography.fontSize.xs,
    color: colors.textPrimary,
    backgroundColor: colors.surfaceContainerLowest || '#FFFFFF',
    marginBottom: spacing.xs,
  },
  catalogList: { marginBottom: spacing.md },
  productOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border || '#C6C5D4',
    backgroundColor: colors.surfaceContainerLowest || '#FFFFFF',
    marginBottom: 6,
    ...shadows.sm,
  },
  productOptionSelected: {
    borderColor: colors.primaryContainer || colors.primary,
    backgroundColor: colors.surfaceContainerLow || '#F4F3F7',
  },
  productName: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
  productNameSelected: { color: colors.primaryContainer || colors.primary },
  productMeta: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  selectedBadge: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.bold, color: colors.primaryContainer || colors.primary },
  rowTwo: { flexDirection: 'row', gap: spacing.md },
  halfField: { flex: 1 },
  saveBtn: {
    backgroundColor: colors.primaryContainer || colors.primary,
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#FFFFFF', fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.bold },
});

export default AddProductScreen;
