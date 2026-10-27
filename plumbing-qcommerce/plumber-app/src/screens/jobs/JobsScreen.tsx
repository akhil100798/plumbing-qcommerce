import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { StackNavigationProp } from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/native';

import { apiClient } from '../../services/api/axiosClient';
import { MainTabParamList, AppStackParamList } from '../../types/navigation';
import { borderRadius, colors, shadows, spacing, typography } from '../../theme';
import { AppHeader } from '../../components/common/AppHeader';
import { SvgPlumbWrench } from '../../assets/svg';

interface ServiceOrderSummary {
  jobId?: number;
  id?: number;
  description?: string;
  status: string;
  totalAmount?: number | null;
}

type Props = BottomTabScreenProps<MainTabParamList, 'Jobs'>;
type RootNavigation = StackNavigationProp<AppStackParamList>;

export function JobsScreen(_: Props) {
  const navigation = useNavigation<RootNavigation>();
  const [jobs, setJobs] = useState<ServiceOrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<ServiceOrderSummary[]>('/orders/plumber');
      setJobs(response.data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load jobs.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.stitchBlue} size="large" />
        <Text style={styles.loadingText}>Loading jobs…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={load}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={jobs}
        keyExtractor={(job, index) => String(job.jobId ?? job.id ?? index)}
        contentContainerStyle={jobs.length ? styles.list : styles.empty}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const targetJobId = item.jobId ?? item.id;
          const isDone = item.status?.toUpperCase() === 'COMPLETED';
          const isCancelled = item.status?.toUpperCase() === 'CANCELLED';
          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => {
                if (targetJobId != null) {
                  navigation.navigate('ActiveJob', { jobId: String(targetJobId) });
                }
              }}
              activeOpacity={0.7}
            >
              <View style={styles.cardLeft}>
                <View style={styles.iconCircle}>
                  <SvgPlumbWrench width={18} height={18} stroke={colors.stitchBlue} fill="none" />
                </View>
                <View style={styles.cardMeta}>
                  <Text style={styles.jobId}>#{targetJobId || 'JOB'}</Text>
                  <Text style={styles.cardTitle}>{item.description || 'Plumbing Service'}</Text>
                  <Text style={styles.amount}>₹{Number(item.totalAmount ?? 0).toFixed(0)}</Text>
                </View>
              </View>

              <View style={styles.cardRight}>
                <View
                  style={[
                    styles.statusBadge,
                    isDone ? styles.badgeSuccess : isCancelled ? styles.badgeDanger : styles.badgeActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      isDone
                        ? styles.statusSuccessText
                        : isCancelled
                        ? styles.statusDangerText
                        : styles.statusActiveText,
                    ]}
                  >
                    {item.status}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No jobs assigned yet</Text>
            <Text style={styles.emptyText}>New jobs assigned to you will appear here.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 10,
  },
  error: {
    color: '#EF4444',
    textAlign: 'center',
    fontSize: 14,
    marginBottom: 12,
  },
  retryBtn: {
    backgroundColor: colors.stitchBlue,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  list: {
    padding: 16,
    gap: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    ...shadows.sm,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardMeta: {
    flex: 1,
  },
  jobId: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 2,
    lineHeight: 18,
  },
  amount: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.stitchBlue,
    marginTop: 3,
  },
  cardRight: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  badgeSuccess: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  badgeDanger: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  badgeActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#DBEAFE',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  statusSuccessText: {
    color: '#059669',
  },
  statusDangerText: {
    color: '#DC2626',
  },
  statusActiveText: {
    color: colors.stitchBlue,
  },
  empty: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyContainer: {
    alignItems: 'center',
  },
  emptyTitle: {
    color: '#1E293B',
    fontWeight: '700',
    fontSize: 15,
    textAlign: 'center',
  },
  emptyText: {
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 4,
    fontSize: 13,
  },
});
