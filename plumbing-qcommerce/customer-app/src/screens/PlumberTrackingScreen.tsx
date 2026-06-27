import { StackScreenProps } from '@react-navigation/stack';
import React, { useState } from 'react';
import {
  Linking,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import MapView, { Marker, Polyline } from 'react-native-maps';

import { TrackingCard } from '../components/cards/TrackingCard';
import { PrimaryButton } from '../components/common/PrimaryButton';
import { SecondaryButton } from '../components/common/SecondaryButton';
import { borderRadius, colors, spacing, typography } from '../theme';
import { AppStackParamList } from '../types/navigation';

type Props = StackScreenProps<AppStackParamList, 'PlumberTracking'>;

export function PlumberTrackingScreen({ route, navigation }: Props) {
  const { plumberId, plumberName } = route.params;

  const handleCancel = () => {
    navigation.navigate('Main');
  };

  const handleSimulateMaterialRequest = () => {
    navigation.navigate('MaterialApproval', {
      serviceOrderId: 'order_service_777',
      plumberName: plumberName,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Track Plumber</Text>
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
              title={plumberName}
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


        <View style={styles.cardContainer}>
          <TrackingCard
            eta="6 mins"
            statusText="On the way to your location"
            partnerName={plumberName}
            onCall={() => Linking.openURL('tel:+919876543210').catch(() => alert('Call failed'))}
            onChat={() => navigation.navigate('Chat', { name: plumberName, role: 'Plumber' })}
          />
        </View>

        <View style={styles.statusSection}>
          <Text style={styles.sectionTitle}>Service Progress</Text>
          <View style={styles.timeline}>
            <View style={styles.timelineItem}>
              <View style={[styles.dot, styles.dotCompleted]} />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineTitle}>Booking Confirmed</Text>
                <Text style={styles.timelineTime}>09:30 AM</Text>
              </View>
            </View>
            <View style={styles.timelineLine} />

            <View style={styles.timelineItem}>
              <View style={[styles.dot, styles.dotActive]} />
              <View style={styles.timelineContent}>
                <Text style={[styles.timelineTitle, styles.timelineTitleActive]}>
                  Plumber on the Way
                </Text>
                <Text style={styles.timelineSub}>Ravi is bringing essential diagnostic tools</Text>
              </View>
            </View>
            <View style={styles.timelineLineInactive} />

            <View style={styles.timelineItem}>
              <View style={[styles.dot, styles.dotPending]} />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineTitlePending}>Arrived & Work in Progress</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton
          title="Simulate Material Request (Demo)"
          onPress={handleSimulateMaterialRequest}
          style={styles.simulateBtn}
        />
        <SecondaryButton
          title="Cancel Booking"
          onPress={handleCancel}
          textColor={colors.error}
          outlineColor={colors.error}
          style={styles.cancelBtn}
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
    height: 250,
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
    right: 80, // Moved closer
    backgroundColor: colors.warning,
  },
  pinText: {
    color: colors.surface,
    fontSize: 11,
    fontWeight: 'bold',
  },
  cardContainer: {
    marginBottom: spacing.lg,
  },
  statusSection: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  timeline: {
    position: 'relative',
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginTop: 3,
    zIndex: 2,
  },
  dotCompleted: {
    backgroundColor: colors.success,
  },
  dotActive: {
    backgroundColor: colors.primary,
    borderWidth: 3,
    borderColor: colors.primaryLight,
  },
  dotPending: {
    backgroundColor: colors.borderDark,
  },
  timelineLine: {
    position: 'absolute',
    left: 6,
    top: 14,
    bottom: '50%',
    width: 2,
    backgroundColor: colors.success,
    zIndex: 1,
  },
  timelineLineInactive: {
    position: 'absolute',
    left: 6,
    top: '50%',
    bottom: 14,
    width: 2,
    backgroundColor: colors.border,
    zIndex: 1,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: spacing.lg,
  },
  timelineTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textSecondary,
  },
  timelineTitleActive: {
    color: colors.primary,
  },
  timelineTitlePending: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textMuted,
  },
  timelineTime: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  timelineSub: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  footer: {
    padding: spacing.layout,
    borderTopWidth: 1.5,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    gap: spacing.sm,
  },
  simulateBtn: {
    width: '100%',
  },
  cancelBtn: {
    width: '100%',
  },
});
