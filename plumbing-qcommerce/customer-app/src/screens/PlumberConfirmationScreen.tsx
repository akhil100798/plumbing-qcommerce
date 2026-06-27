import { StackScreenProps } from '@react-navigation/stack';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import MapView, { Marker, Polyline } from 'react-native-maps';

import { PlumberCard } from '../components/cards/PlumberCard';
import { PrimaryButton } from '../components/common/PrimaryButton';
import { borderRadius, colors, spacing, typography } from '../theme';
import { AppStackParamList } from '../types/navigation';

import { PlumberRepository } from '../services/plumbers/plumberRepository';

type Props = StackScreenProps<AppStackParamList, 'PlumberConfirmation'>;

export function PlumberConfirmationScreen({ route, navigation }: Props) {
  const { issueType } = route.params;
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
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
        plumberId: response.plumber?.id ? String(response.plumber.id) : 'plumber_999',
        plumberName: response.plumber?.fullName || 'Ravi Kumar',
      });
    } catch (err) {
      console.error('Failed to confirm plumber booking', err);
      // Fallback for demo/dev purposes
      navigation.replace('PlumberTracking', {
        orderId: 999,
        plumberId: 'plumber_999',
        plumberName: 'Ravi Kumar',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Confirm Booking</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Map route preview */}
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
              title="Ravi Kumar"
              pinColor={colors.warning}
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
        </View>


        <Text style={styles.sectionTitle}>Assigned Plumber</Text>
        <PlumberCard
          name="Ravi Kumar"
          rating={4.7}
          jobsCount={213}
          eta="8 mins away"
          avatarText="R"
        />

        <View style={styles.billingSection}>
          <Text style={styles.sectionTitle}>Service Charge Summary</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.label}>Issue Type</Text>
              <Text style={styles.value}>{issueType}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Base Inspection Fee</Text>
              <Text style={styles.value}>₹199</Text>
            </View>
            <View style={[styles.row, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total Payable</Text>
              <Text style={styles.totalValue}>₹199</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton
          title="Confirm Booking"
          onPress={handleConfirm}
          loading={loading}
          style={styles.confirmBtn}
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
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapPanel: {
    height: 200,
    borderRadius: borderRadius.md,
    backgroundColor: '#DBEAFE',
    marginBottom: spacing.lg,
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
    opacity: 0.5,
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
  },
  customerPin: {
    left: 40,
    backgroundColor: colors.textPrimary,
  },
  plumberPin: {
    right: 40,
    backgroundColor: colors.warning,
  },
  pinText: {
    color: colors.surface,
    fontSize: 11,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  billingSection: {
    marginTop: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  label: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },
  value: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.bold,
  },
  totalRow: {
    borderTopWidth: 1.5,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
    marginTop: spacing.xs,
    marginBottom: 0,
  },
  totalLabel: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  totalValue: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.black,
    color: colors.primary,
  },
  footer: {
    padding: spacing.layout,
    borderTopWidth: 1.5,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  confirmBtn: {
    width: '100%',
  },
});
