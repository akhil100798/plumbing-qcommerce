import React, { useState, useMemo } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { useDispatch, useSelector } from 'react-redux';

import { AppHeader } from '../../components/common/AppHeader';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { jobService } from '../../services/jobs/jobService';
import { setActiveJob } from '../../redux/slices/jobSlice';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme';
import { AppStackParamList } from '../../types/navigation';
import { RootState } from '../../redux/store';
import { SvgActionCheck, SvgNavProfile } from '../../assets/svg';

type Props = StackScreenProps<AppStackParamList, 'StartWork'>;

const CHECKLIST = [
  { id: 'explain', label: 'Explain the issue to customer' },
  { id: 'check', label: 'Check the problem clearly' },
  { id: 'confirm', label: 'Confirm the work & charges' },
];

export function StartWorkScreen({ route, navigation }: Props) {
  const dispatch = useDispatch();
  const { jobId = 'JOB-1024' } = route?.params || {};
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

  const customerName = activeJob?.customer.fullName || 'Customer';

  const handleStartWork = async () => {
    if (!canStart) {
      Alert.alert('Checklist Incomplete', 'Please check all items and confirm discussion with customer.');
      return;
    }

    setLoading(true);
    try {
      const updatedJob = await jobService.startWork(jobId);
      dispatch(setActiveJob(updatedJob));
      navigation.replace('Diagnosis', { jobId });
    } catch (err: any) {
      Alert.alert('Could not start diagnosis', err?.message || 'The backend did not confirm arrival or diagnostic start. Refresh and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.flex}>
      <AppHeader
        title="Start Work"
        variant="blue"
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {/* Stitch Job Badge & Title */}
        <View style={styles.badgeWrap}>
          <Text style={styles.jobIdBadge}>#{jobId}</Text>
        </View>
        <Text style={styles.jobTitle}>
          {activeJob?.issueDescription || activeJob?.customerNote || 'Bathroom Pipe Leakage'}
        </Text>

        {/* Stitch Customer Info Card */}
        <View style={styles.customerCard}>
          <View style={styles.avatarWrap}>
            <SvgNavProfile width={24} height={24} fill="#94A3B8" />
          </View>
          <View style={styles.customerMeta}>
            <Text style={styles.customerLabel}>Customer</Text>
            <Text style={styles.customerName}>{customerName}</Text>
          </View>
        </View>

        {/* Stitch "Before you start" Checklist */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionTitle}>Before you start</Text>
          <View style={styles.checklistList}>
            {CHECKLIST.map((item) => {
              const isChecked = !!checked[item.id];
              return (
                <TouchableOpacity
                  key={item.id}
                  style={styles.checkItemRow}
                  onPress={() => toggle(item.id)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.checkCircle, isChecked && styles.checkCircleActive]}>
                    <SvgActionCheck width={10} height={10} fill="#10B981" />
                  </View>
                  <Text style={styles.checkItemLabel}>{item.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Stitch Discussion Confirmation Checkbox */}
        <TouchableOpacity
          style={styles.discussConfirmationRow}
          onPress={() => setDiscussed((d) => !d)}
          activeOpacity={0.8}
        >
          <View style={[styles.checkboxBox, discussed && styles.checkboxBoxChecked]}>
            {discussed && <SvgActionCheck width={12} height={12} fill="#FFFFFF" />}
          </View>
          <Text style={styles.discussConfirmationText}>I have discussed with customer</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Stitch Fixed CTA Button */}
      <View style={styles.footer}>
        <PrimaryButton
          title="Start Work"
          onPress={handleStartWork}
          loading={loading}
          disabled={!canStart}
          variant="blue"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  body: {
    padding: 20,
    paddingBottom: 32,
  },
  badgeWrap: {
    alignSelf: 'flex-start',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  jobIdBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.stitchBlue,
    letterSpacing: 0.5,
  },
  jobTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 28,
    letterSpacing: -0.4,
    marginBottom: 20,
  },
  customerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 24,
    ...shadows.sm,
  },
  avatarWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  customerMeta: {
    flex: 1,
  },
  customerLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  customerName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 1,
  },
  sectionWrap: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  checklistList: {
    gap: 12,
  },
  checkItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  checkCircleActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
  },
  checkItemLabel: {
    fontSize: 13,
    color: '#475569',
    flex: 1,
  },
  discussConfirmationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  checkboxBoxChecked: {
    backgroundColor: colors.stitchBlue,
    borderColor: colors.stitchBlue,
  },
  discussConfirmationText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  footer: {
    padding: 20,
    paddingBottom: 28,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
});
