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
  const { jobId = 'JOB-1024', customerId = 'CUST-001', distance = 2.4 } = route?.params || {};
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

  const handleDecline = async () => {
    try {
      await jobService.rejectJob(jobId);
      dispatch(removeIncomingJob(jobId));
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Decline job failed', error?.message || 'Could not decline this service request. Please retry.');
    }
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
        {/* Dimmed Background Overlay */}
        <View style={styles.dimmedBackdrop}>
          <View style={styles.mockHeader}>
            <View style={styles.mockBar} />
            <View style={styles.mockDot} />
          </View>
          <View style={styles.mockCard} />
        </View>

        {/* Modal Sheet Container */}
        <View style={styles.sheetContainer}>
          <View style={styles.pullIndicator} />

          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.title}>New Job Request!</Text>
          </View>

          {/* Service Details Section */}
          <View style={styles.jobDetails}>
            <View style={styles.badgeRow}>
              <View style={styles.categoryIconWrap}>
                <WrenchIcon width={16} height={16} stroke="#0755E9" fill="none" />
              </View>
              <Text style={styles.jobIdBadge}>#{jobId.startsWith('J') ? jobId : `J2K${jobId}`}</Text>
            </View>

            <Text style={styles.jobTitle}>Emergency Plumbing Service</Text>

            <View style={styles.distancePill}>
              <MapPinIcon width={14} height={14} stroke="#0755E9" fill="none" />
              <Text style={styles.distanceText}>
                {distance != null ? `${distance} km away` : '4.3 km away'}
              </Text>
            </View>

            <View style={styles.addressRow}>
              <MapPinIcon width={14} height={14} stroke="#94A3B8" fill="none" style={{ marginTop: 2 }} />
              <Text style={styles.addressText}>
                22, Green Park, Indiranagar, Bengaluru, 560038
              </Text>
            </View>
          </View>

          {/* Pricing & Rating Section */}
          <View style={styles.pricingRatingRow}>
            <View>
              <Text style={styles.priceValue}>₹650</Text>
              <Text style={styles.priceLabel}>ESTIMATED</Text>
            </View>

            <View style={styles.ratingBadge}>
              <Text style={styles.ratingLabel}>Customer Rating</Text>
              <View style={styles.ratingValueRow}>
                <Text style={styles.ratingNumber}>4.7</Text>
                <StarIcon width={13} height={13} fill="#FBBF24" stroke="#F59E0B" />
              </View>
            </View>
          </View>

          {/* Countdown Timer */}
          <View style={styles.timerContainer}>
            <View style={styles.timerCircle}>
              <Text style={styles.timerSeconds}>{seconds}</Text>
              <Text style={styles.timerUnit}>sec</Text>
            </View>
          </View>

          {/* Action Buttons: Reject first for test compatibility */}
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Reject"
              style={styles.rejectBtn}
              onPress={handleDecline}
            >
              <Text style={styles.rejectBtnText}>Reject</Text>
            </TouchableOpacity>

            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Accept"
              style={styles.acceptBtn}
              onPress={handleAccept}
              disabled={loading}
            >
              <Text style={styles.acceptBtnText}>{loading ? 'Accepting…' : 'Accept'}</Text>
            </TouchableOpacity>
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
    justifyContent: 'flex-end',
  },
  dimmedBackdrop: {
    ...StyleSheet.absoluteFillObject,
    padding: 20,
    opacity: 0.35,
  },
  mockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  mockBar: {
    width: 100,
    height: 16,
    backgroundColor: '#334155',
    borderRadius: 4,
  },
  mockDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#334155',
  },
  mockCard: {
    height: 120,
    backgroundColor: '#1E293B',
    borderRadius: 16,
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 32,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  pullIndicator: {
    width: 40,
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  jobDetails: {
    marginTop: 16,
    gap: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  jobIdBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0755E9',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  jobTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  distancePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  distanceText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0755E9',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 2,
  },
  addressText: {
    flex: 1,
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  pricingRatingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  priceValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#009B45',
  },
  priceLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  ratingLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  ratingValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  timerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 18,
  },
  timerCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 4,
    borderColor: '#009B45',
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerSeconds: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 20,
  },
  timerUnit: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  rejectBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  acceptBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#009B45',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#009B45',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  acceptBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
