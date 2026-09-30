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
  TextInput,
} from 'react-native';

import MapView, { Marker, Polyline } from 'react-native-maps';

import { PlumberCard } from '../components/cards/PlumberCard';
import { PrimaryButton } from '../components/common/PrimaryButton';
import { borderRadius, colors, spacing, typography } from '../theme';
import { AppStackParamList } from '../types/navigation';

import { PlumberRepository } from '../services/plumbers/plumberRepository';

type Props = StackScreenProps<AppStackParamList, 'PlumberConfirmation'>;

export function PlumberConfirmationScreen({ route, navigation }: Props) {
  const { issueType, issueCategory, description, urgency, scheduledFor } = route.params;
  const [loading, setLoading] = useState(false);
  const [addressLine1, setAddressLine1] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [landmark, setLandmark] = useState('');
  const [coordinates, setCoordinates] = useState('');
  const [createdOrder, setCreatedOrder] = useState<any>(null);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const response = await PlumberRepository.createServiceOrder({
        issueCategory,
        description: description || issueType,
        latitude: coordinates ? Number(coordinates.split(',')[0]) : null,
        longitude: coordinates ? Number(coordinates.split(',')[1]) : null,
        addressLine1,
        city,
        postalCode,
        contactPhone,
        landmark,
        requestType: 'NEARBY_AUTO',
        urgency,
        scheduledFor,
      });
      setCreatedOrder(response);

      navigation.replace('PlumberTracking', {
        orderId: response.id,
        plumberId: null,
        plumberName: response.plumberName ?? null,
        plumberPhone: response.plumberPhone ?? null,
        customerLatitude: response.customerLatitude ?? null,
        customerLongitude: response.customerLongitude ?? null,
        plumberLatitude: null,
        plumberLongitude: null,
        createdAt: response.createdAt ?? null,
        assignedAt: response.assignedAt ?? null,
        estimatedArrivalAt: response.estimatedArrivalAt ?? null,
        status: response.status ?? null,
      });
    } catch (err: any) {
      console.error('Failed to confirm plumber booking', err);
      Alert.alert(
        'Booking failed',
        err?.response?.data?.error || err?.message || 'Unable to submit the service request. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>?</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Confirm Booking</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>Service address</Text>
        <TextInput value={addressLine1} onChangeText={setAddressLine1} placeholder="Address" style={styles.input} />
        <TextInput value={city} onChangeText={setCity} placeholder="City" style={styles.input} />
        <TextInput value={postalCode} onChangeText={setPostalCode} placeholder="Postal code" keyboardType="number-pad" style={styles.input} />
        <TextInput value={contactPhone} onChangeText={setContactPhone} placeholder="Contact phone" keyboardType="phone-pad" style={styles.input} />
        <TextInput value={landmark} onChangeText={setLandmark} placeholder="Landmark (optional)" style={styles.input} />
        <TextInput value={coordinates} onChangeText={setCoordinates} placeholder="Latitude, longitude" keyboardType="numbers-and-punctuation" style={styles.input} />
        {(() => {
          const [lat, lng] = coordinates.split(',').map((value) => Number(value.trim()));
          const hasCoordinates = Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
          return hasCoordinates ? (
            <View style={styles.mapPanel}>
              <MapView style={styles.map} initialRegion={{ latitude: lat, longitude: lng, latitudeDelta: 0.015, longitudeDelta: 0.015 }} scrollEnabled={false} zoomEnabled={false}>
                <Marker coordinate={{ latitude: lat, longitude: lng }} />
              </MapView>
            </View>
          ) : <Text style={styles.locationUnavailable}>Location unavailable until valid coordinates are provided.</Text>;
        })()}

        <Text style={styles.sectionTitle}>Assignment status</Text>
        <View style={styles.card}><Text style={styles.value}>Waiting for a plumber</Text><Text style={styles.label}>ETA unavailable</Text></View>

        <View style={styles.billingSection}>
          <Text style={styles.sectionTitle}>Service Charge Summary</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.label}>Issue Type</Text>
              <Text style={styles.value}>{issueType}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Base Inspection Fee</Text>
              <Text style={styles.value}>{createdOrder?.visitFee != null ? `${createdOrder.currency || 'INR'} ${createdOrder.visitFee}` : 'Returned by backend after request'}</Text>
            </View>
            <View style={[styles.row, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total Payable</Text>
              <Text style={styles.totalValue}>{createdOrder?.visitFee != null ? `${createdOrder.currency || 'INR'} ${createdOrder.visitFee}` : 'See final backend amount'}</Text>
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
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    padding: spacing.md,
    marginBottom: spacing.sm,
    color: colors.textPrimary,
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
  locationUnavailable: {
    color: colors.textSecondary,
    marginBottom: spacing.lg,
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
