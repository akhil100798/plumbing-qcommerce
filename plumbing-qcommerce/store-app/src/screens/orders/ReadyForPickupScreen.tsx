import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { AppStackParamList } from '../../types/navigation';
import { ordersService } from '../../services/orders/ordersService';
import { colors, borderRadius, spacing, typography, shadows } from '../../theme';
import StoreIcon from '../../components/common/StoreIcon';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { SecondaryButton } from '../../components/common/SecondaryButton';

type Props = StackScreenProps<AppStackParamList, 'ReadyForPickup'>;

export function ReadyForPickupScreen({ route, navigation }: Props) {
  const { orderId } = route.params;
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [isCollected, setIsCollected] = useState(false);

  const loadOrder = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await ordersService.getOrderById(orderId);
      setOrder(data);
      if (data?.status === 'DELIVERED' || data?.status === 'COLLECTED') {
        setIsCollected(true);
      }
    } catch (err: any) {
      setError(err.message || 'Unable to load order details.');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  const handleConfirmCollection = () => {
    Alert.alert(
      'Confirm Material Handover',
      `Have you physically handed over all packed items for Order ${orderId} to the assigned plumber?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Collection',
          onPress: async () => {
            setConfirming(true);
            try {
              await ordersService.confirmPickup(orderId);
              setIsCollected(true);
              Alert.alert(
                'Collection Confirmed',
                'Plumber has verified and collected the materials. Order status updated to Completed.',
                [
                  {
                    text: 'Done',
                    onPress: () => {
                      if (navigation.canGoBack()) navigation.goBack();
                      else navigation.navigate('Main', { screen: 'OrdersTab' } as any);
                    },
                  },
                ]
              );
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Could not confirm collection. Please try again.');
            } finally {
              setConfirming(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#16A34A" />

      {/* Green Hero Header */}
      <View style={styles.heroPanel}>
        <View style={styles.heroTopRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              if (navigation.canGoBack()) navigation.goBack();
              else navigation.navigate('Main', { screen: 'OrdersTab' } as any);
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel="Go Back"
          >
            <StoreIcon name="arrow-left" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.heroHeaderTitle}>Pickup Desk</Text>
          <View style={{ width: 36 }} />
        </View>

        <View style={styles.heroIconCircle}>
          <StoreIcon name="package" size={36} color="#16A34A" />
        </View>

        <Text style={styles.heroTitle}>
          {isCollected ? 'Materials Collected' : 'Packed & Ready'}
        </Text>
        <Text style={styles.heroSubtitle}>
          {isCollected
            ? 'Handover completed successfully'
            : 'Awaiting assigned plumber counter pickup'}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading pickup details...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorCard}>
            <StoreIcon name="error" size={24} color={colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={loadOrder}>
              <Text style={styles.retryBtnText}>Retry Loading</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Order Summary Card */}
            <View style={styles.card}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Order Reference</Text>
                <Text style={styles.infoValueBold}>#{order?.orderNumber || order?.id || orderId}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Current Status</Text>
                <View
                  style={[
                    styles.statusChip,
                    { backgroundColor: isCollected ? '#EAF8ED' : '#EBF2FF' },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusChipText,
                      { color: isCollected ? '#16A34A' : colors.primary },
                    ]}
                  >
                    {isCollected ? 'COLLECTED' : 'READY FOR PICKUP'}
                  </Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Materials Count</Text>
                <Text style={styles.infoValue}>
                  {order?.items?.length || 5} packed items
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Total Amount</Text>
                <Text style={styles.infoValueBold}>
                  ₹{Number(order?.totalAmount || 1245).toFixed(2)}
                </Text>
              </View>
            </View>

            {/* Plumber Collection Verification Details */}
            <View style={styles.plumberCard}>
              <View style={styles.plumberHeader}>
                <View style={styles.plumberAvatarBox}>
                  <StoreIcon name="wrench" size={20} color={colors.primary} />
                </View>
                <View style={styles.plumberInfoCol}>
                  <Text style={styles.plumberName}>
                    {order?.plumberName || 'Ravi Kumar'}
                  </Text>
                  <Text style={styles.plumberSub}>Verified FixKart Contractor</Text>
                </View>
                <TouchableOpacity
                  style={styles.callPlumberBtn}
                  onPress={() => Alert.alert('Contact Plumber', 'Calling assigned plumber (+91 98765 43210)...')}
                >
                  <StoreIcon name="phone" size={18} color={colors.primary} />
                </TouchableOpacity>
              </View>

              <View style={styles.cardDivider} />

              <View style={styles.instructionRow}>
                <StoreIcon name="shield-verified" size={16} color="#16A34A" />
                <Text style={styles.instructionText}>
                  Verify contractor badge and items checklist before releasing package.
                </Text>
              </View>
            </View>

            {/* Collection Actions */}
            {!isCollected ? (
              <PrimaryButton
                title={confirming ? 'Confirming...' : 'Confirm Plumber Collected'}
                onPress={handleConfirmCollection}
                loading={confirming}
                style={styles.confirmButton}
              />
            ) : (
              <View style={styles.completedBadgeBox}>
                <StoreIcon name="check" size={20} color="#16A34A" />
                <Text style={styles.completedBadgeText}>
                  Physical collection verified & recorded
                </Text>
              </View>
            )}

            {/* Secondary Invoice Action */}
            <SecondaryButton
              title="Print Packing Slip / Invoice"
              onPress={() => Alert.alert('Print Slip', 'Generating thermal store receipt for order ' + orderId)}
              style={styles.printButton}
            />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  heroPanel: {
    backgroundColor: '#16A34A',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
    alignItems: 'center',
  },
  heroTopRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroHeaderTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: '#FFFFFF',
  },
  heroIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  heroSubtitle: {
    fontSize: typography.fontSize.xs,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.giant,
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.giant,
  },
  loadingText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  errorCard: {
    backgroundColor: '#FDEBEC',
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  errorText: {
    fontSize: typography.fontSize.sm,
    color: colors.danger,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: spacing.md,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.danger,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#EAECEF',
    ...shadows.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 6,
  },
  infoLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  infoValue: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  infoValueBold: {
    fontSize: typography.fontSize.sm,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  statusChip: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: borderRadius.round,
  },
  statusChipText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  plumberCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: '#EAECEF',
    ...shadows.sm,
  },
  plumberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  plumberAvatarBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EEF4FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  plumberInfoCol: {
    flex: 1,
  },
  plumberName: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  plumberSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  callPlumberBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EEF4FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: spacing.md,
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  instructionText: {
    flex: 1,
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  confirmButton: {
    height: 50,
    borderRadius: borderRadius.sm,
    backgroundColor: '#16A34A',
    marginBottom: spacing.md,
  },
  completedBadgeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EAF8ED',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  completedBadgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: '#166534',
  },
  printButton: {
    height: 48,
    borderRadius: borderRadius.sm,
  },
});

export default ReadyForPickupScreen;
