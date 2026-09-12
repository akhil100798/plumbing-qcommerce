import { NavigationProp, useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import ArrowLeftIcon from '../../assets/icons/arrow-left.svg';
import { StatusChip } from '../../components/common/StatusChip';
import { materialRequestService } from '../../services/orders/materialRequestService';
import { borderRadius, colors, shadows, spacing, typography } from '../../theme';
import { MaterialRequest } from '../../types';
import { AppStackParamList } from '../../types/navigation';

const tabs = [
  { key: 'all', label: 'All' },
  { key: 'approved', label: 'Action Required' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'preparing', label: 'Preparing' },
  { key: 'ready', label: 'Ready' },
  { key: 'collected', label: 'Completed' },
];

const statusToChipType: Record<string, 'warning' | 'primary' | 'info' | 'success' | 'error' | 'neutral'> = {
  REQUESTED: 'warning',
  APPROVED: 'warning',
  STORE_ACCEPTED: 'primary',
  PREPARING: 'info',
  READY_FOR_PICKUP: 'success',
  PLUMBER_AT_STORE: 'success',
  COLLECTED: 'neutral',
  REJECTED: 'error',
  CANCELLED: 'error',
};

const statusLabel: Record<string, string> = {
  REQUESTED: 'Pending Approval',
  APPROVED: 'Action Required',
  STORE_ACCEPTED: 'Accepted',
  PREPARING: 'Preparing',
  READY_FOR_PICKUP: 'Ready for Pickup',
  PLUMBER_AT_STORE: 'Handover',
  COLLECTED: 'Collected',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
};

export function MaterialRequestsScreen() {
  const navigation = useNavigation<NavigationProp<AppStackParamList>>();
  const [activeTab, setActiveTab] = useState('all');
  const [requests, setRequests] = useState<MaterialRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRequests = useCallback(async () => {
    setError(null);
    try {
      const data = await materialRequestService.getStoreRequests();
      setRequests(data || []);
    } catch (err: any) {
      setError(err.message || 'Unable to load material requests.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const onRefresh = () => {
    setRefreshing(true);
    loadRequests();
  };

  const filteredRequests = requests.filter((r) => {
    const raw = r.rawStatus || r.status;
    if (activeTab === 'all') return true;
    if (activeTab === 'approved') return raw === 'APPROVED' || raw === 'REQUESTED' || r.status === 'PENDING';
    if (activeTab === 'accepted') return raw === 'STORE_ACCEPTED' || raw === 'RESERVED';
    if (activeTab === 'preparing') return raw === 'PREPARING' || r.status === 'PREPARING';
    if (activeTab === 'ready') return raw === 'READY_FOR_PICKUP' || raw === 'PLUMBER_AT_STORE' || r.status === 'READY';
    if (activeTab === 'collected') return raw === 'COLLECTED' || r.status === 'COMPLETED';
    return true;
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            if (navigation.canGoBack()) navigation.goBack();
            else navigation.navigate('Main', { screen: 'HomeTab' } as any);
          }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <ArrowLeftIcon width={24} height={24} stroke={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Material Requests</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.tabsRow}>
        {tabs.map((tab) => {
          const isActive = tab.key === activeTab;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabItem, isActive && styles.tabItemActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading requests...</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorIcon}>!</Text>
          <Text style={styles.errorTitle}>Unable to Load</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadRequests}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredRequests}
          keyExtractor={(item) => String(item.id)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyTitle}>No requests</Text>
              <Text style={styles.emptySub}>No material requests in this queue tab.</Text>
            </View>
          }
          renderItem={({ item }) => {
            const rawStatus = item.rawStatus || item.status;
            const chipType = statusToChipType[rawStatus] || 'neutral';
            const isActionNeeded = rawStatus === 'STORE_REVIEWING';

            return (
              <TouchableOpacity
                style={[styles.requestCard, isActionNeeded && styles.requestCardHighlighted]}
                onPress={() => navigation.navigate('MaterialRequestDetail', { requestId: Number(item.id) } as any)}
              >
                <View style={styles.requestTopRow}>
                  <Text style={styles.requestId}>Request #{item.id}</Text>
                  <StatusChip status={rawStatus} />
                </View>
                {item.serviceOrderId && (
                  <Text style={styles.requestMeta}>Service Order: #{item.serviceOrderId}</Text>
                )}
                <Text style={styles.requestMeta}>Plumber: {item.plumberName || 'Field Technician'}</Text>
                {item.items && item.items.length > 0 && (
                  <Text style={styles.requestQty}>
                    {item.items.length} item{item.items.length > 1 ? 's' : ''} · ₹
                    {(item.totalAmount || 0).toFixed(2)}
                  </Text>
                )}
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.layout,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: { fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.layout,
    backgroundColor: colors.surface,
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexWrap: 'wrap',
  },
  tabItem: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: borderRadius.sm,
    marginRight: 6,
    marginTop: 4,
    backgroundColor: colors.surfaceContainerLow,
  },
  tabItemActive: { backgroundColor: colors.primary },
  tabLabel: { fontSize: typography.fontSize.xs, color: colors.textSecondary, fontWeight: '600' },
  tabLabelActive: { color: colors.onPrimary, fontWeight: typography.fontWeight.bold },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.sm, padding: spacing.layout, minHeight: 220 },
  loadingText: { fontSize: typography.fontSize.xs, color: colors.textSecondary },
  errorIcon: { fontSize: 24, fontWeight: 'bold', color: colors.danger, marginBottom: spacing.xs },
  errorTitle: { fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
  errorMessage: { fontSize: typography.fontSize.xs, color: colors.textSecondary, textAlign: 'center' },
  retryBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  retryBtnText: { color: colors.onPrimary, fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.bold },
  emptyTitle: { fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
  emptySub: { fontSize: typography.fontSize.xs, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xs },
  listContainer: { padding: spacing.layout, paddingBottom: spacing.giant },
  requestCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  requestCardHighlighted: {
    borderColor: colors.warning,
    borderWidth: 1.5,
  },
  requestTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  requestId: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
  requestMeta: { fontSize: typography.fontSize.xs, color: colors.textSecondary, marginTop: 2 },
  requestQty: { fontSize: typography.fontSize.xs, color: colors.textPrimary, fontWeight: typography.fontWeight.bold, marginTop: spacing.xs },
});