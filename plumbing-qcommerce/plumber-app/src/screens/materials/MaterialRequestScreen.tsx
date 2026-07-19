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
  const routeJobId = route.params?.jobId;
  const { loading } = useSelector((state: RootState) => state.material);
  const activeJob = useSelector((state: RootState) => state.job.activeJob);

  const [query, setQuery] = useState('');
  const [catalog, setCatalog] = useState<MaterialItem[]>([]);
  const [draft, setDraft] = useState<{ [productId: number]: number }>({});

  const resolvedJobId = routeJobId || activeJob?.jobId || null;

  useEffect(() => {
    const fetchCatalog = async () => {
      const results = await materialService.searchMaterials(query);
      setCatalog(results);
    };
    fetchCatalog();
  }, [query]);

  const handleIncrement = (productId: number) => {
    setDraft((prev) => ({
      ...prev,
      [productId]: (prev[productId] || 0) + 1,
    }));
  };

  const handleDecrement = (productId: number) => {
    setDraft((prev) => {
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

  const selectedItems = catalog.filter((item) => draft[item.productId] > 0);
  const totalCount = Object.values(draft).reduce((acc, qty) => acc + qty, 0);
  const totalAmount = selectedItems.reduce(
    (acc, item) => acc + item.price * draft[item.productId],
    0
  );

  const handleSendToCustomer = async () => {
    if (!resolvedJobId) {
      Alert.alert('No active job', 'Open an active job first so materials are linked to the correct service order.');
      return;
    }

    const itemsPayload = selectedItems.map((item) => ({
      productId: item.productId,
      quantity: draft[item.productId],
    }));

    if (itemsPayload.length === 0) {
      Alert.alert('No items', 'Please select at least one material to request.');
      return;
    }

    dispatch(setMaterialLoading(true));
    try {
      const response = await materialService.createMaterialRequest(resolvedJobId, itemsPayload);
      const itemsWithQty = selectedItems.map((item) => ({
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
        'Material request raised. Waiting for customer approval.',
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.replace('MaterialApprovalStatus', {
                jobId: resolvedJobId,
                productOrderId: response.id,
              });
            },
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
      <AppHeader title="Request Material" onBackPress={() => navigation.goBack()} />
      
      <View style={styles.container}>
        <Text style={styles.debugText}>Job ID: {resolvedJobId ?? 'Unavailable'}</Text>
        {!resolvedJobId && (
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>No active service order selected</Text>
            <Text style={styles.infoText}>
              Return to the active job screen and open materials from that job so the request uses the real backend service order ID.
            </Text>
          </View>
        )}

        <SearchInput value={query} onChangeText={setQuery} />

        <FlatList
          data={catalog}
          keyExtractor={(item) => String(item.productId)}
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

        <View style={styles.footer}>
          <View style={styles.totalsRow}>
            <View>
              <Text style={styles.totalsLabel}>Total items</Text>
              <Text style={styles.totalsValue}>{totalCount}</Text>
            </View>
            <View style={styles.alignRight}>
              <Text style={styles.totalsLabel}>Total Amount</Text>
              <Text style={styles.totalPrice}>Rs {totalAmount}</Text>
            </View>
          </View>

          <PrimaryButton
            title="Send to Customer"
            onPress={handleSendToCustomer}
            loading={loading}
            style={styles.actionBtn}
            disabled={!resolvedJobId}
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
  debugText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  infoCard: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  infoTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  infoText: {
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
  alignRight: {
    alignItems: 'flex-end',
  },
  totalPrice: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.black,
    color: colors.primary,
    marginTop: 2,
  },
  actionBtn: {
    width: '100%',
  },
});
