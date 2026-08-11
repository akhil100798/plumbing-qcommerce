import { StackScreenProps } from '@react-navigation/stack';
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
import { storeService } from '../../services/store/storeService';
import { borderRadius, colors, shadows, spacing, typography } from '../../theme';
import { InventoryItem } from '../../types';
import { AppStackParamList } from '../../types/navigation';

type Props = StackScreenProps<AppStackParamList, 'ProductDetails'>;

export function ProductDetailsScreen({ route, navigation }: Props) {
  const productId = (route.params as any)?.productId;
  const [item, setItem] = useState<InventoryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [newStock, setNewStock] = useState('');

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const inventory = await inventoryService.getStoreInventory();
        const found = inventory.find((i) => String(i.id) === String(productId));
        if (found) {
          setItem(found);
          setNewStock(String(found.availableQuantity ?? found.quantity ?? 0));
        }
      } catch {
        // detail fetch fail
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [productId]);

  const handleUpdateStock = async () => {
    const qty = Number(newStock);
    if (!Number.isInteger(qty) || qty < 0) {
      Alert.alert('Invalid Stock Quantity', 'Stock quantity must be a non-negative whole integer (0 or greater).');
      return;
    }

    setUpdating(true);
    try {
      const currentStore = await storeService.getCurrentStoreProfile();
      await inventoryService.updateStock(currentStore.id, Number(productId), qty);
      setItem((prev) => (prev ? { ...prev, availableQuantity: qty, quantity: qty } : null));
      setShowEdit(false);
      Alert.alert('Stock Updated!', `Inventory quantity updated to ${qty} units.`);
    } catch (err: any) {
      Alert.alert('Stock Update Failed', err?.message || 'Unable to update stock quantity. Please retry.');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerLoading}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.loadingText}>Fetching Product Inventory...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentQty = item?.availableQuantity ?? item?.quantity ?? 0;
  const statusLabel = currentQty === 0 ? 'Out of Stock' : currentQty <= 5 ? 'Low Stock' : 'In Stock';
  const pillColor = currentQty === 0 ? colors.danger : currentQty <= 5 ? colors.warning : colors.success;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            if (navigation.canGoBack()) navigation.goBack();
            else navigation.navigate('Main', { screen: 'InventoryTab' });
          }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <ArrowLeftIcon width={24} height={24} stroke={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Product Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
        {/* Product summary card */}
        <View style={styles.summaryCard}>
          <View style={styles.productImage}>
            <WarehouseIcon width={40} height={40} stroke={colors.textMuted} />
          </View>
          <View style={{ flex: 1, marginLeft: spacing.md }}>
            <Text style={styles.productName}>{item?.productName || item?.name || 'Hardware Part'}</Text>
            <Text style={styles.productCategory}>{item?.category || 'Plumbing Supplies'}</Text>
            <View style={[styles.inStockPill, { borderColor: pillColor }]}>
              <Text style={[styles.inStockPillText, { color: pillColor }]}>{statusLabel}</Text>
            </View>
            <Text style={styles.price}>₹{item?.price || 49.00}</Text>
            <Text style={styles.priceNote}>Store List Price (Incl. GST)</Text>
          </View>
        </View>

        {/* Specs card */}
        <View style={styles.specsCard}>
          <View style={styles.specRow}>
            <Text style={styles.specLabel}>Product ID</Text>
            <Text style={styles.specValue}>#{item?.id || productId}</Text>
          </View>
          <View style={styles.specRow}>
            <Text style={styles.specLabel}>Category</Text>
            <Text style={styles.specValue}>{item?.category || 'Hardware'}</Text>
          </View>
          <View style={styles.specRow}>
            <Text style={styles.specLabel}>Available Stock</Text>
            <Text style={[styles.specValue, { color: pillColor }]}>{currentQty} Units</Text>
          </View>
          <View style={styles.specRow}>
            <Text style={styles.specLabel}>Reserved Stock</Text>
            <Text style={styles.specValue}>{item?.reservedQuantity || 0} Units</Text>
          </View>
        </View>

        {/* Stock Update Form Card */}
        {showEdit && (
          <View style={styles.editCard}>
            <Text style={styles.editTitle}>Update Stock Quantity</Text>
            <TextInput
              style={styles.input}
              value={newStock}
              onChangeText={setNewStock}
              placeholder="Enter available stock quantity (e.g. 25)"
              keyboardType="number-pad"
            />
            <TouchableOpacity style={styles.saveBtn} onPress={handleUpdateStock} disabled={updating}>
              <Text style={styles.saveBtnText}>
                {updating ? 'Updating Stock...' : 'Save Updated Stock'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.solidButton}
          onPress={() => setShowEdit(!showEdit)}
        >
          <Text style={styles.solidButtonText}>{showEdit ? 'Cancel Edit' : 'Update Stock Quantity'}</Text>
        </TouchableOpacity>
      </View>
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
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceContainerLowest || '#FFFFFF',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border || '#C6C5D4',
    ...shadows.sm,
  },
  productImage: {
    width: 72,
    height: 72,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surfaceContainerLow || '#F4F3F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productName: { fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
  productCategory: { fontSize: typography.fontSize.xs, color: colors.textMuted, marginTop: 2, marginBottom: 4 },
  inStockPill: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    marginBottom: 6,
  },
  inStockPillText: { fontSize: 10, fontWeight: '700' },
  price: { fontSize: 18, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
  priceNote: { fontSize: typography.fontSize.xs, color: colors.textMuted, marginTop: 1 },
  specsCard: {
    backgroundColor: colors.surfaceContainerLowest || '#FFFFFF',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border || '#C6C5D4',
    ...shadows.sm,
    marginBottom: spacing.md,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceContainerLow || '#F4F3F7',
  },
  specLabel: { fontSize: typography.fontSize.xs, color: colors.textSecondary },
  specValue: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
  editCard: {
    backgroundColor: colors.surfaceContainerLowest || '#FFFFFF',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border || '#C6C5D4',
    ...shadows.sm,
    gap: spacing.xs,
  },
  editTitle: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
  input: {
    borderWidth: 1,
    borderColor: colors.border || '#C6C5D4',
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    fontSize: typography.fontSize.xs,
    color: colors.textPrimary,
  },
  saveBtn: {
    backgroundColor: colors.primaryContainer || colors.primary,
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  saveBtnText: { color: '#FFFFFF', fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.bold },
  bottomBar: {
    padding: spacing.md,
    backgroundColor: colors.surfaceContainerLowest || '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: colors.border || '#C6C5D4',
  },
  solidButton: {
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primaryContainer || colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  solidButtonText: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.bold, color: '#FFFFFF' },
});
