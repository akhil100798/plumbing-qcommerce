import { NavigationProp, useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { apiClient } from '../../services/api/axiosClient';
import { materialRequestService } from '../../services/orders/materialRequestService';
import { borderRadius, colors, shadows, spacing, typography } from '../../theme';
import { MaterialRequest } from '../../types';
import { AppStackParamList } from '../../types/navigation';

export function SalesAnalyticsScreen() {
  const navigation = useNavigation<NavigationProp<AppStackParamList>>();
  const [requests, setRequests] = useState<MaterialRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const data = await materialRequestService.getStoreRequests();
        setRequests(data || []);
      } catch {
        // fetch fallback
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  const handleExportPdf = async () => {
    setPdfLoading(true);
    try {
      await apiClient.get('/stores/me/reports/monthly/pdf', { responseType: 'blob' });
      Alert.alert(
        'PDF Export Success!',
        'Monthly operational report generated and streamed from backend REST API.'
      );
    } catch (err: any) {
      Alert.alert('PDF Export Error', err?.message || 'Could not export monthly operational report PDF.');
    } finally {
      setPdfLoading(false);
    }
  };

  const totalValue = requests.reduce((sum, r) => sum + (r.totalAmount || 0), 0);
  const completedRequests = requests.filter((r) => r.status === 'COLLECTED' || r.status === 'COMPLETED');
  const activeRequests = requests.filter((r) => r.status !== 'COLLECTED' && r.status !== 'COMPLETED' && r.status !== 'REJECTED');

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
        <Text style={styles.headerTitle}>Store Operational Analytics</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.loadingText}>Calculating Operational Metrics...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
          {/* Top Operational Metrics */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Total Material Value</Text>
              <Text style={styles.statValue}>₹{totalValue.toFixed(2)}</Text>
              <Text style={styles.statNote}>Derived from active & completed requests</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Completed Handovers</Text>
              <Text style={styles.statValue}>{completedRequests.length}</Text>
              <Text style={styles.statNote}>Materials collected by plumbers</Text>
            </View>
          </View>

          {/* Detailed Request Volume Summary */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Request Operational Volume</Text>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Total Material Requests</Text>
              <Text style={styles.infoValBold}>{requests.length} Requests</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Active Fulfillment Requests</Text>
              <Text style={styles.infoValBold}>{activeRequests.length} Active</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Completed Handovers</Text>
              <Text style={styles.infoValBold}>{completedRequests.length} Completed</Text>
            </View>

            <TouchableOpacity
              style={styles.weeklySummaryBtn}
              onPress={() => navigation.navigate('WeeklySummary' as any)}
            >
              <Text style={styles.weeklySummaryBtnText}>📊 View Weekly Management Summary</Text>
            </TouchableOpacity>

            {/* Export PDF Button CTA */}
            <TouchableOpacity
              style={[styles.pdfExportBtn, pdfLoading && styles.disabledBtn]}
              onPress={handleExportPdf}
              disabled={pdfLoading}
            >
              {pdfLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.pdfExportBtnText}>📄 Export Monthly Report (PDF)</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Payment Scope Notice */}
          <View style={styles.noticeCard}>
            <WarehouseIcon width={20} height={20} stroke={colors.primaryContainer || colors.primary} />
            <Text style={styles.noticeText}>
              Financial payouts & payment settlements are deferred across all FixKart apps. All values represent fulfillment order values.
            </Text>
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
  statsRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  statCard: {
    flex: 1,
    backgroundColor: colors.surfaceContainerLowest || '#FFFFFF',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border || '#C6C5D4',
    ...shadows.sm,
  },
  statLabel: { fontSize: typography.fontSize.xs, color: colors.textSecondary },
  statValue: { fontSize: 18, fontWeight: typography.fontWeight.bold, color: colors.textPrimary, marginVertical: 4 },
  statNote: { fontSize: 10, color: colors.textMuted },
  card: {
    backgroundColor: colors.surfaceContainerLowest || '#FFFFFF',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border || '#C6C5D4',
    ...shadows.sm,
  },
  sectionTitle: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.bold, color: colors.textPrimary, marginBottom: spacing.xs },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceContainerLow || '#F4F3F7',
  },
  infoLabel: { fontSize: typography.fontSize.xs, color: colors.textSecondary },
  infoValBold: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
  weeklySummaryBtn: {
    backgroundColor: colors.surfaceContainerLow || '#F4F3F7',
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.border || '#C6C5D4',
  },
  weeklySummaryBtnText: { color: colors.primaryContainer || colors.primary, fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.bold },
  pdfExportBtn: {
    backgroundColor: colors.primaryContainer || colors.primary,
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  pdfExportBtnText: { color: '#FFFFFF', fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.bold },
  disabledBtn: { opacity: 0.6 },
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLow || '#F4F3F7',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border || '#C6C5D4',
  },
  noticeText: { flex: 1, fontSize: 11, color: colors.textSecondary, lineHeight: 15 },
});

export default SalesAnalyticsScreen;
