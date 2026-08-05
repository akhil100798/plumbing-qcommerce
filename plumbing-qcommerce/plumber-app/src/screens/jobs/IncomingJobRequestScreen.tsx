import React, { useEffect, useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { useDispatch } from 'react-redux';

import { ScreenWrapper } from '../../components/common/ScreenWrapper';
import { jobService } from '../../services/jobs/jobService';
import { setActiveJob, removeIncomingJob } from '../../redux/slices/jobSlice';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme';
import { AppStackParamList } from '../../types/navigation';
import MapPinIcon from '../../assets/icons/location-pin.svg';
import StarIcon from '../../assets/icons/star.svg';
import WrenchIcon from '../../assets/icons/active-job.svg';

type Props = StackScreenProps<AppStackParamList, 'IncomingJobRequest'>;

export function IncomingJobRequestScreen({ route, navigation }: Props) {
  const dispatch = useDispatch();
  const { jobId, customerId, distance } = route.params;
  const [seconds, setSeconds] = useState(21);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleDecline();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleDecline = () => {
    dispatch(removeIncomingJob(jobId));
    navigation.goBack();
  };

  const handleAccept = async () => {
    setLoading(true);
    try {
      const activeJobDetails = await jobService.acceptJob(jobId);
      dispatch(setActiveJob(activeJobDetails));
      setLoading(false);
      dispatch(removeIncomingJob(jobId));
      navigation.replace('ActiveJob', { jobId });
    } catch (error: any) {
      setLoading(false);
      Alert.alert('Accept job failed', error?.message || 'Could not accept this service request. Please retry.');
    }
  };

  return (
    <ScreenWrapper safeAreaStyle={{ backgroundColor: '#0F172A' }}>
      <View style={styles.container}>
        {/* Top Status Row */}
        <View style={styles.topRow}>
          <Text style={styles.onlineDot}>●</Text>
          <View style={styles.onlineBadge}>
            <Text style={styles.onlineText}>Online</Text>
          </View>
        </View>

        {/* Center Modal Card */}
        <View style={styles.cardContainer}>
          <View style={styles.card}>
            <Text style={styles.title}>New Job Request!</Text>

            <View style={styles.serviceRow}>
              <View style={styles.iconBg}>
                <WrenchIcon width={20} height={20} stroke={colors.primary} />
              </View>
              <View style={styles.serviceInfo}>
                <View style={styles.idRow}>
                  <Text style={styles.jobId}>#{jobId}</Text>
                  <MapPinIcon width={14} height={14} stroke={colors.textMuted} />
                </View>
                <Text style={styles.serviceName}>Water Heater Installation</Text>
              </View>
            </View>

            <View style={styles.locationBlock}>
              <Text style={styles.distanceText}>📍 {distance || 4.2} km away</Text>
              <Text style={styles.addressText}>
                22, Green Park, Indiranagar, Bengaluru, 560038
              </Text>
            </View>

            <View style={styles.detailsGrid}>
              <View>
                <Text style={styles.priceText}>₹650</Text>
                <Text style={styles.subText}>Estimated</Text>
              </View>

              <View style={styles.ratingBox}>
                <View style={styles.ratingRow}>
                  <Text style={styles.ratingVal}>4.7</Text>
                  <StarIcon width={14} height={14} fill="#F59E0B" stroke="#F59E0B" />
                </View>
                <Text style={styles.subText}>Customer Rating</Text>
              </View>

              {/* Countdown Timer Badge */}
              <View style={styles.timerCircle}>
                <Text style={styles.timerNumber}>{seconds}</Text>
                <Text style={styles.secLabel}>sec</Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.rejectBtn}
                onPress={handleDecline}
                disabled={loading}
              >
                <Text style={styles.rejectBtnText}>Reject</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.acceptBtn}
                onPress={handleAccept}
                disabled={loading}
              >
                <Text style={styles.acceptBtnText}>
                  {loading ? 'Accepting...' : 'Accept'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    padding: spacing.layout,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  onlineDot: {
    color: '#10B981',
    fontSize: 18,
  },
  onlineBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.xs,
  },
  onlineText: {
    color: '#059669',
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.lg,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.black,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  iconBg: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.xs,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  serviceInfo: {
    flex: 1,
  },
  idRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  jobId: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.textMuted,
  },
  serviceName: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginTop: 2,
  },
  locationBlock: {
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: borderRadius.xs,
    marginBottom: spacing.md,
  },
  distanceText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  addressText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: typography.lineHeight.tight,
  },
  detailsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  priceText: {
    fontSize: 22,
    fontWeight: typography.fontWeight.black,
    color: '#059669',
  },
  subText: {
    fontSize: 10,
    color: colors.textMuted,
  },
  ratingBox: {
    alignItems: 'center',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingVal: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  timerCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerNumber: {
    fontSize: 14,
    fontWeight: typography.fontWeight.black,
    color: colors.textPrimary,
  },
  secLabel: {
    fontSize: 8,
    color: colors.textMuted,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  rejectBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  rejectBtnText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textSecondary,
  },
  acceptBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: '#10B981',
    alignItems: 'center',
    ...shadows.md,
  },
  acceptBtnText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.surface,
  },
});
