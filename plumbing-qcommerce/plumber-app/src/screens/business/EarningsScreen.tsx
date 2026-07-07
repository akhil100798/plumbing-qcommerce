import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { useDispatch, useSelector } from 'react-redux';

import { AppHeader } from '../../components/common/AppHeader';
import { ScreenWrapper } from '../../components/common/ScreenWrapper';
import { EarningsCard } from '../../components/cards/EarningsCard';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { earningsService } from '../../services/earnings/earningsService';
import { setEarningsData } from '../../redux/slices/earningsSlice';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { AppStackParamList } from '../../types/navigation';
import { RootState } from '../../redux/store';

type Props = StackScreenProps<AppStackParamList, 'Earnings' | any>;

export function EarningsScreen({ navigation }: Props) {
  const dispatch = useDispatch();
  const earnings = useSelector((state: RootState) => state.earnings);
  const [filter, setFilter] = useState<'Day' | 'Week' | 'Month'>('Day');
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const fetchEarningsStats = async () => {
      try {
        const data = await earningsService.fetchEarnings();
        dispatch(setEarningsData(data));
        setNotice(null);
      } catch (err) {
        console.error('Error fetching earnings details:', err);
        setNotice(err instanceof Error ? err.message : 'Earnings are not available in staging.');
      }
    };
    fetchEarningsStats();
  }, [dispatch]);

  const getPeriodEarnings = () => {
    switch (filter) {
      case 'Week':
        return {
          total: earnings.weeklyEarnings || 8450,
          service: earnings.serviceCommission * 5,
          material: earnings.materialCommission * 4,
          tips: earnings.tips * 4,
          jobs: earnings.jobsCompleted * 5,
        };
      case 'Month':
        return {
          total: (earnings.weeklyEarnings || 8450) * 4,
          service: earnings.serviceCommission * 20,
          material: earnings.materialCommission * 18,
          tips: earnings.tips * 15,
          jobs: earnings.jobsCompleted * 20,
        };
      case 'Day':
      default:
        return {
          total: earnings.todayEarnings,
          service: earnings.serviceCommission,
          material: earnings.materialCommission,
          tips: earnings.tips,
          jobs: earnings.jobsCompleted,
        };
    }
  };

  const periodStats = getPeriodEarnings();

  return (
    <ScreenWrapper>
      <AppHeader title="My Earnings" onBackPress={() => navigation.goBack()} />

      <View style={styles.container}>
        <View style={styles.filterRow}>
          {(['Day', 'Week', 'Month'] as const).map((period) => (
            <TouchableOpacity
              key={period}
              style={[styles.filterTab, filter === period && styles.filterTabActive]}
              onPress={() => setFilter(period)}
            >
              <Text style={[styles.filterText, filter === period && styles.filterTextActive]}>
                {period}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {!!notice && <Text style={styles.noticeText}>{notice}</Text>}
        <View style={styles.cardContainer}>
          <EarningsCard
            todayEarnings={periodStats.total}
            serviceCommission={periodStats.service}
            materialCommission={periodStats.material}
            tips={periodStats.tips}
            jobsCompleted={periodStats.jobs}
          />
        </View>

        <View style={styles.spacer} />

        <PrimaryButton
          title="View Wallet Transactions"
          onPress={() => navigation.navigate('Wallet')}
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
  noticeText: {
    fontSize: typography.fontSize.xs,
    color: colors.error,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.md,
  },
  filterRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: 4,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterTab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: borderRadius.sm,
  },
  filterTabActive: {
    backgroundColor: colors.primary,
  },
  filterText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.textSecondary,
  },
  filterTextActive: {
    color: colors.surface,
  },
  cardContainer: {
    marginBottom: spacing.xl,
  },
  spacer: {
    flex: 1,
  },
  actionBtn: {
    marginTop: 'auto',
  },
});
