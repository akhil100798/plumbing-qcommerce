import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { useDispatch, useSelector } from 'react-redux';

import { AppHeader } from '../../components/common/AppHeader';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { ScreenWrapper } from '../../components/common/ScreenWrapper';
import { CustomerCard } from '../../components/cards/CustomerCard';
import { jobService } from '../../services/jobs/jobService';
import { updateJobStatus } from '../../redux/slices/jobSlice';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { AppStackParamList } from '../../types/navigation';
import { RootState } from '../../redux/store';

type Props = StackScreenProps<AppStackParamList, 'StartWork'>;

export function StartWorkScreen({ route, navigation }: Props) {
  const dispatch = useDispatch();
  const { activeJob } = useSelector((state: RootState) => state.job);
  
  const [checklist, setChecklist] = useState([
    { id: 1, text: 'Greet the customer', checked: true },
    { id: 2, text: 'Understand the issue clearly', checked: true },
    { id: 3, text: 'Show estimate if material required', checked: false },
  ]);

  const toggleCheck = (id: number) => {
    setChecklist((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };

  const handleStartWork = async () => {
    if (!checklist[0].checked || !checklist[1].checked) {
      alert('Please check at least the first two items before starting.');
      return;
    }

    if (activeJob) {
      const updatedJob = await jobService.startWork(activeJob.jobId);
      dispatch(
        updateJobStatus({
          status: 'started',
          timelineField: 'started',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        })
      );
      // Navigate to before photos upload
      navigation.replace('BeforePhotos', { jobId: activeJob.jobId });
    }
  };

  if (!activeJob) return null;

  return (
    <ScreenWrapper>
      <AppHeader title={`Job #${activeJob.jobId}`} onBackPress={() => navigation.goBack()} />
      
      <View style={styles.container}>
        <Text style={styles.sectionLabel}>Before you start</Text>
        
        <View style={styles.checklistCard}>
          {checklist.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.checkRow}
              onPress={() => toggleCheck(item.id)}
            >
              <View style={[styles.checkbox, item.checked && styles.checkboxChecked]}>
                {item.checked && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={[styles.checkText, item.checked && styles.checkTextChecked]}>
                {item.text}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionLabel}>Customer Details</Text>
        <View style={styles.customerWrapper}>
          <CustomerCard
            name={activeJob.customer.fullName}
            rating={activeJob.customer.rating}
            showActions={false}
          />
        </View>

        <View style={styles.confirmationBox}>
          <Text style={styles.confirmationTitle}>Confirmation Required</Text>
          <Text style={styles.confirmationSub}>
            Start the work after customer has confirmed the estimate and scope of work.
          </Text>
        </View>

        <View style={styles.spacer} />

        <PrimaryButton
          title="Start Work"
          onPress={handleStartWork}
          style={styles.actionBtn}
        />
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.layout,
    backgroundColor: colors.background,
  },
  sectionLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  checklistCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 1.5,
    borderColor: colors.borderDark,
    borderRadius: borderRadius.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  checkmark: {
    color: colors.surface,
    fontSize: 13,
    fontWeight: 'bold',
  },
  checkText: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.semibold,
  },
  checkTextChecked: {
    color: colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  customerWrapper: {
    marginBottom: spacing.lg,
  },
  confirmationBox: {
    backgroundColor: colors.primaryLight,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  confirmationTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
    marginBottom: 2,
  },
  confirmationSub: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    lineHeight: typography.lineHeight.tight,
  },
  spacer: {
    flex: 1,
  },
  actionBtn: {
    backgroundColor: colors.success,
  },
});
