import { StackScreenProps } from '@react-navigation/stack';
import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { PrimaryButton } from '../components/common/PrimaryButton';
import { borderRadius, colors, spacing, typography } from '../theme';
import { AppStackParamList } from '../types/navigation';

type Props = StackScreenProps<AppStackParamList, 'BookPlumber'>;

interface IssueItem {
  id: string;
  name: string;
  icon: string;
}

const issues: IssueItem[] = [
  { id: 'pipe', name: 'Pipe Leakage', icon: '🚰' },
  { id: 'tap', name: 'Tap Repair', icon: '🚿' },
  { id: 'toilet', name: 'Toilet Blockage', icon: '🚽' },
  { id: 'tank', name: 'Water Tank Issue', icon: '🛢️' },
  { id: 'motor', name: 'Motor Repair', icon: '⚙️' },
  { id: 'other', name: 'Other Issue', icon: '🛠️' },
];

export function BookPlumberScreen({ navigation }: Props) {
  const [selectedIssueId, setSelectedIssueId] = useState('pipe');
  const [scheduleOption, setScheduleOption] = useState<'now' | 'schedule'>('now');

  const handleContinue = () => {
    const selected = issues.find((i) => i.id === selectedIssueId);
    navigation.navigate('PlumberConfirmation', {
      issueType: selected ? selected.name : 'Plumbing Request',
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Book a Plumber</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>What's the issue?</Text>
        <View style={styles.grid}>
          {issues.map((item) => {
            const selected = selectedIssueId === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.gridCard, selected && styles.gridCardSelected]}
                onPress={() => setSelectedIssueId(item.id)}
                activeOpacity={0.8}
              >
                <View style={styles.iconCircle}>
                  <Text style={styles.emoji}>{item.icon}</Text>
                </View>
                <Text style={styles.cardLabel}>{item.name}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.sectionTitle, { marginTop: spacing.xl }]}>
          When do you need help?
        </Text>
        <View style={styles.scheduleOptions}>
          <TouchableOpacity
            style={[styles.radioCard, scheduleOption === 'now' && styles.radioCardSelected]}
            onPress={() => setScheduleOption('now')}
          >
            <View style={styles.radioLeft}>
              <View style={[styles.radioOuter, scheduleOption === 'now' && styles.radioOuterSelected]}>
                {scheduleOption === 'now' && <View style={styles.radioInner} />}
              </View>
              <View>
                <Text style={styles.radioTitle}>Now</Text>
                <Text style={styles.radioSub}>Within 15 mins</Text>
              </View>
            </View>
            <Text style={styles.accentText}>⚡ Fast</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.radioCard, scheduleOption === 'schedule' && styles.radioCardSelected]}
            onPress={() => setScheduleOption('schedule')}
          >
            <View style={styles.radioLeft}>
              <View style={[styles.radioOuter, scheduleOption === 'schedule' && styles.radioOuterSelected]}>
                {scheduleOption === 'schedule' && <View style={styles.radioInner} />}
              </View>
              <View>
                <Text style={styles.radioTitle}>Schedule</Text>
                <Text style={styles.radioSub}>Choose specific date & time</Text>
              </View>
            </View>
            <Text style={styles.accentText}>📅 Plan</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton
          title="Continue"
          onPress={handleContinue}
          style={styles.continueBtn}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.layout,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  backButtonText: {
    fontSize: 22,
    color: colors.textPrimary,
    fontWeight: 'bold',
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  scrollContent: {
    padding: spacing.layout,
    paddingBottom: spacing.huge,
  },
  sectionTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  gridCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    flexGrow: 1,
  },
  gridCardSelected: {
    borderColor: colors.primary,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  emoji: {
    fontSize: 24,
  },
  cardLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  scheduleOptions: {
    gap: spacing.sm,
  },
  radioCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  radioCardSelected: {
    borderColor: colors.primary,
  },
  radioLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.borderDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: colors.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  radioTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  radioSub: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
    marginTop: 2,
  },
  accentText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  footer: {
    padding: spacing.layout,
    borderTopWidth: 1.5,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  continueBtn: {
    width: '100%',
  },
});
