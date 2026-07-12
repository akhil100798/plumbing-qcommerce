import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Alert,
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
import SuccessCheckIcon from '../../assets/icons/success-check.svg';
import ErrorWarningIcon from '../../assets/icons/error-warning.svg';

type Props = StackScreenProps<AppStackParamList, 'MaterialApprovalStatus'>;

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
        if (active) setStatusNotice('Material request id is missing. Submit a real material request before tracking approval.');
        return;
      }
      try {
        const status = await materialService.fetchMaterialStatus(productOrderId);
        setStatusNotice(null);
        dispatch(updateApprovalStatus(status));
      } catch (err: any) {
        console.warn('Error fetching material approval status:', err);
        if (active) {
          setStatusNotice(err?.message || 'Material approval status is not available in staging.');
        }
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 5000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [productOrderId, dispatch]);

  const handleTrackMaterial = () => {
    if (approvalStatus === 'APPROVED' || approvalStatus === 'DELIVERING' || approvalStatus === 'DELIVERED') {
      if (!productOrderId) {
        Alert.alert('Missing material request', 'Submit a real material request before tracking approval.');
        return;
      }
      navigation.navigate('MaterialTracking', { jobId, productOrderId });
      return;
    }

    Alert.alert(
      'Waiting on backend status',
      statusNotice || 'Customer approval has not been confirmed by the staging backend yet.'
    );
  };

  const isApproved = approvalStatus === 'APPROVED' || approvalStatus === 'DELIVERING' || approvalStatus === 'DELIVERED';

  return (
    <ScreenWrapper>
      <AppHeader title="Material Status" onBackPress={() => navigation.goBack()} />
      
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.statusBanner, isApproved ? styles.approvedBanner : styles.pendingBanner]}>
          <View style={{ marginRight: spacing.sm }}>
            {isApproved ? (
              <SuccessCheckIcon width={22} height={22} stroke={colors.success} />
            ) : (
              <ErrorWarningIcon width={22} height={22} stroke={colors.warning} />
            )}
          </View>
          <Text style={[styles.statusBannerText, isApproved && { color: colors.success }]}> 
            {isApproved ? 'Customer Approved' : 'Waiting for Customer Approval'}
          </Text>
        </View>

        {!!statusNotice && (
          <View style={styles.noticeCard}>
            <Text style={styles.noticeTitle}>Feature unavailable in staging</Text>
            <Text style={styles.noticeText}>{statusNotice}</Text>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.debugText}>Job ID: {jobId}{productOrderId ? ` ? Material Order ID: ${productOrderId}` : ''}</Text>
          <Text style={styles.sectionLabel}>Request Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Material Request</Text>
            <Text style={styles.summaryValue}>{`\u20B9`}{totalAmount}</Text>
          </View>
          <Text style={styles.subText}>{requestedMaterials.length} items requested on site.</Text>
          <View style={styles.divider} />
          <View style={styles.itemContainer}>
            {requestedMaterials.map((item) => (
              <View key={item.productId} style={styles.itemRow}>
                <Text style={styles.itemName}>
                  {item.name} <Text style={styles.itemQty}>x{item.quantity}</Text>
                </Text>
                <Text style={styles.itemPrice}>{`\u20B9`}{item.price * item.quantity}</Text>
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
            <Text style={styles.storeName}>Live delivery tracking is pending backend support</Text>
            <Text style={styles.storeDist}>Continue only when the backend reports delivery progress.</Text>
            <View style={styles.etaBox}>
              <Text style={styles.etaLabel}>Status:</Text>
              <Text style={styles.etaValue}>{approvalStatus}</Text>
            </View>
          </View>
        )}

        <View style={styles.spacer} />

        <PrimaryButton
          title={isApproved ? 'Track Material' : 'Waiting for Approval'}
          onPress={handleTrackMaterial}
          disabled={!isApproved}
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
  noticeCard: {
    backgroundColor: colors.surface,
    borderColor: colors.error,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  noticeTitle: {
    color: colors.error,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.xs,
  },
  noticeText: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.xs,
    lineHeight: 18,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  debugText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
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
