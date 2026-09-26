import { StackScreenProps } from '@react-navigation/stack';
import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import MapView, { Marker, Polyline } from 'react-native-maps';

import { SecondaryButton } from '../components/common/SecondaryButton';
import { PrimaryButton } from '../components/common/PrimaryButton';
import { canUseDevMockFallbacks } from '../services/mockPolicy';
import { borderRadius, colors, spacing, typography } from '../theme';
import { AppStackParamList } from '../types/navigation';
import { AppIcon } from '../components/common/AppIcon';
import { LiveTrackingCard } from '../components/tracking/LiveTrackingCard';
import { TrackingStatusStepper } from '../components/tracking/TrackingStatusStepper';
import { PulsingLocationMarker } from '../components/tracking/PulsingLocationMarker';
import ArrowLeftIcon from '../assets/icons/arrow-left.svg';
import { OrderRepository } from '../services/orders/orderRepository';
import { CartRepository } from '../services/cart/cartRepository';

type Props = StackScreenProps<AppStackParamList, 'PlumberTracking'>;

interface MaterialPaymentRequest {
  productOrderId: number;
  serviceOrderId: number;
  plumberName: string;
  totalAmount: number;
}

export function PlumberTrackingScreen({ route, navigation }: Props) {
  const { orderId, plumberName } = route.params;
  const devMode = canUseDevMockFallbacks();

  const [materialRequest, setMaterialRequest] = useState<MaterialPaymentRequest | null>(null);
  const [isApproving, setIsApproving] = useState(false);

  // Poll for pending material requests every 10 seconds
  useEffect(() => {
    if (devMode) return; // skip in mock mode

    let cancelled = false;

    const poll = async () => {
      try {
        const requests = await OrderRepository.getCustomerMaterialRequests();
        if (cancelled) return;
        // Find a PENDING request for this service order
        const pending = (requests || []).find(
          (r: any) =>
            r.status === 'PENDING' &&
            (orderId == null || r.serviceOrderId === orderId)
        );
        if (pending) {
          setMaterialRequest({
            productOrderId: pending.id,
            serviceOrderId: pending.serviceOrderId,
            plumberName: pending.assignedPlumberName || plumberName || 'Your plumber',
            totalAmount: Number(pending.totalAmount || 0),
          });
        } else {
          setMaterialRequest(null);
        }
      } catch (err) {
        // silently fail â€” show nothing if network unavailable
      }
    };

    poll();
    const interval = setInterval(poll, 10000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [orderId, plumberName, devMode]);

  const handleApproveMaterial = async () => {
    if (!materialRequest) return;
    setIsApproving(true);
    try {
      await CartRepository.confirmPayment(materialRequest.productOrderId);
      setMaterialRequest(null);
      Alert.alert(
        'Approved!',
        'Payment confirmed. Materials will be dispatched to your site shortly.',
        [
          {
            text: 'OK',
            onPress: () =>
              navigation.replace('ServiceCompletion', { plumberName }),
          },
        ]
      );
    } catch (err: any) {
      Alert.alert('Payment Failed', err?.message || 'Could not confirm payment. Please try again.');
    } finally {
      setIsApproving(false);
    }
  };

  const steps = [
    'Booking Confirmed (09:30 AM)',
    'Plumber on the Way (Live assignment)',
    'Arrived & Work in Progress',
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <AppIcon icon={ArrowLeftIcon} size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Track Plumber</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.mapPanel}>
          <MapView
            style={styles.map}
            initialRegion={{ latitude: 17.4485, longitude: 78.3741, latitudeDelta: 0.015, longitudeDelta: 0.015 }}
            scrollEnabled={false}
            zoomEnabled={false}
          >
            <Marker coordinate={{ latitude: 17.4485, longitude: 78.3741 }} title="Your Location" />
            <Marker coordinate={{ latitude: 17.452, longitude: 78.38 }} title={plumberName}>
              <PulsingLocationMarker color={colors.warning} size={14} />
            </Marker>
            <Polyline coordinates={[{ latitude: 17.4485, longitude: 78.3741 }, { latitude: 17.452, longitude: 78.38 }]} strokeColor={colors.primary} strokeWidth={4} />
          </MapView>
        </View>

        {/* Material Approval Card â€” shown when plumber requests parts */}
        {materialRequest && (
          <View style={styles.approvalCard}>
            <Text style={styles.approvalEyebrow}>âš ï¸ Parts Needed by Your Plumber</Text>
            <Text style={styles.approvalTitle}>{materialRequest.plumberName} needs supplies</Text>
            <Text style={styles.approvalMsg}>
              Your plumber has inspected the issue and requested additional materials to complete the job.
            </Text>
            <View style={styles.approvalAmountRow}>
              <Text style={styles.approvalLabel}>Total to Approve</Text>
              <Text style={styles.approvalAmount}>â‚¹{materialRequest.totalAmount}</Text>
            </View>
            <View style={styles.approvalActions}>
              <TouchableOpacity
                style={styles.declineBtn}
                onPress={() => setMaterialRequest(null)}
              >
                <Text style={styles.declineBtnText}>Decline</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.approveBtn, isApproving && { opacity: 0.6 }]}
                onPress={handleApproveMaterial}
                disabled={isApproving}
              >
                {isApproving ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.approveBtnText}>Approve Material Request</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.cardContainer}>
          <LiveTrackingCard
            eta="6 mins"
            statusText="On the way to your location"
            name={plumberName}
            role="FixKart Expert Plumber"
            onCallPress={() => Linking.openURL('tel:+919876543210').catch(() => Alert.alert('Call failed'))}
            onChatPress={() => navigation.navigate('Chat', { name: plumberName, role: 'Plumber' })}
          />
        </View>

        <View style={styles.statusSection}>
          <Text style={styles.sectionTitle}>Service Progress</Text>
          <TrackingStatusStepper steps={steps} currentStep={1} />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        {devMode && (
          <SecondaryButton
            title="Simulate Material Request (Dev Only)"
            onPress={() => navigation.navigate('MaterialApproval', { serviceOrderId: orderId, plumberName })}
            style={styles.simulateBtn}
          />
        )}
        <SecondaryButton title="Cancel Booking" onPress={() => navigation.navigate('Main')} textColor={colors.error} outlineColor={colors.error} style={styles.cancelBtn} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.layout, paddingVertical: spacing.md, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border, gap: spacing.md },
  backButton: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  title: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
  scrollContent: { padding: spacing.layout, paddingBottom: spacing.huge },
  map: { ...StyleSheet.absoluteFillObject },
  mapPanel: { height: 250, borderRadius: borderRadius.md, backgroundColor: '#DBEAFE', marginBottom: spacing.lg, justifyContent: 'center', overflow: 'hidden' },
  cardContainer: { marginBottom: spacing.lg },
  statusSection: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border, borderRadius: borderRadius.md, padding: spacing.md },
  sectionTitle: { fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.bold, color: colors.textPrimary, marginBottom: spacing.md },
  footer: { padding: spacing.layout, borderTopWidth: 1.5, borderTopColor: colors.border, backgroundColor: colors.surface, gap: spacing.sm },
  simulateBtn: { width: '100%' },
  cancelBtn: { width: '100%' },
  // Material Approval Card
  approvalCard: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  approvalEyebrow: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.bold, color: '#92400E', marginBottom: spacing.xs },
  approvalTitle: { fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.bold, color: colors.textPrimary, marginBottom: spacing.xs },
  approvalMsg: { fontSize: typography.fontSize.xs, color: colors.textSecondary, lineHeight: 18, marginBottom: spacing.md },
  approvalAmountRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  approvalLabel: { fontSize: typography.fontSize.sm, color: colors.textSecondary, fontWeight: typography.fontWeight.medium },
  approvalAmount: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.black, color: colors.primary },
  approvalActions: { flexDirection: 'row', gap: spacing.sm },
  declineBtn: { flex: 1, borderWidth: 1.5, borderColor: colors.border, borderRadius: borderRadius.sm, paddingVertical: spacing.sm, alignItems: 'center' },
  declineBtnText: { fontSize: typography.fontSize.sm, color: colors.textSecondary, fontWeight: typography.fontWeight.medium },
  approveBtn: { flex: 2, backgroundColor: colors.primary, borderRadius: borderRadius.sm, paddingVertical: spacing.sm, alignItems: 'center' },
  approveBtnText: { fontSize: typography.fontSize.sm, color: '#FFFFFF', fontWeight: typography.fontWeight.bold },
});
