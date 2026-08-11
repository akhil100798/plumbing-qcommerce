import { StackScreenProps } from '@react-navigation/stack';
import React, { useState, useEffect } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { MaterialCard } from '../components/cards/MaterialCard';
import { PrimaryButton } from '../components/common/PrimaryButton';
import { SecondaryButton } from '../components/common/SecondaryButton';
import { canUseDevMockFallbacks, warnUsingDevMockFallback } from '../services/mockPolicy';
import { OrderRepository } from '../services/orders/orderRepository';
import { CartRepository } from '../services/cart/cartRepository';
import { borderRadius, colors, spacing, typography } from '../theme';
import { AppStackParamList } from '../types/navigation';
type Props = StackScreenProps<AppStackParamList, 'MaterialApproval'>;
const mockMaterials = [
  { name: 'CPVC Pipe 1 Inch (3 meters)', qty: 2, price: 180 },
  { name: 'L-Bow Joint 1 Inch', qty: 3, price: 45 },
  { name: 'Solvent Cement Glue 100ml', qty: 1, price: 120 },
];
export function MaterialApprovalScreen({ route, navigation }: Props) {
  const { serviceOrderId, plumberName } = route.params;
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<{ name: string; qty: number; price: number }[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [productOrderId, setProductOrderId] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const mockFallbackEnabled = canUseDevMockFallbacks();
  useEffect(() => {
    async function loadMaterialRequest() {
      setLoading(true);
      setErrorMsg(null);
      try {
        const requests = await OrderRepository.getCustomerMaterialRequests();
        const activeReq = requests.find(
          (req: any) => String(req.serviceOrderId) === String(serviceOrderId)
        );
        if (activeReq) {
          if (activeReq.status === 'REJECTED') {
            setErrorMsg('Selected hardware store was unable to fulfill this material request. Your plumber will select an alternative store.');
          } else {
            setProductOrderId(activeReq.id);
            setTotal(Number(activeReq.totalAmount));
            const mappedItems = (activeReq.items || []).map((i: any) => ({
              name: i.productName,
              qty: i.quantity,
              price: Number(i.price),
            }));
            setItems(mappedItems);
          }
        } else {
          setErrorMsg('No pending material requests found for this service order.');
        }
      } catch (err: any) {
        console.error('Failed to fetch material requests:', err);
        setErrorMsg('Failed to load material requests from the server.');
      } finally {
        setLoading(false);
      }
    }
    if (!mockFallbackEnabled) {
      loadMaterialRequest();
    } else {
      setItems(mockMaterials);
      setTotal(mockMaterials.reduce((sum, item) => sum + item.price * item.qty, 0));
    }
  }, [serviceOrderId, mockFallbackEnabled]);
  const handleDecline = async () => {
    if (mockFallbackEnabled) {
      warnUsingDevMockFallback('Material approval decline', new Error(String(serviceOrderId)));
      Alert.alert('Material request declined', 'Plumber will be notified.');
      navigation.goBack();
      return;
    }
    if (!productOrderId) {
      Alert.alert('Error', 'No active material request found.');
      return;
    }
    setLoading(true);
    try {
      await CartRepository.releaseReservation(productOrderId);
      Alert.alert('Material request declined', 'Reservation has been released successfully.');
      navigation.goBack();
    } catch (err: any) {
      console.error('Failed to decline material request:', err);
      Alert.alert('Error', 'Failed to decline material request. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  const handleApproveAndPay = async () => {
    if (mockFallbackEnabled) {
      setLoading(true);
      warnUsingDevMockFallback('Material approval payment', new Error(String(serviceOrderId)));
      setTimeout(() => {
        setLoading(false);
        navigation.replace('ServiceCompletion', {
          plumberName: plumberName,
        });
      }, 1500);
      return;
    }
    if (!productOrderId) {
      Alert.alert('Error', 'No active material request found.');
      return;
    }
    setLoading(true);
    try {
      await CartRepository.confirmPayment(productOrderId);
      Alert.alert('Success', 'Payment confirmed! Materials will be delivered to your site shortly.', [
        {
          text: 'OK',
          onPress: () => {
            navigation.replace('ServiceCompletion', {
              plumberName: plumberName,
            });
          },
        },
      ]);
    } catch (err: any) {
      console.error('Failed to pay for materials:', err);
      Alert.alert('Payment Failed', 'Could not process material payment. Please check your balance and try again.');
    } finally {
      setLoading(false);
    }
  };
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Material Approval</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.requestBanner}>
          <Text style={styles.bannerEmoji}>!</Text>
          <View style={styles.bannerTextContainer}>
            <Text style={styles.bannerTitle}>Materials Requested</Text>
            <Text style={styles.bannerSub}>
              {plumberName} has inspected the issue and added materials needed to complete the work.
            </Text>
          </View>
        </View>
        <Text style={styles.sectionTitle}>Required Items</Text>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading requested materials...</Text>
          </View>
        ) : errorMsg ? (
          <View style={styles.unavailableCard}>
            <Text style={styles.unavailableTitle}>Pending Request Info</Text>
            <Text style={styles.unavailableText}>{errorMsg}</Text>
          </View>
        ) : items.length > 0 ? (
          <MaterialCard items={items} totalAmount={total} />
        ) : (
          <View style={styles.unavailableCard}>
            <Text style={styles.unavailableTitle}>No Materials Requested</Text>
            <Text style={styles.unavailableText}>
              There are no pending material approvals at this time.
            </Text>
          </View>
        )}
        <View style={styles.noticeCard}>
          <Text style={styles.noticeEmoji}>🏪</Text>
          <Text style={styles.noticeText}>
            These materials will be prepared by our local partner hardware store and collected directly by your plumber.
          </Text>
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <SecondaryButton
          title="Decline"
          onPress={handleDecline}
          textColor={colors.textSecondary}
          outlineColor={colors.border || '#C1C6D6'}
          style={styles.actionBtn}
          disabled={loading || (!mockFallbackEnabled && !productOrderId)}
        />
        <PrimaryButton
          title={
            loading
              ? 'Processing...'
              : productOrderId || mockFallbackEnabled
              ? 'Approve Material Request'
              : 'No Pending Request'
          }
          onPress={handleApproveAndPay}
          loading={loading}
          style={styles.actionBtnPrimary}
          disabled={loading || (!mockFallbackEnabled && !productOrderId)}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background || '#F8F9FF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.layout,
    paddingVertical: spacing.md,
    backgroundColor: colors.surfaceContainerLowest || '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.border || '#C1C6D6',
    gap: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLowest || '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border || '#C1C6D6',
  },
  backButtonText: {
    fontSize: 20,
    color: colors.textPrimary,
    fontWeight: 'bold',
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.heading,
    color: colors.textPrimary,
  },
  scrollContent: {
    padding: spacing.layout,
    paddingBottom: spacing.huge,
  },
  requestBanner: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceContainerLow || '#EFF4FF',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border || '#C1C6D6',
  },
  bannerEmoji: {
    fontSize: 24,
  },
  bannerTextContainer: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.body,
    color: colors.primaryContainer || colors.primary,
  },
  bannerSub: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontFamily: typography.fontFamily.body,
    marginTop: 2,
    lineHeight: 16,
  },
  sectionTitle: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.body,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    letterSpacing: 0.5,
  },
  unavailableCard: {
    borderWidth: 1,
    borderColor: colors.border || '#C1C6D6',
    backgroundColor: colors.surfaceContainerLowest || '#FFFFFF',
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  unavailableTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.body,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  unavailableText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontFamily: typography.fontFamily.body,
    lineHeight: 18,
  },
  loadingContainer: {
    padding: spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.body,
    color: colors.textSecondary,
  },
  noticeCard: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceContainerLow || '#EFF4FF',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.lg,
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border || '#C1C6D6',
  },
  noticeEmoji: {
    fontSize: 20,
  },
  noticeText: {
    flex: 1,
    fontSize: typography.fontSize.xs,
    color: colors.primaryContainer || colors.primary,
    fontFamily: typography.fontFamily.body,
    fontWeight: typography.fontWeight.semibold,
    lineHeight: 16,
  },
  footer: {
    flexDirection: 'row',
    padding: spacing.layout,
    borderTopWidth: 1,
    borderTopColor: colors.border || '#C1C6D6',
    backgroundColor: colors.surfaceContainerLowest || '#FFFFFF',
    gap: spacing.md,
  },
  actionBtn: {
    flex: 1,
  },
  actionBtnPrimary: {
    flex: 2,
  },
});


