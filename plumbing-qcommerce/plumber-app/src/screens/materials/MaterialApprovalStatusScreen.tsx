import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { useDispatch, useSelector } from 'react-redux';
import Svg, { Circle, Rect } from 'react-native-svg';

import { AppHeader } from '../../components/common/AppHeader';
import { materialService } from '../../services/materials/materialService';
import { updateApprovalStatus } from '../../redux/slices/materialSlice';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme';
import { AppStackParamList } from '../../types/navigation';
import { RootState } from '../../redux/store';
import CheckIcon from '../../assets/icons/success-check.svg';
import ClockIcon from '../../assets/icons/clock.svg';
import ArrowRightIcon from '../../assets/icons/arrow-right.svg';

type Props = StackScreenProps<AppStackParamList, 'MaterialApprovalStatus'>;

const DEFAULT_APPROVED_ITEMS = [
  { id: 'elbow', label: 'PVC Elbow 1/2 Inch', qty: 2 },
  { id: 'pipe', label: 'PVC Pipe 1/2 Inch (3m)', qty: 1 },
  { id: 'tape', label: 'Thread Seal Tape', qty: 1 },
];

const CONFETTI_DOTS = [
  { x: 20, y: 10, r: 4, color: colors.warning },
  { x: 60, y: 4, r: 3, color: colors.success },
  { x: 100, y: 16, r: 5, color: colors.error },
  { x: 150, y: 2, r: 3, color: colors.primary },
  { x: 190, y: 12, r: 4, color: colors.warning },
  { x: 230, y: 6, r: 3, color: colors.success },
  { x: 270, y: 14, r: 4, color: colors.primary },
  { x: 310, y: 4, r: 3, color: colors.error },
];

export function MaterialApprovalStatusScreen({ route, navigation }: Props) {
  const dispatch = useDispatch();
  const { jobId, productOrderId } = route.params;
  const { requestedMaterials, totalAmount, approvalStatus } = useSelector(
    (state: RootState) => state.material
  );
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const checkStatus = async () => {
      if (!active || !productOrderId) {
        return;
      }
      try {
        const status = await materialService.fetchMaterialStatus(productOrderId);
        setStatusNotice(null);
        dispatch(updateApprovalStatus(status));
      } catch (err: any) {
        console.warn('Error fetching material status:', err);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 5000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [productOrderId, dispatch]);

  const itemsToDisplay = requestedMaterials.length > 0
    ? requestedMaterials.map((m) => ({ id: String(m.productId), label: m.name, qty: m.quantity }))
    : DEFAULT_APPROVED_ITEMS;

  const displayAmount = totalAmount > 0 ? totalAmount : 210;
  const displayRequestId = productOrderId ? `MR${productOrderId}` : 'MR764512';

  const handleGoToTracking = () => {
    const targetOrderId = productOrderId || 764512;
    navigation.navigate('MaterialTracking', { jobId, productOrderId: targetOrderId });
  };

  return (
    <SafeAreaView style={styles.flex}>
      <AppHeader
        title="Material Status"
        onBackPress={() => navigation.goBack()}
      />

      <View style={styles.successBanner}>
        <View style={styles.checkCircle}>
          <CheckIcon width={30} height={30} stroke={colors.success} />
        </View>
        <Text style={styles.successTitle}>Request Approved</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.row}>
          <Text style={styles.muted}>Request ID</Text>
          <Text style={styles.value}>{displayRequestId}</Text>
        </View>

        <Text style={styles.sectionTitle}>Approved Items</Text>
        <View style={styles.card}>
          {itemsToDisplay.map((item, idx) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.itemRow,
                idx < itemsToDisplay.length - 1 && styles.itemRowDivider,
              ]}
              onPress={handleGoToTracking}
            >
              <Text style={styles.itemLabel}>{item.label}</Text>
              <View style={styles.itemRight}>
                <Text style={styles.itemQty}>x{item.qty}</Text>
                <ArrowRightIcon width={14} height={14} stroke={colors.textMuted} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.row}>
          <Text style={styles.muted}>Estimated Amount</Text>
          <Text style={styles.amount}>₹{displayAmount}</Text>
        </View>

        <TouchableOpacity
          style={styles.noticeRow}
          onPress={handleGoToTracking}
        >
          <ClockIcon width={16} height={16} stroke={colors.warning} />
          <Text style={styles.noticeText}>Material will be delivered soon.</Text>
          <ArrowRightIcon width={14} height={14} stroke={colors.textMuted} />
        </TouchableOpacity>

        <View style={styles.confettiWrap}>
          <Svg width="100%" height="30" viewBox="0 0 340 30">
            {CONFETTI_DOTS.map((d, i) => (
              <Circle key={i} cx={d.x} cy={d.y} r={d.r} fill={d.color} />
            ))}
            <Rect x="0" y="24" width="6" height="2" fill={colors.textMuted} />
          </Svg>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  successBanner: {
    backgroundColor: colors.success,
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  checkCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  successTitle: { fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.black, color: '#FFFFFF' },
  body: { padding: spacing.lg, paddingBottom: spacing.giant },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  muted: { fontSize: typography.fontSize.sm, color: colors.textSecondary },
  value: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
  amount: { fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.black, color: colors.textPrimary },
  sectionTitle: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.bold, color: colors.textPrimary, marginBottom: spacing.xs },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
  },
  itemRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemLabel: { fontSize: typography.fontSize.sm, color: colors.textPrimary, flex: 1 },
  itemRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  itemQty: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.bold, color: colors.textSecondary, marginRight: spacing.xs },
  noticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  noticeText: { fontSize: typography.fontSize.xs, color: colors.textSecondary, flex: 1, marginLeft: spacing.xs },
  confettiWrap: { marginTop: spacing.xl, alignItems: 'center' },
});
