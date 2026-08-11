import React, { useState, useMemo } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { useDispatch, useSelector } from 'react-redux';

import { AppHeader } from '../../components/common/AppHeader';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { ChecklistItem } from '../../components/forms/ChecklistItem';
import { jobService } from '../../services/jobs/jobService';
import { setActiveJob, updateJobStatus } from '../../redux/slices/jobSlice';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme';
import { AppStackParamList } from '../../types/navigation';
import { RootState } from '../../redux/store';

type Props = StackScreenProps<AppStackParamList, 'StartWork'>;

const CHECKLIST = [
  { id: 'explain', label: 'Explain the issue to customer' },
  { id: 'rate', label: 'Show rate card for additional labor' },
  { id: 'estimate', label: 'Agree on total cost & work scope' },
];

export function StartWorkScreen({ route, navigation }: Props) {
  const { jobId } = route.params;
  const dispatch = useDispatch();
  const activeJob = useSelector((state: RootState) => state.job.activeJob);

  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [discussed, setDiscussed] = useState(false);
  const [loading, setLoading] = useState(false);

  const toggle = (id: string) => {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const canStart = useMemo(() => {
    return (
      CHECKLIST.every((item) => !!checked[item.id]) && discussed
    );
  }, [checked, discussed]);

  const customerName = activeJob?.customer.fullName || 'Anil Kumar';
  const customerInitial = customerName.charAt(0).toUpperCase();

  const handleStartWorkDirect = async () => {
    if (!canStart) {
      Alert.alert(
        'Checklist Incomplete',
        'Please complete all inspection checklist items and confirm diagnosis with customer.'
      );
      return;
    }
    setLoading(true);
    try {
      await (jobService as any).startWork?.(jobId);
      dispatch(
        updateJobStatus({
          status: 'started',
          timelineField: 'started',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        })
      );
      if (activeJob) {
        dispatch(setActiveJob({ ...activeJob, status: 'started' }));
      }
      navigation.navigate('ActiveJob', { jobId });
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to start job.');
    } finally {
      setLoading(false);
    }
  };

  const handleMaterialsRequired = () => {
    dispatch(
      updateJobStatus({
        status: 'started' as any,
        timelineField: 'started',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      })
    );
    // Handoff to Phase 5 Material Selection Flow
    navigation.navigate('MaterialRequest', { jobId, storeId: 1, storeName: 'Central Hardware Hub' });
  };

  return (
    <SafeAreaView style={styles.flex}>
      <AppHeader title="Inspection & Diagnosis" onBackPress={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.jobId}>#{jobId}</Text>
        <Text style={styles.jobTitle}>
          {activeJob?.issueDescription || 'Plumbing Diagnosis & Inspection'}
        </Text>

        <View style={styles.customerCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarInitial}>{customerInitial}</Text>
          </View>
          <View>
            <Text style={styles.customerLabel}>Customer</Text>
            <Text style={styles.customerName}>{customerName}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Inspection Checklist</Text>
        <View style={styles.checklistCard}>
          {CHECKLIST.map((item) => (
            <ChecklistItem
              key={item.id}
              label={item.label}
              checked={!!checked[item.id]}
              onToggle={() => toggle(item.id)}
            />
          ))}
        </View>

        <View style={styles.confirmRow}>
          <ChecklistItem
            label="I have explained the diagnosis to customer"
            checked={discussed}
            onToggle={() => setDiscussed((d) => !d)}
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.decisionLabel}>Work & Material Decision</Text>
        <View style={styles.decisionRow}>
          <TouchableOpacity
            style={styles.materialsBtn}
            onPress={handleMaterialsRequired}
          >
            <Text style={styles.materialsBtnText}>🛒 Materials Required</Text>
          </TouchableOpacity>

          <PrimaryButton
            title={loading ? 'Starting...' : '🔧 Start Direct Work'}
            onPress={handleStartWorkDirect}
            loading={loading}
            disabled={!canStart}
            style={canStart ? styles.startBtn : styles.disabledBtn}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  body: { padding: spacing.lg, paddingBottom: spacing.giant },
  jobId: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.bold, color: colors.primary, marginBottom: 2 },
  jobTitle: { fontSize: 22, fontWeight: typography.fontWeight.black, color: colors.textPrimary, marginBottom: spacing.lg },
  customerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarInitial: { fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.bold, color: '#FFFFFF' },
  customerLabel: { fontSize: typography.fontSize.xs, color: colors.textMuted },
  customerName: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
  sectionTitle: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.bold, color: colors.textPrimary, marginBottom: spacing.xs },
  checklistCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  confirmRow: {
    marginTop: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  decisionLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.textMuted,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
  },
  decisionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  materialsBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    backgroundColor: colors.warningContainer || '#FFDDBA',
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.warning || '#865200',
  },
  materialsBtnText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.warning || '#865200',
  },
  startBtn: {
    flex: 1.2,
    backgroundColor: colors.primary,
  },
  disabledBtn: {
    flex: 1.2,
    opacity: 0.5,
  },
});
