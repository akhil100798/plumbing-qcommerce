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
import RefreshIcon from '../../assets/icons/plus.svg';
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

const statusDisplay: Record<string, { label: string; color: string; bg: string }> = {
  REQUESTED: { label: 'Requested (Pending Cust. Approval)', color: colors.textMuted, bg: colors.surfaceContainerLow },
  APPROVED: { label: 'Approved by Customer (Action Req.)', color: colors.warning, bg: colors.warningLight },
  STORE_ACCEPTED: { label: 'Request Accepted', color: colors.primary, bg: colors.surfaceContainerLow },
  PREPARING: { label: 'Preparing / Packing', color: '#2E9AE0', bg: '#E7F5FE' },
  READY_FOR_PICKUP: { label: 'Ready for Pickup', color: colors.secondary || '#1B6D24', bg: colors.successLight },
  PLUMBER_AT_STORE: { label: 'Plumber Arrived (Handover Req.)', color: colors.secondary || '#1B6D24', bg: colors.successLight },
  COLLECTED: { label: 'Materials Collected ✓', color: '#6B7280', bg: '#F3F4F6' },
  REJECTED: { label: 'Request Rejected', color: colors.danger, bg: colors.dangerLight },
  CANCELLED: { label: 'Cancelled', color: colors.danger, bg: colors.dangerLight },
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
    if (activeTab === 'all') return true;
    if (activeTab === 'approved') return r.status === 'APPROVED';
    if (activeTab === 'accepted') return r.status === 'STORE_ACCEPTED';
    if (activeTab === 'preparing') return r.status === 'PREPARING';
    if (activeTab === 'ready') return r.status === 'READY_FOR_PICKUP' || r.status === 'PLUMBER_AT_STORE';
    if (activeTab === 'collected') return r.status === 'COLLECTED';
    return true;
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

      {/* Header */}
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
        <Text style={styles.headerTitle}>Material Requests Queue</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Filter Tabs */}
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
          <Text style={styles.loadingText}>Fetching Store Queue...</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Queue Unavailable</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadRequests}>
            <Text style={styles.retryBtnText}>Retry Queue Sync</Text>
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
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyText}>No material requests in this queue tab.</Text>
            </View>
          }
          renderItem={({ item }) => {
            const style = statusDisplay[item.status] || statusDisplay.REQUESTED;
            const isActionNeeded = item.status === 'APPROVED';

            return (
              <TouchableOpacity
                style={[styles.requestCard, isActionNeeded && styles.requestCardHighlighted]}
                onPress={() => navigation.navigate('MaterialRequestDetail', { requestId: Number(item.id) } as any)}
              >
                <View style={styles.requestTopRow}>
                  <Text style={styles.requestId}>Request #{item.id}</Text>
                  <View style={[styles.statusPill, { backgroundColor: style.bg }]}>
                    <Text style={[styles.statusPillText, { color: style.color }]}>{style.label}</Text>
                  </View>
                </View>

                {item.serviceOrderId && (
                  <Text style={styles.requestMeta}>Service Order: #{item.serviceOrderId}</Text>
                )}

                <Text style={styles.requestMeta}>Plumber: {item.plumberName || 'Field Technician'}</Text>

                {item.items && item.items.length > 0 && (
                  <Text style={styles.requestQty}>
                    {item.items.length} item{item.items.length > 1 ? 's' : ''} · Total Value: ₹
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
  container: { flex: 1, backgroundColor: colors.background || '#F9F9F9' },
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
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.layout,
    backgroundColor: colors.surfaceContainerLowest || '#FFFFFF',
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border || '#C6C5D4',
    flexWrap: 'wrap',
  },
  tabItem: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: borderRadius.sm,
    marginRight: 6,
    marginTop: 4,
    backgroundColor: colors.surfaceContainerLow || '#F4F3F7',
  },
  tabItemActive: { backgroundColor: colors.primaryContainer || colors.primary },
  tabLabel: { fontSize: typography.fontSize.xs, color: colors.textSecondary, fontWeight: '600' },
  tabLabelActive: { color: '#FFFFFF', fontWeight: typography.fontWeight.bold },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.sm, padding: spacing.layout, minHeight: 220 },
  loadingText: { fontSize: typography.fontSize.xs, color: colors.textSecondary },
  errorIcon: { fontSize: 32 },
  errorTitle: { fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
  errorMessage: { fontSize: typography.fontSize.xs, color: colors.textSecondary, textAlign: 'center' },
  retryBtn: {
    backgroundColor: colors.primaryContainer || colors.primary,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  retryBtnText: { color: '#FFFFFF', fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.bold },
  emptyIcon: { fontSize: 32 },
  emptyText: { fontSize: typography.fontSize.xs, color: colors.textMuted, textAlign: 'center' },
  listContainer: { padding: spacing.layout, paddingBottom: spacing.giant },
  requestCard: {
    backgroundColor: colors.surfaceContainerLowest || '#FFFFFF',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border || '#C6C5D4',
    ...shadows.sm,
  },
  requestCardHighlighted: {
    borderColor: colors.warning || '#FD6C00',
    borderWidth: 1.5,
  },
  requestTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  requestId: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: borderRadius.sm },
  statusPillText: { fontSize: typography.fontSize.xs, fontWeight: '700' },
  requestMeta: { fontSize: typography.fontSize.xs, color: colors.textSecondary, marginTop: 2 },
  requestQty: { fontSize: typography.fontSize.xs, color: colors.textPrimary, fontWeight: typography.fontWeight.bold, marginTop: 4 },
});
