import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
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
import { SvgActionCheck, SvgMatPackageBox } from '../../assets/svg';
import ArrowRightIcon from '../../assets/icons/arrow-right.svg';

type Props = StackScreenProps<AppStackParamList, 'MaterialApprovalStatus'>;

const DEFAULT_APPROVED_ITEMS = [
  { id: 'elbow', label: 'PVC Elbow 1/2 inch', qty: 2 },
  { id: 'pipe', label: 'PVC Pipe 1/2 inch (3ft)', qty: 1 },
  { id: 'tape', label: 'Thread Seal Tape', qty: 1 },
];

const CONFETTI_DOTS = [
  { x: 20, y: 14, r: 4, color: '#F59E0B' },
  { x: 60, y: 8, r: 3, color: '#10B981' },
  { x: 100, y: 20, r: 5, color: '#EF4444' },
  { x: 150, y: 6, r: 3, color: '#3B82F6' },
  { x: 190, y: 16, r: 4, color: '#F59E0B' },
  { x: 230, y: 10, r: 3, color: '#10B981' },
  { x: 270, y: 18, r: 4, color: '#6366F1' },
  { x: 310, y: 8, r: 3, color: '#EC4899' },
];

export function MaterialApprovalStatusScreen({ route, navigation }: Props) {
  const dispatch = useDispatch();
  const { jobId = 'JOB-1024', productOrderId = 101 } = (route as any)?.params || {};
  const { requestedMaterials, totalAmount } = useSelector(
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
  const displayRequestId = productOrderId ? `MR${productOrderId}` : 'MR784512';

  const handleGoToTracking = () => {
    const targetOrderId = productOrderId || 784512;
    navigation.navigate('MaterialTracking', { jobId, productOrderId: targetOrderId });
  };

  return (
    <SafeAreaView style={styles.flex}>
      {/* Stitch Emerald Curved Header */}
      <View style={styles.headerCurve}>
        <AppHeader
          title="Material Approval Status"
          variant="green"
          onBackPress={() => navigation.goBack()}
        />

        <View style={styles.statusBadgeWrap}>
          <View style={styles.statusBadgeOuter}>
            <View style={styles.statusBadgeInner}>
              <SvgActionCheck width={24} height={24} fill="#059669" />
            </View>
          </View>
          <Text style={styles.statusBadgeTitle}>Request Approved</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {/* Stitch Main Detail Card */}
        <View style={styles.card}>
          <View style={styles.idRow}>
            <Text style={styles.idLabel}>Request ID</Text>
            <Text style={styles.idValue}>{displayRequestId}</Text>
          </View>

          <View style={styles.itemsSection}>
            <Text style={styles.sectionHeading}>APPROVED ITEMS</Text>
            {itemsToDisplay.map((item, idx) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.itemRow,
                  idx < itemsToDisplay.length - 1 && styles.itemRowBorder,
                ]}
                onPress={handleGoToTracking}
                activeOpacity={0.7}
              >
                <Text style={styles.itemName}>{item.label}</Text>
                <View style={styles.itemRight}>
                  <Text style={styles.itemQty}>x{item.qty}</Text>
                  <ArrowRightIcon width={12} height={12} stroke="#94A3B8" />
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.estimateRow}>
            <Text style={styles.estimateLabel}>Estimated Amount</Text>
            <Text style={styles.estimateValue}>₹{displayAmount}</Text>
          </View>
        </View>

        {/* Stitch Store Pickup Status Banner */}
        <TouchableOpacity
          style={styles.noticeBanner}
          onPress={handleGoToTracking}
          activeOpacity={0.8}
        >
          <View style={styles.noticeIconBox}>
            <SvgMatPackageBox width={16} height={16} stroke="#D97706" fill="none" />
          </View>
          <Text style={styles.noticeText}>Material ready for store pickup.</Text>
          <ArrowRightIcon width={14} height={14} stroke="#B45309" />
        </TouchableOpacity>

        {/* Celebratory Confetti Accents */}
        <View style={styles.confettiArea}>
          <Svg width="100%" height="40" viewBox="0 0 340 40">
            {CONFETTI_DOTS.map((d, i) => (
              <Circle key={i} cx={d.x} cy={d.y} r={d.r} fill={d.color} opacity={0.6} />
            ))}
            <Rect x="40" y="28" width="8" height="3" rx="1.5" fill="#EF4444" opacity={0.5} transform="rotate(25, 44, 29)" />
            <Rect x="200" y="24" width="8" height="3" rx="1.5" fill="#10B981" opacity={0.5} transform="rotate(-15, 204, 25)" />
            <Rect x="300" y="26" width="9" height="3" rx="1.5" fill="#3B82F6" opacity={0.4} transform="rotate(35, 304, 27)" />
          </Svg>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerCurve: {
    backgroundColor: colors.stitchGreen,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    paddingBottom: 28,
    ...shadows.md,
  },
  statusBadgeWrap: {
    alignItems: 'center',
    marginTop: 8,
  },
  statusBadgeOuter: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  statusBadgeInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  statusBadgeTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 10,
    letterSpacing: 0.3,
  },
  body: {
    padding: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    ...shadows.md,
  },
  idRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  idLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  idValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    letterSpacing: 0.5,
  },
  itemsSection: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  itemRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  itemName: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '600',
    flex: 1,
  },
  itemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  itemQty: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  estimateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 14,
  },
  estimateLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  estimateValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  noticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: 14,
    padding: 14,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
    gap: 10,
  },
  noticeIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noticeText: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '600',
    flex: 1,
  },
  confettiArea: {
    marginTop: 24,
    alignItems: 'center',
  },
});
