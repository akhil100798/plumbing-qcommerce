import { StackScreenProps } from '@react-navigation/stack';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';


import MapView, { Marker, Polyline } from 'react-native-maps';

import { PrimaryButton } from '../components/common/PrimaryButton';
import { borderRadius, colors, shadows, spacing, typography } from '../theme';
import { AppStackParamList } from '../types/navigation';

type Props = StackScreenProps<AppStackParamList, 'OrderTracking'>;

interface TrackingStep {
  title: string;
  time?: string;
  completed: boolean;
  active: boolean;
}

export function OrderTrackingScreen({ route, navigation }: Props) {
  const { orderId } = route.params;
  const [otp, setOtp] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [status, setStatus] = useState<'OUT_FOR_DELIVERY' | 'DELIVERED'>('OUT_FOR_DELIVERY');

  const steps: TrackingStep[] = [
    { title: 'Order Confirmed', time: 'Today, 09:15 AM', completed: true, active: false },
    { title: 'Packed', time: 'Today, 09:30 AM', completed: true, active: false },
    {
      title: 'Out for Delivery',
      time: 'Today, 09:35 AM',
      completed: status === 'DELIVERED',
      active: status === 'OUT_FOR_DELIVERY',
    },
    { title: 'Delivered', time: status === 'DELIVERED' ? 'Today, 09:50 AM' : 'Yet to deliver', completed: status === 'DELIVERED', active: false },
  ];

  const handleVerifyOtp = () => {
    if (otp.length < 4) return;

    setVerifying(true);
    setTimeout(() => {
      setVerifying(false);
      setStatus('DELIVERED');
      Alert.alert('Delivery Confirmed', 'The package has been verified and marked as delivered successfully.');
    }, 1200);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Order #{orderId}</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.banner}>
            <Text style={styles.bannerLabel}>Estimated Delivery</Text>
            <Text style={styles.bannerTime}>20-35 mins</Text>
          </View>

          {/* Proximity Map Panel */}
          <View style={styles.mapPanel}>
            <MapView
              style={styles.map}
              initialRegion={{
                latitude: 17.4485,
                longitude: 78.3741,
                latitudeDelta: 0.015,
                longitudeDelta: 0.015,
              }}
              scrollEnabled={false}
              zoomEnabled={false}
            >
              <Marker
                coordinate={{ latitude: 17.4485, longitude: 78.3741 }}
                title="Your Location"
              />
              <Marker
                coordinate={{ latitude: 17.4520, longitude: 78.3800 }}
                title="Delivery Partner"
                pinColor={colors.primary}
              />
              <Polyline
                coordinates={[
                  { latitude: 17.4485, longitude: 78.3741 },
                  { latitude: 17.4520, longitude: 78.3800 }
                ]}
                strokeColor={colors.primary}
                strokeWidth={4}
              />
            </MapView>
            <View style={styles.etaBadge}>
              <Text style={styles.etaNumber}>15 min</Text>
              <Text style={styles.etaLabel}>Estimated arrival</Text>
            </View>
          </View>


          {/* Stepper Timeline checklist */}
          <View style={styles.timelineCard}>
            <Text style={styles.timelineHeader}>DELIVERY PROGRESS</Text>
            <View style={styles.timeline}>
              {steps.map((step, idx) => (
                <View key={idx} style={styles.timelineRow}>
                  <View style={styles.timelineIndicator}>
                    <View
                      style={[
                        styles.indicatorDot,
                        step.completed && styles.dotCompleted,
                        step.active && styles.dotActive,
                      ]}
                    >
                      {step.completed && <Text style={styles.checkIcon}>✓</Text>}
                    </View>
                    {idx < steps.length - 1 && <View style={styles.indicatorLine} />}
                  </View>
                  <View style={styles.timelineCopy}>
                    <Text
                      style={[
                        styles.stepTitle,
                        step.active && styles.stepTitleActive,
                        !step.completed && !step.active && styles.stepTitleMuted,
                      ]}
                    >
                      {step.title}
                    </Text>
                    {step.time && <Text style={styles.stepTime}>{step.time}</Text>}
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Delivery Partner Profile Card */}
          <View style={styles.partnerCard}>
            <View style={styles.partnerInfo}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>D</Text>
              </View>
              <View>
                <Text style={styles.partnerName}>Ravi Kumar</Text>
                <Text style={styles.partnerMeta}>Your Delivery Partner • ⭐ 4.8</Text>
              </View>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.actionCircleBtn}
                onPress={() => Linking.openURL('tel:+919876543210').catch(() => alert('Helpline call failed'))}
              >
                <Text style={styles.actionEmoji}>📞</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionCircleBtn}
                onPress={() => navigation.navigate('Chat', { name: 'Ravi Kumar', role: 'Delivery Partner' })}
              >
                <Text style={styles.actionEmoji}>💬</Text>
              </TouchableOpacity>
            </View>

          </View>

          {/* OTP Verification widget if package is out for delivery */}
          {status === 'OUT_FOR_DELIVERY' && (
            <View style={styles.otpCard}>
              <Text style={styles.otpLabel}>Verify Delivery OTP</Text>
              <Text style={styles.otpSub}>Ask the rider for the 4-digit code to complete the order.</Text>
              <View style={styles.otpRow}>
                <TextInput
                  style={styles.otpInput}
                  placeholder="e.g. 1234"
                  maxLength={4}
                  keyboardType="number-pad"
                  value={otp}
                  onChangeText={(val) => setOtp(val.replace(/[^0-9]/g, ''))}
                />
                <PrimaryButton
                  title="Confirm"
                  onPress={handleVerifyOtp}
                  loading={verifying}
                  disabled={otp.length < 4}
                  style={styles.confirmBtn}
                />
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
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
  banner: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  bannerLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: typography.fontWeight.bold,
    textTransform: 'uppercase',
  },
  bannerTime: {
    fontSize: typography.fontSize.lg,
    color: colors.surface,
    fontWeight: typography.fontWeight.black,
    marginTop: 2,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapPanel: {
    height: 200,
    borderRadius: borderRadius.md,
    backgroundColor: '#D7E7DD',
    marginBottom: spacing.md,
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },

  routeLine: {
    position: 'absolute',
    left: 80,
    right: 80,
    height: 4,
    backgroundColor: colors.primary,
    borderRadius: 2,
    opacity: 0.6,
  },
  mapPin: {
    position: 'absolute',
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 3,
    borderColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  customerPin: {
    left: 40,
    backgroundColor: colors.textPrimary,
  },
  partnerPin: {
    right: 40,
    backgroundColor: colors.primary,
  },
  pinText: {
    color: colors.surface,
    fontSize: 10,
    fontWeight: 'bold',
  },
  etaBadge: {
    position: 'absolute',
    bottom: spacing.sm,
    alignSelf: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 9999,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  etaNumber: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  etaLabel: {
    fontSize: 8,
    color: colors.textMuted,
    fontWeight: typography.fontWeight.bold,
    textTransform: 'uppercase',
  },
  timelineCard: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  timelineHeader: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  timeline: {
    gap: spacing.md,
  },
  timelineRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  timelineIndicator: {
    alignItems: 'center',
  },
  indicatorDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.borderDark,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotCompleted: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  dotActive: {
    backgroundColor: colors.surface,
    borderColor: colors.primary,
    borderWidth: 3,
  },
  checkIcon: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: 'bold',
  },
  indicatorLine: {
    width: 2,
    height: 36,
    backgroundColor: colors.border,
    marginTop: 4,
  },
  timelineCopy: {
    flex: 1,
    justifyContent: 'center',
  },
  stepTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  stepTitleActive: {
    color: colors.primary,
  },
  stepTitleMuted: {
    color: colors.textMuted,
  },
  stepTime: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
    marginTop: 2,
  },
  partnerCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  partnerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
  partnerName: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  partnerMeta: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background,
    borderWidth: 1.5,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionEmoji: {
    fontSize: 16,
  },
  otpCard: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  otpLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  otpSub: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
    marginTop: 2,
    marginBottom: spacing.md,
  },
  otpRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  otpInput: {
    flex: 1,
    height: 52,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    backgroundColor: colors.background,
    textAlign: 'center',
  },
  confirmBtn: {
    minWidth: 100,
  },
});
