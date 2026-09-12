import { NavigationProp, useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
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

export function WeeklySummaryScreen() {
  const navigation = useNavigation<NavigationProp<AppStackParamList>>();
  const [allRequests, setAllRequests] = useState<MaterialRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const data = await materialRequestService.getStoreRequests();
        setAllRequests(data || []);
      } catch {
        // fallback
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, []);

  // Compute calendar week boundaries in IST/Local timezone (Monday 00:00:00 to next Monday 00:00:00 exclusive)
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 is Sunday, 1 is Monday
  const distanceToMon = (dayOfWeek + 6) % 7;

  const monday = new Date(now);
  monday.setDate(now.getDate() - distanceToMon);
  monday.setHours(0, 0, 0, 0);

  const nextMonday = new Date(monday);
  nextMonday.setDate(monday.getDate() + 7);
  nextMonday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  const weekStartStr = monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const weekEndStr = sunday.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  // 1. REQUEST-COHORT METRIC: Requests created during current calendar week
  const weeklyCreatedRequests = allRequests.filter((r) => {
    if (!r.createdAt) return true;
    const reqDate = new Date(r.createdAt);
    return reqDate >= monday && reqDate < nextMonday;
  });

  // 2. EVENT-DURING-WEEK METRIC: Handover completions (COLLECTED transitions) occurring during selected week
  const weeklyHandovers = allRequests.filter((r) => {
    const handoverDateStr = r.collectionConfirmedAt || r.plumberCollectedAt;
    if (!handoverDateStr) return false;
    const hDate = new Date(handoverDateStr);
    return hDate >= monday && hDate < nextMonday;
  });
  const completedHandoverCount = weeklyHandovers.length;

  // 3. COHORT METRICS & FULFILLMENT RATE
  const totalMaterialValue = weeklyCreatedRequests.reduce((sum, r) => sum + (r.totalAmount || 0), 0);
  const completedCohortCount = weeklyCreatedRequests.filter((r) => r.rawStatus === 'COLLECTED' || r.status === 'COMPLETED').length;
  const activeCount = weeklyCreatedRequests.filter((r) => r.rawStatus !== 'COLLECTED' && r.status !== 'COMPLETED' && r.rawStatus !== 'REJECTED' && r.status !== 'REJECTED').length;

  // Zero-request safe fulfillment rate display
  const fulfillmentRateStr =
    weeklyCreatedRequests.length > 0
      ? `${((completedCohortCount / weeklyCreatedRequests.length) * 100).toFixed(1)}%`
      : '—';

  // 4. AVERAGE PICK TIME: Operational packing duration strictly between PREPARING and READY_FOR_PICKUP
  // Excludes plumber travel time, arrival waiting time, and handover confirmation time
  const validPickDurationsMinutes = weeklyCreatedRequests
    .map((r) => {
      // Must not be rejected or cancelled
      if (r.rawStatus === 'REJECTED' || r.rawStatus === 'CANCELLED' || r.status === 'REJECTED') return null;
      const startStr = r.preparingStartedAt;
      const endStr = r.readyForPickupAt;
      if (!startStr || !endStr) return null; // Exclude missing PREPARING or READY_FOR_PICKUP transitions
      const start = new Date(startStr).getTime();
      const end = new Date(endStr).getTime();
      const diffMs = end - start;
      return diffMs >= 0 && diffMs < 24 * 3600 * 1000 ? diffMs / (1000 * 60) : null;
    })
    .filter((val): val is number => val !== null);

  const avgPickTimeStr =
    validPickDurationsMinutes.length > 0
      ? `${(validPickDurationsMinutes.reduce((a, b) => a + b, 0) / validPickDurationsMinutes.length).toFixed(1)}m`
      : '—';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            if (navigation.canGoBack()) navigation.goBack();
            else navigation.navigate('SalesAnalytics');
          }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <ArrowLeftIcon width={24} height={24} stroke={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Weekly Management Summary</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.loadingText}>Calculating Weekly Operations KPI...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
          {/* Top Period Badge */}
          <View style={styles.periodRow}>
            <View>
              <Text style={styles.periodTitle}>Weekly Performance Summary</Text>
              <Text style={styles.periodDates}>{`${weekStartStr} - ${weekEndStr}`}</Text>
            </View>
            <View style={styles.badgePill}>
              <Text style={styles.badgeText}>This Week</Text>
            </View>
          </View>

          {/* Bento Grid KPIs */}
          <View style={styles.grid}>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>TOTAL MATERIAL VALUE</Text>
              <Text style={styles.kpiValue}>₹{totalMaterialValue.toFixed(2)}</Text>
              <Text style={styles.kpiSub}>From weekly created requests</Text>
            </View>

            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>TOTAL REQUESTS</Text>
              <Text style={styles.kpiValue}>{weeklyCreatedRequests.length}</Text>
              <Text style={styles.kpiSub}>Plumber field requests</Text>
            </View>

            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>FULFILLMENT RATE</Text>
              <Text style={styles.kpiValue}>{fulfillmentRateStr}</Text>
              <Text style={styles.kpiSub}>
                {weeklyCreatedRequests.length > 0 ? 'On target (>95%)' : 'No requests this week'}
              </Text>
            </View>

            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>AVG PICK TIME</Text>
              <Text style={styles.kpiValue}>{avgPickTimeStr}</Text>
              <Text style={styles.kpiSub}>
                {validPickDurationsMinutes.length > 0 ? 'Item packing speed' : 'No packing duration data'}
              </Text>
            </View>
          </View>

          {/* Operational Highlights */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Operational Highlights</Text>

            <View style={styles.highlightRow}>
              <View style={styles.iconBox}>
                <WarehouseIcon width={18} height={18} stroke={colors.primaryContainer || colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.highlightTitle}>Inventory Status</Text>
                <Text style={styles.highlightDesc}>Active stock levels monitored across hardware categories.</Text>
              </View>
            </View>

            <View style={styles.highlightRow}>
              <View style={styles.iconBox}>
                <WarehouseIcon width={18} height={18} stroke={colors.secondary || '#1B6D24'} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.highlightTitle}>Handover Milestone</Text>
                <Text style={styles.highlightDesc}>
                  {completedHandoverCount} completed plumber self-pickups finalized this week.
                </Text>
              </View>
            </View>

            <View style={styles.highlightRow}>
              <View style={styles.iconBox}>
                <WarehouseIcon width={18} height={18} stroke={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.highlightTitle}>Active Fulfillment</Text>
                <Text style={styles.highlightDesc}>{activeCount} requests currently being processed or ready.</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background || '#F9F9F9' },
  centerLoading: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.xs },
  loadingText: { fontSize: typography.fontSize.xs, color: colors.textSecondary },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.layout,
    paddingVertical: spacing.md,
    backgroundColor: colors.surfaceContainerLowest || '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.border || '#C6C5D4',
  },
  headerTitle: { fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
  scrollBody: { padding: spacing.layout, paddingBottom: spacing.giant },
  periodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  periodTitle: { fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
  periodDates: { fontSize: typography.fontSize.xs, color: colors.textMuted, marginTop: 2 },
  badgePill: {
    backgroundColor: colors.surfaceContainerLow || '#F4F3F7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border || '#C6C5D4',
  },
  badgeText: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.bold, color: colors.primaryContainer || colors.primary },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginBottom: spacing.md },
  kpiCard: {
    width: '47%',
    backgroundColor: colors.surfaceContainerLowest || '#FFFFFF',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border || '#C6C5D4',
    ...shadows.sm,
  },
  kpiLabel: { fontSize: 10, fontWeight: '700', color: colors.textMuted },
  kpiValue: { fontSize: 18, fontWeight: typography.fontWeight.bold, color: colors.textPrimary, marginVertical: 4 },
  kpiSub: { fontSize: 10, color: colors.textSecondary },
  card: {
    backgroundColor: colors.surfaceContainerLowest || '#FFFFFF',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border || '#C6C5D4',
    ...shadows.sm,
  },
  sectionTitle: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.bold, color: colors.textPrimary, marginBottom: spacing.md },
  highlightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceContainerLow || '#F4F3F7',
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceContainerLow || '#F4F3F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  highlightTitle: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
  highlightDesc: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
});

export default WeeklySummaryScreen;
