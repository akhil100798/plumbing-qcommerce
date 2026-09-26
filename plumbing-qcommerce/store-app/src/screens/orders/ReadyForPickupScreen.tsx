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
import ArrowLeftIcon from '../../assets/icons/arrow-left.svg';
import WarehouseIcon from '../../assets/icons/warehouse.svg';
import { ordersService } from '../../services/orders/ordersService';
import { colors, borderRadius, spacing, typography } from '../../theme';

type Props = StackScreenProps<AppStackParamList, 'ReadyForPickup'>;

export function ReadyForPickupScreen({ route, navigation }: Props) {
  const { orderId } = route.params;
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  const loadOrder = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await ordersService.getOrderById(orderId);
      setOrder(data);
    } catch (err: any) {
      setError(err.message || 'Unable to load order details.');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  const handleConfirmCollection = async () => {
    setConfirming(true);
    try {
      await ordersService.confirmPickup(orderId);
      Alert.alert(
        'Collection Confirmed',
        'Plumber has collected all materials. Order complete.',
        [{ text: 'OK', onPress: () => {
          if (navigation.canGoBack()) navigation.goBack();
          else navigation.navigate('Main', { screen: 'OrdersTab' } as any);
        }}]
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not confirm collection. Please try again.');
    } finally {
      setConfirming(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.accentGreen} />

      <ScrollView contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        {/* Green hero panel */}
        <View style={styles.heroPanel}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              if (navigation.canGoBack()) navigation.goBack();
              else navigation.navigate('Main', { screen: 'OrdersTab' } as any);
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <ArrowLeftIcon width={22} height={22} stroke={colors.surface} />
          </TouchableOpacity>

          <View style={styles.heroIconRow}>
            <WarehouseIcon width={44} height={44} stroke={colors.surface} />
          </View>

          <Text style={styles.heroTitle}>Order Packed & Ready</Text>
          <Text style={styles.heroSubtitle}>Awaiting plumber pickup</Text>
        </View>

        <View style={styles.content}>

          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Loading order details…</Text>
            </View>
          ) : error ? (
            <View style={styles.card}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryLink} onPress={loadOrder}>
                <Text style={styles.retryLinkText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* Order info */}
              <View style={styles.card}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Order ID</Text>
                  <Text style={styles.infoValueBold}>#{order?.id || orderId}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Status</Text>
                  <View style={styles.statusChip}>
                    <Text style={styles.statusChipText}>READY FOR PICKUP</Text>
                  </View>
                </View>
                {order?.items?.length > 0 && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Items</Text>
                    <Text style={styles.infoValue}>{order.items.length} item{order.items.length > 1 ? 's' : ''}</Text>
                  </View>
                )}
                {order?.totalAmount != null && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Amount</Text>
                    <Text style={styles.infoValueBold}>₹{Number(order.totalAmount).toFixed(2)}</Text>
                  </View>
                )}
              </View>

              {/* Plumber pickup status note */}
              <View style={styles.statusCard}>
                <Text style={styles.statusCardTitle}>🔧 Plumber Pickup Workflow</Text>
                <Text style={styles.statusCardBody}>
                  The assigned plumber will arrive at the store to collect the packed materials.
                  Once the plumber has collected, confirm collection below.
                </Text>
              </View>

              {/* Confirm collection CTA */}
              <TouchableOpacity
                style={[styles.confirmBtn, confirming && styles.confirmBtnDisabled]}
                onPress={handleConfirmCollection}
                disabled={confirming}
              >
                {confirming ? (
                  <ActivityIndicator size="small" color={colors.surface} />
                ) : (
                  <Text style={styles.confirmBtnText}>Confirm Plumber Collected</Text>
                )}
              </TouchableOpacity>

              {/* Print invoice secondary action */}
              <TouchableOpacity
                style={styles.outlineButton}
                onPress={() => Alert.alert('Print Invoice', 'Invoice sent to thermal printer.')}
              >
                <Text style={styles.outlineButtonText}>Print Invoice</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  heroPanel: {
    backgroundColor: colors.accentGreen,
    paddingTop: spacing.lg,
    paddingBottom: 32,
    paddingHorizontal: spacing.xl,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    alignItems: 'center',
  },
  backButton: { alignSelf: 'flex-start', marginBottom: spacing.lg },
  heroIconRow: { alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  heroTitle: { color: colors.surface, fontSize: 20, fontWeight: '700', marginBottom: 4 },
  heroSubtitle: { color: 'rgba(255,255,255,0.85)', fontSize: 13 },
  content: { paddingHorizontal: spacing.xl, marginTop: -20 },
  center: { justifyContent: 'center', alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.md },
  loadingText: { fontSize: typography.fontSize.sm, color: colors.textSecondary },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  errorText: { fontSize: typography.fontSize.sm, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.sm },
  retryLink: { alignSelf: 'center' },
  retryLinkText: { color: colors.primary, fontWeight: typography.fontWeight.bold, fontSize: typography.fontSize.sm },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  infoLabel: { fontSize: 13, color: colors.textSecondary },
  infoValue: { fontSize: 13, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
  infoValueBold: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
  statusChip: {
    backgroundColor: colors.accentGreenLight,
    borderRadius: borderRadius.round,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusChipText: { fontSize: 11, fontWeight: '700', color: colors.accentGreen },
  statusCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  statusCardTitle: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.bold, color: '#1D4ED8', marginBottom: spacing.xs },
  statusCardBody: { fontSize: typography.fontSize.xs, color: '#1E40AF', lineHeight: 18 },
  confirmBtn: {
    backgroundColor: colors.accentGreen,
    borderRadius: borderRadius.md,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  confirmBtnDisabled: { opacity: 0.6 },
  confirmBtnText: { color: colors.surface, fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.bold },
  outlineButton: {
    height: 50,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    marginBottom: spacing.lg,
  },
  outlineButtonText: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
});

export default ReadyForPickupScreen;
