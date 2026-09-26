import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { AppStackParamList } from '../../types/navigation';
import { materialRequestService } from '../../services/orders/materialRequestService';
import { MaterialRequest } from '../../types';
import ArrowLeftIcon from '../../assets/icons/arrow-left.svg';
import PlusIcon from '../../assets/icons/plus.svg';
import { colors, borderRadius, spacing, typography } from '../../theme';

const tabs = [
  { key: 'all',       label: 'All' },
  { key: 'pending',   label: 'Pending' },
  { key: 'preparing', label: 'Preparing' },
  { key: 'ready',     label: 'Ready' },
  { key: 'completed', label: 'Completed' },
];

const statusDisplay: Record<string, { label: string; color: string; bg: string }> = {
  PENDING:   { label: 'Pending',   color: colors.accentOrange, bg: colors.accentOrangeLight },
  PREPARING: { label: 'Preparing', color: '#2E9AE0',           bg: '#E7F5FE' },
  READY:     { label: 'Ready',     color: colors.accentGreen,  bg: colors.accentGreenLight },
  COMPLETED: { label: 'Completed', color: '#6B7280',           bg: '#F3F4F6' },
  CANCELLED: { label: 'Cancelled', color: colors.error,        bg: colors.errorLight || '#FEE2E2' },
};

export function MaterialRequestsScreen() {
  const navigation = useNavigation<NavigationProp<AppStackParamList>>();
  const [activeTab, setActiveTab] = useState('all');
  const [requests, setRequests] = useState<MaterialRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await materialRequestService.getMaterialRequests();
      setRequests(data || []);
    } catch (err: any) {
      setError(err.message || 'Unable to load material requests. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const filteredRequests = activeTab === 'all'
    ? requests
    : requests.filter(r => r.status.toLowerCase() === activeTab);

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
        <Text style={styles.headerTitle}>Material Requests</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabsRow}>
        {tabs.map((tab) => {
          const isActive = tab.key === activeTab;
          const count = tab.key === 'all' ? requests.length : requests.filter(r => r.status.toLowerCase() === tab.key).length;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabItem, isActive && styles.tabItemActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {tab.label}{count > 0 && tab.key !== 'all' ? ` (${count})` : ''}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading requests…</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Could Not Load Requests</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadRequests}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredRequests}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.huge }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyText}>
                {activeTab === 'all' ? 'No material requests yet.' : `No ${activeTab} requests.`}
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const style = statusDisplay[item.status] || statusDisplay.PENDING;
            return (
              <TouchableOpacity
                testID={`store-material-request-card-${item.id}`}
                style={styles.requestCard}
                onPress={() => navigation.navigate('MaterialRequestDetail', { requestId: item.id as number })}
              >
                <View style={styles.requestTopRow}>
                  <Text style={styles.requestId}>Request #{item.id}</Text>
                  <View style={[styles.statusPill, { backgroundColor: style.bg }]}>
                    <Text style={[styles.statusPillText, { color: style.color }]}>
                      {style.label}
                    </Text>
                  </View>
                </View>
                <Text style={styles.requestDate}>
                  {new Date(item.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </Text>
                <Text style={styles.requestMeta}>
                  Plumber: {item.plumberName}
                </Text>
                {item.items?.length > 0 && (
                  <Text style={styles.requestQty}>
                    {item.items.length} item{item.items.length > 1 ? 's' : ''} · ₹{item.totalAmount.toFixed(2)}
                  </Text>
                )}
              </TouchableOpacity>
            );
          }}
          ListFooterComponent={
            <TouchableOpacity
              style={styles.newRequestButton}
              onPress={() => navigation.navigate('MaterialRequests')}
            >
              <PlusIcon width={18} height={18} stroke={colors.surface} />
              <Text style={styles.newRequestText}>Refresh</Text>
            </TouchableOpacity>
          }
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
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: { fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.surface,
    paddingBottom: spacing.sm,
    marginBottom: spacing.sm,
    flexWrap: 'wrap',
  },
  tabItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: borderRadius.round,
    marginRight: 8,
    marginTop: 4,
    backgroundColor: colors.background,
  },
  tabItemActive: { backgroundColor: colors.primary },
  tabLabel: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  tabLabelActive: { color: colors.surface },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.md, padding: spacing.layout, minHeight: 200 },
  loadingText: { fontSize: typography.fontSize.sm, color: colors.textSecondary },
  errorIcon: { fontSize: 36 },
  errorTitle: { fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.bold, color: colors.textPrimary, textAlign: 'center' },
  errorMessage: { fontSize: typography.fontSize.sm, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  retryBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    marginTop: spacing.sm,
  },
  retryBtnText: { color: colors.surface, fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.bold },
  emptyIcon: { fontSize: 36 },
  emptyText: { fontSize: typography.fontSize.sm, color: colors.textSecondary, textAlign: 'center' },
  requestCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  requestTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  requestId: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: borderRadius.round },
  statusPillText: { fontSize: 11, fontWeight: '700' },
  requestDate: { fontSize: typography.fontSize.xs, color: colors.textMuted, marginBottom: 4 },
  requestMeta: { fontSize: typography.fontSize.xs, color: colors.textSecondary, marginBottom: 2 },
  requestQty: { fontSize: typography.fontSize.xs, color: colors.textSecondary, marginTop: 2 },
  newRequestButton: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    height: 52,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  newRequestText: { color: colors.surface, fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.bold, marginLeft: 6 },
});

export default MaterialRequestsScreen;
