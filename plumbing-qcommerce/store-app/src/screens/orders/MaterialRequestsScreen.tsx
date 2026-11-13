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
import { StoreIcon } from '../../components/common/StoreIcon';
import { colors, borderRadius, spacing, typography } from '../../theme';

const tabs = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Requested' },
  { key: 'preparing', label: 'Preparing' },
  { key: 'ready', label: 'Ready' },
  { key: 'completed', label: 'Collected' },
];

const statusDisplay: Record<string, { label: string; color: string; bg: string; borderColor: string }> = {
  PENDING: { label: 'Requested', color: '#D97706', bg: '#FEF3C7', borderColor: '#FDE68A' },
  PREPARING: { label: 'Preparing', color: '#0284C7', bg: '#E0F2FE', borderColor: '#BAE6FD' },
  READY: { label: 'Ready for Pickup', color: '#059669', bg: '#ECFDF5', borderColor: '#A7F3D0' },
  COMPLETED: { label: 'Collected', color: '#4B5563', bg: '#F3F4F6', borderColor: '#E5E7EB' },
  CANCELLED: { label: 'Cancelled', color: colors.error, bg: '#FEF2F2', borderColor: '#FEE2E2' },
};

export function MaterialRequestsScreen() {
  const navigation = useNavigation<NavigationProp<AppStackParamList>>();
  const [activeTab, setActiveTab] = useState('all');
  const [requests, setRequests] = useState<MaterialRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRequests = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    setError(null);
    try {
      const data = await materialRequestService.getMaterialRequests();
      setRequests(data || []);
    } catch (err: any) {
      if (isInitial) setError(err.message || 'Unable to load material requests. Please try again.');
    } finally {
      if (isInitial) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRequests(true);
    const interval = setInterval(() => {
      void loadRequests(false);
    }, 3000);
    return () => clearInterval(interval);
  }, [loadRequests]);

  const filteredRequests =
    activeTab === 'all'
      ? requests
      : requests.filter((r) => r.status.toLowerCase() === activeTab);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            if (navigation.canGoBack()) navigation.goBack();
            else navigation.navigate('Main', { screen: 'HomeTab' } as any);
          }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.headerButton}
        >
          <StoreIcon name="arrow-left" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Material Requests</Text>
        <TouchableOpacity
          onPress={() => void loadRequests(true)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.headerButton}
        >
          <StoreIcon name="materials" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Counter Pickup Operational Strip */}
      <View style={styles.bannerStrip}>
        <StoreIcon name="store" size={16} color={colors.primary} />
        <Text style={styles.bannerStripText}>
          Plumber counter requests • Prepare promptly for in-store pickup
        </Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabsRow}>
        {tabs.map((tab) => {
          const isActive = tab.key === activeTab;
          const count =
            tab.key === 'all'
              ? requests.length
              : requests.filter((r) => r.status.toLowerCase() === tab.key).length;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabItem, isActive && styles.tabItemActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {tab.label}
                {count > 0 ? ` (${count})` : ''}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Fetching material requests...</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <StoreIcon name="warning" size={40} color={colors.error} />
          <Text style={styles.errorTitle}>Could Not Load Requests</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => void loadRequests(true)}>
            <Text style={styles.retryBtnText}>Retry Connection</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredRequests}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.center}>
              <StoreIcon name="materials" size={44} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>No Material Requests</Text>
              <Text style={styles.emptySubtitle}>
                {activeTab === 'all'
                  ? 'No pending materials requested from plumbers.'
                  : `No ${activeTab} material requests in queue.`}
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const badge = statusDisplay[item.status] || statusDisplay.PENDING;
            const primaryItemName =
              item.items && item.items.length > 0
                ? item.items[0].productName
                : 'Plumbing Materials';
            const totalQuantity =
              item.items?.reduce((sum, it) => sum + (it.quantity || 1), 0) || item.items?.length || 1;

            return (
              <TouchableOpacity
                testID={`store-material-job-${item.serviceOrderId}`}
                accessibilityLabel={`store-material-request-card-${item.id}`}
                style={styles.requestCard}
                onPress={() =>
                  navigation.navigate('MaterialRequestDetail', { requestId: item.id as number })
                }
                activeOpacity={0.7}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.iconContainer}>
                    <StoreIcon name="plumbing-fitting" size={24} color={colors.primary} />
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={styles.requestId}>#REQ{item.id}</Text>
                    <Text style={styles.itemName} numberOfLines={1}>
                      {primaryItemName}
                      {item.items && item.items.length > 1
                        ? ` +${item.items.length - 1} more`
                        : ''}
                    </Text>
                    <Text style={styles.qtyText}>
                      Qty: {totalQuantity} units · ₹{item.totalAmount ? item.totalAmount.toFixed(2) : '0.00'}
                    </Text>
                  </View>
                  <View style={styles.cardMetaRight}>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: badge.bg, borderColor: badge.borderColor },
                      ]}
                    >
                      <Text style={[styles.statusBadgeText, { color: badge.color }]}>
                        {badge.label}
                      </Text>
                    </View>
                    <Text style={styles.requestDate}>
                      {new Date(item.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                      })}
                    </Text>
                  </View>
                </View>

                <View style={styles.plumberBar}>
                  <StoreIcon name="plumber" size={14} color={colors.textSecondary} />
                  <Text style={styles.plumberNameText}>
                    Plumber: {item.plumberName || 'Assigned Technician'}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }}
          ListFooterComponent={
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={() => void loadRequests(true)}
              activeOpacity={0.8}
            >
              <StoreIcon name="materials" size={18} color={colors.surface} />
              <Text style={styles.refreshButtonText}>Refresh Materials Queue</Text>
            </TouchableOpacity>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  bannerStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: spacing.xl,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#DBEAFE',
  },
  bannerStripText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: colors.primary,
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 6,
  },
  tabItem: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: borderRadius.round,
    backgroundColor: '#F1F5F9',
  },
  tabItemActive: {
    backgroundColor: colors.primary,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabLabelActive: {
    color: colors.surface,
    fontWeight: '700',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    minHeight: 280,
  },
  loadingText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  errorTitle: {
    fontSize: 15,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  errorMessage: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  retryBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    marginTop: spacing.md,
  },
  retryBtnText: {
    color: colors.surface,
    fontSize: 13,
    fontWeight: '700',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  emptySubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: 40,
  },
  requestCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 46,
    height: 46,
    borderRadius: borderRadius.md,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  cardInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  requestId: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  itemName: {
    fontSize: 13.5,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginTop: 2,
  },
  qtyText: {
    fontSize: 11.5,
    color: colors.textSecondary,
    marginTop: 2,
  },
  cardMetaRight: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 46,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.round,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  requestDate: {
    fontSize: 11,
    color: colors.textMuted,
  },
  plumberBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 6,
  },
  plumberNameText: {
    fontSize: 11.5,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  refreshButton: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
    gap: 8,
  },
  refreshButtonText: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: typography.fontWeight.bold,
  },
});

export default MaterialRequestsScreen;
