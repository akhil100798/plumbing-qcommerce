import { StackScreenProps } from '@react-navigation/stack';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { PrimaryButton } from '../components/common/PrimaryButton';
import { canUseDevMockFallbacks } from '../services/mockPolicy';
import { borderRadius, colors, spacing, typography } from '../theme';
import { AppStackParamList } from '../types/navigation';
import { PlumberRepository } from '../services/plumbers/plumberRepository';

type Props = StackScreenProps<AppStackParamList, 'PlumberConfirmation'>;

export function PlumberConfirmationScreen({ route, navigation }: Props) {
  const { issueType } = route.params;
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (loading) return;
    setLoading(true);

    try {
      const response = await PlumberRepository.createServiceOrder({
        description: issueType,
        latitude: 17.4485,
        longitude: 78.3741,
        requestType: 'NEARBY_AUTO',
      });

      navigation.replace('PlumberTracking', {
        orderId: response.id,
        plumberId: response.plumber?.id ? String(response.plumber.id) : 'plumber_assigned',
        plumberName: response.plumber?.fullName || 'Assigned Plumber',
      });
    } catch (err: any) {
      console.error('Failed to confirm plumber booking:', err);
      if (canUseDevMockFallbacks()) {
        navigation.replace('PlumberTracking', {
          orderId: 999,
          plumberId: 'plumber_999',
          plumberName: 'Ravi Kumar',
        });
      } else {
        Alert.alert(
          'Booking Submission Failed',
          err?.message || 'Could not post service order to backend. Please try again.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.canGoBack() && navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Booking Summary</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>SERVICE ADDRESS</Text>
        <View style={styles.card}>
          <View style={styles.addressRow}>
            <Text style={styles.addressIcon}>📍</Text>
            <View style={styles.addressTextContainer}>
              <Text style={styles.addressLabel}>Home Address</Text>
              <Text style={styles.addressText}>Plot 12, Kavuri Hills, Phase 2, Jubilee Hills, Hyderabad</Text>
            </View>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { marginTop: spacing.lg }]}>SERVICE DETAILS</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.label}>Requested Service</Text>
            <Text style={styles.value}>{issueType}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Fulfillment Mode</Text>
            <Text style={styles.value}>Store Pickup / Direct Plumber</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Base Inspection Fee</Text>
            <Text style={styles.value}>₹199</Text>
          </View>
          <View style={[styles.row, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total Payable (Estimate)</Text>
            <Text style={styles.totalValue}>₹199</Text>
          </View>
        </View>

        <View style={styles.infoBanner}>
          <Text style={styles.infoIcon}>💡</Text>
          <Text style={styles.infoText}>
            Plumber will inspect the site and provide live material estimates from nearest partner hardware store.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton
          title={loading ? 'Creating Service Order...' : 'Confirm & Request Plumber'}
          onPress={handleConfirm}
          loading={loading}
          disabled={loading}
          style={styles.confirmBtn}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background || '#F8F9FF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.layout,
    paddingVertical: spacing.md,
    backgroundColor: colors.surfaceContainerLowest || '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.border || '#C1C6D6',
    gap: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLowest || '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border || '#C1C6D6',
  },
  backButtonText: {
    fontSize: 20,
    color: colors.textPrimary,
    fontWeight: 'bold',
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.heading,
    color: colors.textPrimary,
  },
  scrollContent: {
    padding: spacing.layout,
    paddingBottom: spacing.huge,
  },
  sectionTitle: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.body,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: colors.surfaceContainerLowest || '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border || '#C1C6D6',
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  addressRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  addressIcon: {
    fontSize: 20,
  },
  addressTextContainer: {
    flex: 1,
  },
  addressLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.body,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  addressText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.body,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  label: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontFamily: typography.fontFamily.body,
  },
  value: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.semibold,
    fontFamily: typography.fontFamily.body,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border || '#C1C6D6',
    paddingTop: spacing.md,
    marginTop: spacing.xs,
    marginBottom: 0,
  },
  totalLabel: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.body,
    color: colors.textPrimary,
  },
  totalValue: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.body,
    color: colors.primaryContainer || colors.primary,
  },
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceContainerLow || '#EFF4FF',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.lg,
    gap: spacing.sm,
    alignItems: 'center',
  },
  infoIcon: {
    fontSize: 18,
  },
  infoText: {
    flex: 1,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontFamily: typography.fontFamily.body,
    lineHeight: 18,
  },
  footer: {
    padding: spacing.layout,
    borderTopWidth: 1,
    borderTopColor: colors.border || '#C1C6D6',
    backgroundColor: colors.surfaceContainerLowest || '#FFFFFF',
  },
  confirmBtn: {
    width: '100%',
  },
});
