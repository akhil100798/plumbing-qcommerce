import React, { useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { useDispatch, useSelector } from 'react-redux';

import { AppHeader } from '../../components/common/AppHeader';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { ScreenWrapper } from '../../components/common/ScreenWrapper';
import { StatusChip } from '../../components/common/StatusChip';
import { materialService } from '../../services/materials/materialService';
import { updateApprovalStatus } from '../../redux/slices/materialSlice';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { AppStackParamList } from '../../types/navigation';
import { RootState } from '../../redux/store';

type Props = StackScreenProps<AppStackParamList, 'MaterialApprovalStatus'>;

export function MaterialApprovalStatusScreen({ route, navigation }: Props) {
  const dispatch = useDispatch();
  const { jobId, productOrderId } = route.params;
  const { requestedMaterials, totalAmount, approvalStatus } = useSelector(
    (state: RootState) => state.material
  );

  const cleanOrderId = productOrderId || 1;

  // Poll status from backend
  useEffect(() => {
    let active = true;
    
    const checkStatus = async () => {
      if (!active) return;
      try {
        const status = await materialService.fetchMaterialStatus(cleanOrderId);
        // If status changed to DELIVERING / APPROVED
        if (status === 'DELIVERING' || status === 'DELIVERED') {
          dispatch(updateApprovalStatus(status));
        } else if (approvalStatus === null) {
          dispatch(updateApprovalStatus('PENDING_APPROVAL'));
        }
      } catch (err) {
        console.warn('Error fetching material approval status:', err);
      }
    };

    // Check status immediately and every 5 seconds
    checkStatus();
    const interval = setInterval(checkStatus, 5000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [cleanOrderId, approvalStatus, dispatch]);

  const handleTrackMaterial = () => {
    // If not approved, show a prompt or mock approval first for testing
    if (approvalStatus === 'PENDING_APPROVAL') {
      // Simulate quick approval for demo/testing convenience
      dispatch(updateApprovalStatus('DELIVERING'));
      navigation.navigate('MaterialTracking', { jobId, productOrderId: cleanOrderId });
    } else {
      navigation.navigate('MaterialTracking', { jobId, productOrderId: cleanOrderId });
    }
  };

  const isApproved = approvalStatus !== 'PENDING_APPROVAL';

  return (
    <ScreenWrapper>
      <AppHeader title="Material Status" onBackPress={() => navigation.goBack()} />
      
      <ScrollView contentContainerStyle={styles.content}>
        {/* Top Status Banner */}
        <View style={[styles.statusBanner, isApproved ? styles.approvedBanner : styles.pendingBanner]}>
          <Text style={[styles.statusBannerIcon, isApproved && { color: colors.success }]}>
            {isApproved ? '✅' : '⏳'}
          </Text>
          <Text style={[styles.statusBannerText, isApproved && { color: colors.success }]}>
            {isApproved ? 'Customer Approved' : 'Waiting for Customer Approval'}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Request Summary</Text>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Material Request</Text>
            <Text style={styles.summaryValue}>₹{totalAmount}</Text>
          </View>
          
          <Text style={styles.subText}>
            {requestedMaterials.length} items requested on site.
          </Text>

          <View style={styles.divider} />

          <View style={styles.itemContainer}>
            {requestedMaterials.map((item) => (
              <View key={item.productId} style={styles.itemRow}>
                <Text style={styles.itemName}>
                  {item.name} <Text style={styles.itemQty}>x{item.quantity}</Text>
                </Text>
                <Text style={styles.itemPrice}>₹{item.price * item.quantity}</Text>
              </View>
            ))}
          </View>

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text style={styles.paymentLabel}>Payment Status</Text>
            <StatusChip
              label={isApproved ? 'Paid Online' : 'Unpaid'}
              type={isApproved ? 'success' : 'warning'}
            />
          </View>
        </View>

        {isApproved && (
          <View style={styles.storeCard}>
            <Text style={styles.sectionLabel}>Store & Dispatch</Text>
            <Text style={styles.storeName}>Sai Pipes & Fittings</Text>
            <Text style={styles.storeDist}>1.2 km away</Text>
            <View style={styles.etaBox}>
              <Text style={styles.etaLabel}>Delivery ETA:</Text>
              <Text style={styles.etaValue}>15 - 20 mins</Text>
            </View>
          </View>
        )}

        <View style={styles.spacer} />

        <PrimaryButton
          title={isApproved ? 'Track Material' : 'Simulate Approval & Track'}
          onPress={handleTrackMaterial}
          style={styles.actionBtn}
        />
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.layout,
    paddingBottom: spacing.huge,
    flexGrow: 1,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
    borderWidth: 1.5,
  },
  pendingBanner: {
    backgroundColor: colors.warningLight,
    borderColor: colors.warning,
  },
  approvedBanner: {
    backgroundColor: colors.successLight,
    borderColor: colors.success,
  },
  statusBannerIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
    color: colors.warning,
  },
  statusBannerText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.black,
    color: colors.warning,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    textTransform: 'uppercase',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  summaryValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.black,
    color: colors.primary,
  },
  subText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 4,
    fontWeight: typography.fontWeight.medium,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  itemContainer: {
    gap: spacing.sm,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemName: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  itemQty: {
    color: colors.textSecondary,
    fontWeight: 'bold',
  },
  itemPrice: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  paymentLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.textSecondary,
  },
  storeCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xl,
  },
  storeName: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  storeDist: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
    marginTop: 2,
  },
  etaBox: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  etaLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },
  etaValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.success,
  },
  spacer: {
    flex: 1,
  },
  actionBtn: {
    marginTop: 'auto',
  },
});
