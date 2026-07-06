import { StackScreenProps } from '@react-navigation/stack';
import React, { useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { MaterialCard } from '../components/cards/MaterialCard';
import { PrimaryButton } from '../components/common/PrimaryButton';
import { SecondaryButton } from '../components/common/SecondaryButton';
import { canUseDevMockFallbacks, warnUsingDevMockFallback } from '../services/mockPolicy';
import { borderRadius, colors, spacing, typography } from '../theme';
import { AppStackParamList } from '../types/navigation';

type Props = StackScreenProps<AppStackParamList, 'MaterialApproval'>;

const mockMaterials = [
  { name: 'CPVC Pipe 1 Inch (3 meters)', qty: 2, price: 180 },
  { name: 'L-Bow Joint 1 Inch', qty: 3, price: 45 },
  { name: 'Solvent Cement Glue 100ml', qty: 1, price: 120 },
];

export function MaterialApprovalScreen({ route, navigation }: Props) {
  const { serviceOrderId, plumberName } = route.params;
  const [loading, setLoading] = useState(false);
  const mockFallbackEnabled = canUseDevMockFallbacks();

  const totalAmount = mockFallbackEnabled
    ? mockMaterials.reduce((sum, item) => sum + item.price * item.qty, 0)
    : 0;

  const handleDecline = () => {
    if (!mockFallbackEnabled) {
      Alert.alert(
        'Feature unavailable',
        'Material approval is not connected to the staging backend yet.'
      );
      return;
    }

    warnUsingDevMockFallback('Material approval decline', new Error(serviceOrderId));
    Alert.alert('Material request declined', 'Plumber will be notified.');
    navigation.goBack();
  };

  const handleApproveAndPay = () => {
    if (!mockFallbackEnabled) {
      Alert.alert(
        'Feature unavailable',
        'Material approval and payment are not connected to the staging backend yet.'
      );
      return;
    }

    setLoading(true);
    warnUsingDevMockFallback('Material approval payment', new Error(serviceOrderId));
    setTimeout(() => {
      setLoading(false);
      navigation.replace('ServiceCompletion', {
        plumberName: plumberName,
      });
    }, 1500);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>?</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Material Approval</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.requestBanner}>
          <Text style={styles.bannerEmoji}>???</Text>
          <View style={styles.bannerTextContainer}>
            <Text style={styles.bannerTitle}>Materials Requested</Text>
            <Text style={styles.bannerSub}>
              {plumberName} has inspected the issue and added materials needed to complete the work.
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Required Items</Text>
        {mockFallbackEnabled ? (
          <MaterialCard items={mockMaterials} totalAmount={totalAmount} />
        ) : (
          <View style={styles.unavailableCard}>
            <Text style={styles.unavailableTitle}>Material approval is blocked in staging</Text>
            <Text style={styles.unavailableText}>
              This screen no longer injects fake material items. Please use local dev with
              ` EXPO_PUBLIC_ALLOW_MOCK_FALLBACKS=true ` to exercise the demo-only flow.
            </Text>
          </View>
        )}

        <View style={styles.noticeCard}>
          <Text style={styles.noticeEmoji}>?</Text>
          <Text style={styles.noticeText}>
            {mockFallbackEnabled
              ? 'These materials will be delivered to your house via our instant 15-minute delivery partner.'
              : 'Staging now surfaces a blocked backend dependency here instead of silently simulating delivery.'}
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <SecondaryButton
          title="Decline"
          onPress={handleDecline}
          textColor={colors.textSecondary}
          outlineColor={colors.borderDark}
          style={styles.actionBtn}
        />
        <PrimaryButton
          title={mockFallbackEnabled ? `Approve & Pay ?${totalAmount}` : 'Backend Integration Required'}
          onPress={handleApproveAndPay}
          loading={loading}
          style={styles.actionBtnPrimary}
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
  requestBanner: {
    flexDirection: 'row',
    backgroundColor: colors.warningLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  bannerEmoji: {
    fontSize: 28,
  },
  bannerTextContainer: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: '#92400E',
  },
  bannerSub: {
    fontSize: typography.fontSize.xs,
    color: '#B45309',
    fontWeight: typography.fontWeight.medium,
    marginTop: 2,
    lineHeight: 16,
  },
  sectionTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  unavailableCard: {
    borderWidth: 1,
    borderColor: colors.error,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  unavailableTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.error,
    marginBottom: spacing.xs,
  },
  unavailableText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  noticeCard: {
    flexDirection: 'row',
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.lg,
    alignItems: 'center',
    gap: spacing.md,
  },
  noticeEmoji: {
    fontSize: 20,
  },
  noticeText: {
    flex: 1,
    fontSize: typography.fontSize.xs,
    color: colors.primary,
    fontWeight: typography.fontWeight.bold,
    lineHeight: 16,
  },
  footer: {
    flexDirection: 'row',
    padding: spacing.layout,
    borderTopWidth: 1.5,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    gap: spacing.md,
  },
  actionBtn: {
    flex: 1,
  },
  actionBtnPrimary: {
    flex: 2,
  },
});
