import React, { useState, useEffect } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  View,
  Alert,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { useDispatch, useSelector } from 'react-redux';

import { AppHeader } from '../../components/common/AppHeader';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { ScreenWrapper } from '../../components/common/ScreenWrapper';
import { materialService } from '../../services/materials/materialService';
import { submitMaterialRequestSuccess, setMaterialLoading } from '../../redux/slices/materialSlice';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme';
import { AppStackParamList } from '../../types/navigation';
import { RootState } from '../../redux/store';
import { MaterialItem } from '../../types';
import { SvgMatPipeJoint, SvgMatPackageBox } from '../../assets/svg';

type Props = StackScreenProps<AppStackParamList, 'MaterialRequest'>;

export function MaterialRequestScreen({ route, navigation }: Props) {
  const dispatch = useDispatch();
  const { jobId = 'JOB-1024', storeId = 1, storeName = 'FixKart Hub - Indiranagar' } = (route as any)?.params || {};
  const { loading } = useSelector((state: RootState) => state.material);

  const [inventory, setInventory] = useState<MaterialItem[]>([]);
  const [draft, setDraft] = useState<{ [productId: number]: number }>({});
  const [note, setNote] = useState('');

  // Load store inventory on mount — real backend call
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

  const selectedItems = inventory.filter(item => (draft[item.productId] || 0) > 0);
  const totalCount = Object.values(draft).reduce((acc, qty) => acc + qty, 0);
  const totalAmount = selectedItems.reduce(
    (acc, item) => acc + item.price * (draft[item.productId] || 0),
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
    <ScreenWrapper safeAreaStyle={{ backgroundColor: colors.stitchBlue }}>
      <AppHeader
        title="Material Request"
        subtitle={`Store: ${storeName}`}
        variant="blue"
        onBackPress={() => navigation.goBack()}
      />

      <View style={styles.container}>
        <FlatList
          data={inventory}
          keyExtractor={item => String(item.productId)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No inventory available</Text>
              <Text style={styles.emptyText}>
                This store currently has no items in stock. Go back and select a different store.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const qty = draft[item.productId] || 0;
            return (
              <View style={styles.itemRow}>
                <View style={styles.itemLeft}>
                  <View style={styles.itemIconBox}>
                    <SvgMatPipeJoint width={22} height={22} stroke="#475569" fill="none" />
                  </View>
                  <View style={styles.itemDetails}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemPrice}>₹{item.price}</Text>
                  </View>
                </View>

                {/* Stitch Stepper Controller */}
                <View style={styles.stepper}>
                  <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() => handleDecrement(item.productId)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.stepperBtnText}>−</Text>
                  </TouchableOpacity>
                  <View style={styles.stepperValWrap}>
                    <Text style={styles.stepperVal}>{qty}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() => handleIncrement(item.productId)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.stepperBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
          ListFooterComponent={
            <View style={styles.footerSection}>
              {/* Stitch "Others (Please specify)" Card */}
              <View style={styles.othersRow}>
                <View style={styles.itemIconBox}>
                  <SvgMatPackageBox width={20} height={20} stroke="#64748B" fill="none" />
                </View>
                <View style={styles.othersContent}>
                  <Text style={styles.othersTitle}>
                    Others <Text style={styles.othersSub}>(Please specify)</Text>
                  </Text>
                  <TouchableOpacity activeOpacity={0.7}>
                    <Text style={styles.tapToAdd}>Tap to add</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Stitch "Add Note (Optional)" Field */}
              <View style={styles.noteContainer}>
                <Text style={styles.noteLabel}>
                  Add Note <Text style={styles.noteSub}>(Optional)</Text>
                </Text>
                <TextInput
                  style={styles.noteInput}
                  placeholder="Write note here..."
                  placeholderTextColor="#94A3B8"
                  value={note}
                  onChangeText={setNote}
                  multiline
                  numberOfLines={3}
                />
              </View>
            </View>
          }
        />

        {/* Stitch Bottom CTA Bar */}
        <View style={styles.footer}>
          {totalCount > 0 ? (
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>{totalCount} item{totalCount > 1 ? 's' : ''} selected</Text>
              <Text style={styles.totalsAmount}>₹{totalAmount.toFixed(2)}</Text>
            </View>
          ) : null}

          <PrimaryButton
            title="Submit Request"
            onPress={handleSubmit}
            loading={loading}
            variant="blue"
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
    backgroundColor: '#F8FAFC',
  },
  listContent: {
    padding: 16,
    paddingBottom: 24,
    gap: 12,
  },
  itemRow: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    ...shadows.sm,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  itemIconBox: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    lineHeight: 18,
  },
  itemPrice: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    overflow: 'hidden',
  },
  stepperBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#475569',
  },
  stepperValWrap: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  footerSection: {
    marginTop: 4,
    gap: 16,
  },
  othersRow: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    ...shadows.sm,
  },
  othersContent: {
    flex: 1,
  },
  othersTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  othersSub: {
    fontSize: 11,
    fontWeight: '400',
    color: '#94A3B8',
  },
  tapToAdd: {
    fontSize: 12,
    color: colors.stitchBlue,
    fontWeight: '600',
    marginTop: 2,
  },
  noteContainer: {
    marginTop: 4,
  },
  noteLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  noteSub: {
    fontWeight: '400',
    color: '#94A3B8',
  },
  noteInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    fontSize: 13,
    color: '#1E293B',
    minHeight: 72,
    textAlignVertical: 'top',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    marginTop: 16,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
  footer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
    ...shadows.md,
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  totalsLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  totalsAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
});
