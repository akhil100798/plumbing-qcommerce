import { StackScreenProps } from '@react-navigation/stack';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import ArrowLeftIcon from '../../assets/icons/arrow-left.svg';
import WarehouseIcon from '../../assets/icons/warehouse.svg';
import { materialRequestService } from '../../services/orders/materialRequestService';
import { borderRadius, colors, shadows, spacing, typography } from '../../theme';
import { MaterialRequest } from '../../types';
import { AppStackParamList } from '../../types/navigation';

type Props = StackScreenProps<AppStackParamList, 'ReadyForPickup' | any>;

export function ReadyForPickupScreen({ route, navigation }: Props) {
  const requestId = (route.params as any)?.requestId || (route.params as any)?.orderId;
  const [request, setRequest] = useState<MaterialRequest | null>(null);
  const [loading, setLoading] = useState(true);

  const loadDetails = useCallback(async () => {
    try {
      const data = await materialRequestService.getById(Number(requestId));
      setRequest(data);
    } catch {
      // transient fetch error
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  useEffect(() => {
    loadDetails();
  }, [loadDetails]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.loadingText}>Loading Pickup Status...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.secondary || '#1B6D24'} />

      <ScrollView contentContainerStyle={{ paddingBottom: spacing.giant }} showsVerticalScrollIndicator={false}>
        {/* Stitch Green Hero Panel */}
        <View style={styles.heroPanel}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              if (navigation.canGoBack()) navigation.goBack();
              else navigation.navigate('Main', { screen: 'MaterialsTab' } as any);
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <ArrowLeftIcon width={22} height={22} stroke="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.heroIconRow}>
            <WarehouseIcon width={44} height={44} stroke="#FFFFFF" />
          </View>

          <Text style={styles.heroTitle}>Materials Packed & Ready</Text>
          <Text style={styles.heroSubtitle}>Awaiting Plumber Self-Pickup at Store Counter</Text>
        </View>

        <View style={styles.content}>
          {/* Request Metadata Card */}
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Material Request ID</Text>
              <Text style={styles.infoValueBold}>#{request?.id || requestId}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Service Order ID</Text>
              <Text style={styles.infoValueBold}>#{request?.serviceOrderId || 'N/A'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Fulfillment Status</Text>
              <View style={styles.statusChip}>
                <Text style={styles.statusChipText}>READY FOR PICKUP</Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Assigned Plumber</Text>
              <Text style={styles.infoValueBold}>{request?.plumberName || 'Field Technician'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Total Value</Text>
              <Text style={styles.infoValueBold}>₹{(request?.totalAmount || 0).toFixed(2)}</Text>
            </View>
          </View>

          {/* Plumber Pickup Workflow Status Note */}
          <View style={styles.statusCard}>
            <Text style={styles.statusCardTitle}>🔧 Plumber Self-Pickup Notification</Text>
            <Text style={styles.statusCardBody}>
              The assigned plumber has been notified via Plumber App. When the plumber arrives at your hardware store counter, proceed to Phase 6 collection confirmation.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.outlineButton}
            onPress={() => navigation.navigate('Main', { screen: 'MaterialsTab' } as any)}
          >
            <Text style={styles.outlineButtonText}>Return to Queue</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background || '#F9F9F9' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.xs },
  loadingText: { fontSize: typography.fontSize.xs, color: colors.textSecondary },
  heroPanel: {
    backgroundColor: colors.secondary || '#1B6D24',
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.layout,
    borderBottomLeftRadius: borderRadius.md,
    borderBottomRightRadius: borderRadius.md,
    alignItems: 'center',
  },
  backButton: { alignSelf: 'flex-start', marginBottom: spacing.sm },
  heroIconRow: { alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xs },
  heroTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: typography.fontWeight.bold, marginBottom: 2 },
  heroSubtitle: { color: 'rgba(255,255,255,0.85)', fontSize: typography.fontSize.xs },
  content: { paddingHorizontal: spacing.layout, marginTop: -spacing.md },
  card: {
    backgroundColor: colors.surfaceContainerLowest || '#FFFFFF',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border || '#C6C5D4',
    ...shadows.sm,
  },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  infoLabel: { fontSize: typography.fontSize.xs, color: colors.textSecondary },
  infoValueBold: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
  statusChip: {
    backgroundColor: colors.successLight || '#E7F7EC',
    borderRadius: borderRadius.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusChipText: { fontSize: 10, fontWeight: '700', color: colors.secondary || '#1B6D24' },
  statusCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  statusCardTitle: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.bold, color: '#1D4ED8', marginBottom: 4 },
  statusCardBody: { fontSize: typography.fontSize.xs, color: '#1E40AF', lineHeight: 16 },
  outlineButton: {
    height: 48,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border || '#C6C5D4',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceContainerLowest || '#FFFFFF',
  },
  outlineButtonText: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
});
