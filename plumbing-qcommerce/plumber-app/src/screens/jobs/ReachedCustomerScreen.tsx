import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { useSelector, useDispatch } from 'react-redux';

import { AppHeader } from '../../components/common/AppHeader';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme';
import { AppStackParamList } from '../../types/navigation';
import { RootState } from '../../redux/store';
import { jobService } from '../../services/jobs/jobService';
import { updateJobStatus } from '../../redux/slices/jobSlice';
import CheckIcon from '../../assets/icons/success-check.svg';
import PhoneIcon from '../../assets/icons/phone.svg';
import { SvgPlumbHouseBuilding } from '../../assets/svg';

type Props = StackScreenProps<AppStackParamList, 'ReachedCustomer'>;

export function ReachedCustomerScreen({ route, navigation }: Props) {
  const dispatch = useDispatch();
  const { jobId = 'JOB-1024' } = route?.params || {};
  const { activeJob } = useSelector((state: RootState) => state.job);
  const [loading, setLoading] = useState(false);

  const handleConfirmArrival = async () => {
    setLoading(true);
    try {
      await jobService.markArrived(jobId);
      dispatch(
        updateJobStatus({
          status: 'reached',
          timelineField: 'reached',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        })
      );
      navigation.replace('StartWork', { jobId });
    } catch (err: any) {
      Alert.alert('Arrival not recorded', err?.message || 'The backend did not confirm arrival. Try again before starting diagnosis.');
    } finally {
      setLoading(false);
    }
  };

  const handleContactCustomer = () => {
    const phone = activeJob?.customer.phone;
    if (!phone) {
      Alert.alert('Phone unavailable', 'The customer phone number was not provided by the server.');
      return;
    }
    Alert.alert('Contact Customer', `Calling customer at ${phone}`);
  };

  return (
    <SafeAreaView style={styles.flex}>
      <AppHeader
        title="Reached Customer"
        variant="green"
        onBackPress={() => navigation.goBack()}
      />

      <View style={styles.body}>
        {/* Stitch Concentric Radar Circles with Destination Illustration */}
        <View style={styles.illustrationWrap}>
          <View style={styles.outerRing} />
          <View style={styles.middleRing} />
          <View style={styles.innerCircle}>
            <SvgPlumbHouseBuilding width={96} height={80} />
          </View>
          {/* Top Overlaid Green Checkmark Badge */}
          <View style={styles.checkmarkBadge}>
            <CheckIcon width={22} height={22} stroke="#FFFFFF" />
          </View>
        </View>

        <Text style={styles.title}>You have reached the{'\n'}customer location</Text>
        <Text style={styles.subtitle}>Please confirm to start the service.</Text>
      </View>

      <View style={styles.footer}>
        <PrimaryButton
          title="Confirm Arrival"
          onPress={handleConfirmArrival}
          loading={loading}
          variant="green"
        />
        <TouchableOpacity
          style={styles.contactBtn}
          onPress={handleContactCustomer}
          activeOpacity={0.8}
        >
          <PhoneIcon width={16} height={16} stroke="#374151" />
          <Text style={styles.contactBtnText}>Contact Customer</Text>
        </TouchableOpacity>
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
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  illustrationWrap: {
    width: 224,
    height: 224,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    position: 'relative',
  },
  outerRing: {
    position: 'absolute',
    width: 224,
    height: 224,
    borderRadius: 112,
    backgroundColor: 'rgba(236, 253, 245, 0.7)',
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  middleRing: {
    position: 'absolute',
    width: 176,
    height: 176,
    borderRadius: 88,
    backgroundColor: 'rgba(209, 250, 229, 0.5)',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  innerCircle: {
    width: 144,
    height: 144,
    borderRadius: 72,
    backgroundColor: '#F0F9FF',
    borderWidth: 4,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
    overflow: 'hidden',
  },
  checkmarkBadge: {
    position: 'absolute',
    top: 4,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.stitchGreen,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    lineHeight: 28,
    letterSpacing: -0.3,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 36,
    gap: 12,
    backgroundColor: '#FFFFFF',
  },
  contactBtn: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  contactBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
});
