import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';

import { AppHeader } from '../../components/common/AppHeader';
import { earningsService } from '../../services/earnings/earningsService';
import { AppStackParamList } from '../../types/navigation';
import { borderRadius, colors, spacing, typography } from '../../theme';

type Props = StackScreenProps<AppStackParamList, 'Earnings'>;
type Earnings = Awaited<ReturnType<typeof earningsService.fetchEarnings>>;
const money = (value: number) => `₹${value.toFixed(0)}`;

export function EarningsScreen({ navigation }: Props) {
  const [earnings, setEarnings] = useState<Earnings | null>(null);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => { try { setError(null); setEarnings(await earningsService.fetchEarnings()); } catch (loadError) { setError(loadError instanceof Error ? loadError.message : 'Unable to load earnings.'); } }, []);
  useEffect(() => { load(); }, [load]);
  return <View style={styles.container}><AppHeader title="Earnings" onBackPress={() => navigation.navigate('Main')} />{!earnings && !error ? <View style={styles.center}><ActivityIndicator color={colors.primary} /></View> : error ? <View style={styles.center}><Text style={styles.error}>{error}</Text><TouchableOpacity onPress={load} accessibilityRole="button" accessibilityLabel="Retry loading earnings"><Text style={styles.retry}>Retry</Text></TouchableOpacity></View> : <ScrollView contentContainerStyle={styles.body}><View style={styles.card}><Text style={styles.label}>This week</Text><Text style={styles.total}>{money(earnings?.weeklyEarnings ?? 0)}</Text><Text style={styles.note}>Based on completed jobs only.</Text></View><View style={styles.grid}><Item label="Today" value={money(earnings?.todayEarnings ?? 0)} /><Item label="Completed jobs" value={String(earnings?.jobsCompleted ?? 0)} /><Item label="Service earnings" value={money(earnings?.serviceCommission ?? 0)} /><Item label="Material commission" value={money(earnings?.materialCommission ?? 0)} /></View><TouchableOpacity style={styles.wallet} onPress={() => navigation.navigate('Wallet')} accessibilityRole="button" accessibilityLabel="View wallet and transactions"><Text style={styles.retry}>View wallet and transactions</Text></TouchableOpacity></ScrollView>}</View>;
}
function Item({ label, value }: { label: string; value: string }) { return <View style={styles.item}><Text style={styles.label}>{label}</Text><Text style={styles.value}>{value}</Text></View>; }
const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: colors.background }, body: { padding: spacing.md, gap: spacing.md }, center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm }, card: { padding: spacing.lg, backgroundColor: colors.primaryDark, borderRadius: borderRadius.md }, label: { color: colors.textSecondary, fontSize: typography.fontSize.xs }, total: { color: '#fff', fontSize: 32, fontWeight: typography.fontWeight.black }, note: { color: '#DBEAFE', fontSize: typography.fontSize.xs }, grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }, item: { width: '47%', padding: spacing.md, borderRadius: borderRadius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }, value: { color: colors.textPrimary, fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.bold, marginTop: 4 }, error: { color: colors.danger, textAlign: 'center' }, retry: { color: colors.primary, fontWeight: typography.fontWeight.bold }, wallet: { padding: spacing.md, alignItems: 'center', borderWidth: 1, borderColor: colors.primary, borderRadius: borderRadius.md } });
