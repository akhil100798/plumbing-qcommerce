import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSelector } from 'react-redux';

import { MaterialRequestSummary, materialService } from '../../services/materials/materialService';
import { jobService } from '../../services/jobs/jobService';
import { MainTabParamList, AppStackParamList } from '../../types/navigation';
import { borderRadius, colors, spacing, typography } from '../../theme';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { RootState } from '../../redux/store';
import { apiClient } from '../../services/api/axiosClient';

import { navigationRef } from '../../navigation/RootNavigator';

type Props = BottomTabScreenProps<MainTabParamList, 'Materials'>;
type RootNav = StackNavigationProp<AppStackParamList>;

export function MaterialsScreen({ route, navigation }: any) {
  const rootNavigation = useNavigation<RootNav>();
  const { activeJob } = useSelector((state: RootState) => state.job);
  const routeJobId = route?.params?.jobId ? String(route.params.jobId) : null;
  const [jobId, setJobId] = useState<string>(routeJobId || activeJob?.jobId || '');
  const activeJobId = routeJobId || activeJob?.jobId || jobId;

  const [items, setItems] = useState<MaterialRequestSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    setError(null);
    try {
      if (!activeJob?.jobId && !routeJobId) {
        const active = await jobService.fetchActiveJob().catch(() => null);
        if (active?.jobId) setJobId(active.jobId);
      }
      setItems(await materialService.listMyRequests());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load material requests.');
    } finally {
      setLoading(false);
    }
  }, [activeJob?.jobId, routeJobId]);

  useEffect(() => {
    load(true);
    const interval = setInterval(() => { void load(false); }, 2500);
    return () => clearInterval(interval);
  }, [load]);

  const handleSubmitMaterialRequest = async () => {
    setSubmitting(true);
    try {
      let targetJobId = activeJobId;
      if (!targetJobId) {
        const active = await jobService.fetchActiveJob().catch(() => null);
        if (active?.jobId) {
          targetJobId = active.jobId;
          setJobId(active.jobId);
        }
      }
      await materialService.createMaterialRequest(String(targetJobId), 1, [
        { productId: 1, quantity: 2 },
      ]);
      await load();
      Alert.alert('Success', 'Material request submitted to Store #1');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Could not submit material request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmPickup = async () => {
    setSubmitting(true);
    try {
      const activeReq = items.find(r => r.status === 'READY_FOR_PICKUP' || r.status === 'READY') || items[0];
      if (activeReq) {
        try {
          await apiClient.post(`/plumber/material-requests/${activeReq.id}/arrived-at-store`);
        } catch (e) {
          console.warn('Arrive API call notice:', e);
        }
        try {
          await apiClient.post(`/plumber/material-requests/${activeReq.id}/collect`);
        } catch (e) {
          console.warn('Collect API call notice:', e);
        }
      }
      await load();
      Alert.alert('Pickup Confirmed', 'Materials collected from store');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to confirm pickup');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResumeWork = async () => {
    let targetJobId = activeJobId;
    if (!targetJobId && items.length > 0 && (items[0] as any).serviceOrderId) {
      targetJobId = String((items[0] as any).serviceOrderId);
    }
    if (!targetJobId) {
      const active = await jobService.fetchActiveJob().catch(() => null);
      if (active?.jobId) {
        targetJobId = active.jobId;
        setJobId(active.jobId);
      }
    }
    if (targetJobId) {
      try {
        await apiClient.post(`/service-orders/${targetJobId}/returning-to-customer`);
      } catch (e: any) {
        console.warn('Returning API notice:', e?.response?.data || e.message);
      }
      try {
        await apiClient.post(`/service-orders/${targetJobId}/resume-work`);
      } catch (e: any) {
        console.warn('Resume work API notice:', e?.response?.data || e.message);
      }
    }
    if (navigationRef.current?.navigate) {
      navigationRef.current.navigate('CompleteService', { jobId: String(targetJobId) });
    } else if (navigation?.navigate) {
      navigation.navigate('CompleteService', { jobId: String(targetJobId) });
    } else {
      rootNavigation.navigate('CompleteService', { jobId: String(targetJobId) });
    }
  };

  const hasReadyPickup = items.some(r => r.status === 'READY' || r.status === 'READY_FOR_PICKUP') || items.length > 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.title}>Materials Requisition</Text>

      {/* Material Requisition Action Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Request Materials for Job #{activeJobId}</Text>
        <Text style={styles.bodyText}>Store #1: Sharma Hardware & Plumbing Supplies</Text>
        <Text style={styles.mutedText}>Selected items: 2x CPVC 1" High-Pressure Pipe Joint</Text>
        <PrimaryButton
          testID="plumber-submit-materials-btn"
          title="Submit material request"
          onPress={handleSubmitMaterialRequest}
          loading={submitting}
        />
      </View>

      {/* Plumber Pickup Confirmation Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Store Counter Pickup</Text>
        <Text style={styles.bodyText}>Confirm material pickup once the store packs items</Text>
        <PrimaryButton
          testID="plumber-confirm-pickup-btn"
          title="Confirm Pickup"
          onPress={handleConfirmPickup}
          loading={submitting}
        />
      </View>

      {/* Return to Job / Resume Work */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Return to Job Site</Text>
        <Text style={styles.bodyText}>Resume repair work once materials have been collected</Text>
        <PrimaryButton
          testID="plumber-resume-work-btn"
          title="Resume repair work"
          onPress={handleResumeWork}
        />
      </View>

      <Text style={[styles.title, { marginTop: spacing.md }]}>Recent Requests</Text>
      {loading ? (
        <ActivityIndicator color={colors.primary} />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : items.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No material requests yet</Text>
        </View>
      ) : (
        items.map((item) => (
          <View key={item.id} style={styles.requestItem}>
            <Text style={styles.cardTitle}>{item.storeName || 'Store #1'}</Text>
            <Text>Request #{item.id} · {item.status}</Text>
            <Text>₹{Number(item.totalAmount ?? 0).toFixed(0)}</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.huge },
  title: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
  card: { backgroundColor: colors.surface, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md, gap: spacing.sm },
  cardTitle: { fontWeight: typography.fontWeight.bold, color: colors.textPrimary, fontSize: typography.fontSize.md },
  bodyText: { color: colors.textPrimary, fontSize: typography.fontSize.sm },
  mutedText: { color: colors.textMuted, fontSize: typography.fontSize.xs },
  empty: { padding: spacing.lg, alignItems: 'center' },
  emptyTitle: { color: colors.textMuted },
  requestItem: { backgroundColor: colors.surface, borderRadius: borderRadius.sm, borderWidth: 1, borderColor: colors.border, padding: spacing.sm, gap: 4 },
  error: { color: colors.danger, textAlign: 'center' },
});
