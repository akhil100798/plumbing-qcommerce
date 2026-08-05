import React, { useState, useMemo } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
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
  { id: 'check', label: 'Check the problem clearly' },
  { id: 'confirm', label: 'Confirm the work & charges' },
];

export function StartWorkScreen({ route, navigation }: Props) {
  const dispatch = useDispatch();
  const { jobId } = route.params;
  const { activeJob } = useSelector((state: RootState) => state.job);
  const [loading, setLoading] = useState(false);

  const [checked, setChecked] = useState<{ [key: string]: boolean }>({
    explain: true,
    check: true,
    confirm: true,
  });
  const [discussed, setDiscussed] = useState(true);

  const toggle = (id: string) => setChecked((c) => ({ ...c, [id]: !c[id] }));

  const canStart = useMemo(
    () => CHECKLIST.every((i) => checked[i.id]) && discussed,
    [checked, discussed]
  );

  const customerName = activeJob?.customer.fullName || 'Anil Kumar';
  const customerInitial = customerName.charAt(0).toUpperCase();

  const handleStartWork = async () => {
    if (!canStart) {
      Alert.alert('Checklist Incomplete', 'Please check all items and confirm discussion with customer.');
      return;
    }

    setLoading(true);
    try {
      const updatedJob = await jobService.startWork(jobId);
      dispatch(setActiveJob(updatedJob));
      dispatch(
        updateJobStatus({
          status: 'started',
          timelineField: 'started',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        })
      );
      navigation.replace('BeforePhotos', { jobId });
    } catch (err: any) {
      // Proceed to photo capture fallback
      dispatch(
        updateJobStatus({
          status: 'started',
          timelineField: 'started',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        })
      );
      navigation.replace('BeforePhotos', { jobId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.flex}>
      <AppHeader title="Start Work" onBackPress={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.jobId}>#{jobId}</Text>
        <Text style={styles.jobTitle}>
          {activeJob ? 'Bathroom Pipe Leakage' : 'Bathroom Pipe Leakage'}
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

        <Text style={styles.sectionTitle}>Before you start</Text>
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
            label="I have discussed with customer"
            checked={discussed}
            onToggle={() => setDiscussed((d) => !d)}
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton
          title="Start Work"
          onPress={handleStartWork}
          loading={loading}
          disabled={!canStart}
          style={canStart ? styles.startBtn : styles.disabledBtn}
        />
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
  startBtn: {
    backgroundColor: colors.primary,
  },
  disabledBtn: {
    opacity: 0.5,
  },
});
