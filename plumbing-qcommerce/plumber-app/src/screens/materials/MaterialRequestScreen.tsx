import React, { useState, useEffect } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  View,
  Alert,
  Platform,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { useDispatch, useSelector } from 'react-redux';

import { AppHeader } from '../../components/common/AppHeader';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { ScreenWrapper } from '../../components/common/ScreenWrapper';
import { SearchInput } from '../../components/forms/SearchInput';
import { MaterialCard } from '../../components/cards/MaterialCard';
import { materialService } from '../../services/materials/materialService';
import { submitMaterialRequestSuccess, setMaterialLoading } from '../../redux/slices/materialSlice';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { AppStackParamList } from '../../types/navigation';
import { RootState } from '../../redux/store';
import { MaterialItem } from '../../types';

type Props = StackScreenProps<AppStackParamList, 'MaterialRequest'>;

export function MaterialRequestScreen({ route, navigation }: Props) {
  const dispatch = useDispatch();
  const { jobId, storeId, storeName } = route.params;
  const { loading } = useSelector((state: RootState) => state.material);

  const [query, setQuery] = useState('');
  const [inventory, setInventory] = useState<MaterialItem[]>([]);
  const [draft, setDraft] = useState<{ [productId: number]: number }>({});

  // Load store inventory on mount — real backend call, no hardcoded IDs
  useEffect(() => {
    (async () => {
      try {
        const items = await materialService.getStoreInventory(storeId);
        setInventory(items);
      } catch {
        Alert.alert('Error', 'Failed to load store inventory. Go back and try again.');
      }
    })();
  }, [storeId]);

  const filtered = query.trim()
    ? inventory.filter(i => i.name.toLowerCase().includes(query.toLowerCase()))
    : inventory;

  const handleIncrement = (productId: number) => {
    setDraft(prev => ({ ...prev, [productId]: (prev[productId] || 0) + 1 }));
  };

  const handleDecrement = (productId: number) => {
    setDraft(prev => {
      const current = prev[productId] || 0;
      if (current <= 1) {
        const next = { ...prev };
        delete next[productId];
        return next;
      }
      return { ...prev, [productId]: current - 1 };
    });
  };

  const selectedItems = inventory.filter(item => draft[item.productId] > 0);
  const totalCount = Object.values(draft).reduce((acc, qty) => acc + qty, 0);
  const totalAmount = selectedItems.reduce(
    (acc, item) => acc + item.price * draft[item.productId],
    0
  );

  const handleSubmit = async () => {
    const itemsPayload = selectedItems.map(item => ({
      productId: item.productId,
      quantity: draft[item.productId],
    }));

    if (itemsPayload.length === 0) {
      Alert.alert('No items selected', 'Please select at least one material to request.');
      return;
    }

    dispatch(setMaterialLoading(true));
    try {
      const response = await materialService.createMaterialRequest(jobId, storeId, itemsPayload);
      const itemsWithQty = selectedItems.map(item => ({
        ...item,
        quantity: draft[item.productId],
      }));

      dispatch(
        submitMaterialRequestSuccess({
          items: itemsWithQty,
          totalAmount: response.totalAmount,
          orderId: response.id,
        })
      );

      navigation.replace('MaterialTracking', {
        jobId,
        productOrderId: response.id,
      });
    } catch (error) {
      dispatch(setMaterialLoading(false));
      Alert.alert('Submission Failed', 'Could not create material request. Please try again.');
    }
  };

  return (
    <ScreenWrapper safeAreaStyle={styles.safeArea}>
      <AppHeader
        title="Select Materials"
        subtitle={`From: ${storeName}`}
        onBackPress={() => navigation.goBack()}
      />

      <View style={styles.container}>
        <View style={styles.searchHeader}>
          <SearchInput value={query} onChangeText={setQuery} placeholder="Search inventory…" />
        </View>

        {filtered.length === 0 && !query ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No inventory available</Text>
            <Text style={styles.emptyText}>
              This store currently has no items in stock. Go back and select a different store.
            </Text>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={item => String(item.productId)}
            style={styles.flatList}
            renderItem={({ item }) => (
              <MaterialCard
                name={item.name}
                price={item.price}
                quantity={draft[item.productId] || 0}
                onIncrement={() => handleIncrement(item.productId)}
                onDecrement={() => handleDecrement(item.productId)}
              />
            )}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={true}
          />
        )}

        <View style={styles.footer}>
          <View style={styles.totalsRow}>
            <View>
              <Text style={styles.totalsLabel}>Items selected</Text>
              <Text style={styles.totalsValue}>{totalCount}</Text>
            </View>
            <View style={styles.alignRight}>
              <Text style={styles.totalsLabel}>Total Amount</Text>
              <Text style={styles.totalPrice}>₹{totalAmount.toFixed(2)}</Text>
            </View>
          </View>

          <PrimaryButton
            title={totalCount > 0 ? `Submit Material Request (${totalCount})` : 'Select Items to Submit'}
            onPress={handleSubmit}
            loading={loading}
            style={styles.actionBtn}
            disabled={totalCount === 0}
          />
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    height: Platform.OS === 'web' ? ('100vh' as any) : '100%',
    maxHeight: Platform.OS === 'web' ? ('100vh' as any) : '100%',
    overflow: 'hidden',
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
  searchHeader: {
    paddingHorizontal: spacing.layout,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
  },
  flatList: {
    flex: 1,
    width: '100%',
  },
  emptyCard: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.md,
    margin: spacing.layout,
  },
  emptyTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  emptyText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  listContent: {
    paddingHorizontal: spacing.layout,
    paddingBottom: spacing.lg,
    paddingTop: spacing.xs,
  },
  footer: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.md,
    paddingHorizontal: spacing.layout,
    borderWidth: 1.5,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 8,
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  totalsLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },
  totalsValue: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginTop: 2,
  },
  alignRight: { alignItems: 'flex-end' },
  totalPrice: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.black,
    color: colors.primary,
    marginTop: 2,
  },
  actionBtn: { width: '100%' },
});
