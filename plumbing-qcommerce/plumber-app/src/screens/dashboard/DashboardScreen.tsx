import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { useDispatch, useSelector } from 'react-redux';

import { ScreenWrapper } from '../../components/common/ScreenWrapper';
import { setAvailability } from '../../redux/slices/authSlice';
import { RootState } from '../../redux/store';
import { dashboardService, PlumberDashboard } from '../../services/dashboard/dashboardService';
import { profileService } from '../../services/profile/profileService';
import { AppStackParamList } from '../../types/navigation';
import { borderRadius, colors, spacing, typography } from '../../theme';

type Props = StackScreenProps<AppStackParamList, 'Main'>;
const money = (value: number) => `₹${value.toFixed(0)}`;

export function DashboardScreen({ navigation }: Props) {
  const dispatch = useDispatch();
  const plumber = useSelector((state: RootState) => state.auth.plumber);
  const [dashboard, setDashboard] = useState<PlumberDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try { setDashboard(await dashboardService.fetch()); }
    catch (loadError) { setError(loadError instanceof Error ? loadError.message : 'Unable to load dashboard.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateAvailability = async (availability: boolean) => {
    dispatch(setAvailability(availability));
    try { await profileService.updateAvailability(availability); await load(); }
    catch (updateError) {
      dispatch(setAvailability(!availability));
      Alert.alert('Availability not updated', updateError instanceof Error ? updateError.message : 'Please retry.');
    }
  };

  if (loading) return <ScreenWrapper><View style={styles.center}><ActivityIndicator color={colors.primary} /><Text>Loading dashboard…</Text></View></ScreenWrapper>;
  if (error) return <ScreenWrapper><View style={styles.center}><Text style={styles.error}>{error}</Text><TouchableOpacity onPress={load}><Text style={styles.link}>Retry</Text></TouchableOpacity></View></ScreenWrapper>;
  if (!dashboard) return null;

  const name = dashboard.name || plumber?.fullName || 'Plumber';
  const rating = dashboard.rating == null ? 'No rating yet' : `${dashboard.rating.toFixed(1)} ★`;
  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}><View><Text style={styles.greeting}>Welcome</Text><Text style={styles.name}>{name}</Text></View><View style={styles.status}><Text>{dashboard.online ? 'Online' : 'Offline'}</Text><Switch value={dashboard.online} onValueChange={updateAvailability} /></View></View>
        <TouchableOpacity style={styles.earnings} onPress={() => navigation.navigate('Earnings')}><Text style={styles.light}>Today's earnings</Text><Text style={styles.amount}>{money(dashboard.todayEarnings)}</Text><Text style={styles.light}>{dashboard.completedJobs} completed jobs · {rating}</Text></TouchableOpacity>
        <Text style={styles.title}>Overview</Text>
        <View style={styles.row}><Metric label="Assigned" value={dashboard.assignedJobs} /><Metric label="Active" value={dashboard.activeJobs} /><Metric label="Completed" value={dashboard.completedJobs} /><Metric label="Cancelled" value={dashboard.cancelledJobs} /></View>
        <Text style={styles.title}>Upcoming job</Text>
        {dashboard.upcomingJob ? <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('ActiveJob', { jobId: String(dashboard.upcomingJob?.id) })}><Text style={styles.cardTitle}>{dashboard.upcomingJob.title || 'Service job'}</Text><Text>{dashboard.upcomingJob.customerName || 'Customer'}</Text><Text>{dashboard.upcomingJob.address || 'Location unavailable'}</Text><Text>{money(dashboard.upcomingJob.estimatedAmount)}</Text></TouchableOpacity> : <View style={styles.card}><Text>No jobs assigned yet.</Text><Text style={styles.muted}>New assignments will appear here.</Text></View>}
      </ScrollView>
    </ScreenWrapper>
  );
}

function Metric({ label, value }: { label: string; value: number }) { return <View style={styles.metric}><Text style={styles.metricValue}>{value}</Text><Text style={styles.muted}>{label}</Text></View>; }
const styles = StyleSheet.create({
  content: { padding: spacing.layout, gap: spacing.md }, center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm }, header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, greeting: { color: colors.textMuted }, name: { color: colors.textPrimary, fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold }, status: { alignItems: 'center' }, earnings: { backgroundColor: colors.primary, padding: spacing.lg, borderRadius: borderRadius.md }, light: { color: '#DBEAFE' }, amount: { color: '#fff', fontSize: 30, fontWeight: typography.fontWeight.black }, title: { fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.bold, color: colors.textPrimary }, row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }, metric: { minWidth: 72, flexGrow: 1, backgroundColor: colors.surface, borderRadius: borderRadius.sm, padding: spacing.sm, alignItems: 'center', borderWidth: 1, borderColor: colors.border }, metricValue: { color: colors.textPrimary, fontWeight: typography.fontWeight.bold }, muted: { color: colors.textMuted, fontSize: typography.fontSize.xs }, card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md, padding: spacing.md, gap: 4 }, cardTitle: { color: colors.textPrimary, fontWeight: typography.fontWeight.bold }, error: { color: colors.danger, textAlign: 'center' }, link: { color: colors.primary, fontWeight: typography.fontWeight.bold },
});
