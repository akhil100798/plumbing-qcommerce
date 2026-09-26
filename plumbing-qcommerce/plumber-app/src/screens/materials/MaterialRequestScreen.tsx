import React, { useState, useEffect } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  View,
  Alert,
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

      Alert.alert(
        'Request Sent!',
        `Material request raised with ${storeName}. Waiting for store approval.`,
        [
          {
            text: 'Track Status',
            onPress: () =>
              navigation.replace('MaterialApprovalStatus', {
                jobId,
                productOrderId: response.id,
              }),
          },
        ]
      );
    } catch (error) {
      dispatch(setMaterialLoading(false));
      Alert.alert('Submission Failed', 'Could not create material request. Please try again.');
    }
  };

  return (
    <ScreenWrapper>
      <AppHeader
        title="Select Materials"
        subtitle={`From: ${storeName}`}
        onBackPress={() => navigation.goBack()}
      />

      <View style={styles.container}>
        <SearchInput value={query} onChangeText={setQuery} placeholder="Search inventory…" />

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
            showsVerticalScrollIndicator={false}
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
            title="Submit Request"
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
  container: {
    flex: 1,
    paddingHorizontal: spacing.layout,
    backgroundColor: colors.background,
  },
  emptyCard: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.md,
    marginTop: spacing.md,
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
    paddingBottom: 170,
    paddingTop: spacing.xs,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
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
