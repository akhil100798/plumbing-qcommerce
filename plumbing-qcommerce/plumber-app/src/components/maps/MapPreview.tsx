import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Platform,
} from 'react-native';

import { borderRadius, colors, shadows, spacing, typography } from '../../theme';

interface MapPreviewProps {
  latitude: number;
  longitude: number;
  title?: string;
  height?: number;
}

export function MapPreview({
  latitude,
  longitude,
  title = 'Job Location',
  height = 180,
}: MapPreviewProps) {
  // If Platform is web, render a stylized vector visual
  if (Platform.OS === 'web') {
    return (
      <View style={[styles.container, { height }]}>
        <View style={styles.grid}>
          {[...Array(4)].map((_, i) => (
            <View key={`h-${i}`} style={[styles.gridLine, styles.gridLineH, { top: `${25 * i}%` }]} />
          ))}
          {[...Array(4)].map((_, i) => (
            <View key={`v-${i}`} style={[styles.gridLine, styles.gridLineV, { left: `${25 * i}%` }]} />
          ))}
        </View>
        <View style={styles.roadHorizontal} />
        <View style={styles.roadVertical} />
        <View style={styles.markerContainer}>
          <View style={styles.pin}>
            <Text style={styles.pinIcon}>📍</Text>
          </View>
          <Text style={styles.pinLabel}>{title}</Text>
        </View>
        <Text style={styles.coordinatesText}>
          GPS: {latitude.toFixed(4)}, {longitude.toFixed(4)}
        </Text>
      </View>
    );
  }

  // On Mobile, import react-native-maps dynamically to prevent web crash
  let MapView = null;
  let Marker = null;
  try {
    const MapsModule = require('react-native-maps');
    MapView = MapsModule.default;
    Marker = MapsModule.Marker;
  } catch (e) {
    console.warn('react-native-maps not available, fallback to mock view');
  }

  if (!MapView || !Marker) {
    return (
      <View style={[styles.container, { height }, styles.fallback]}>
        <Text style={styles.fallbackText}>🗺️ Map View Fallback</Text>
      </View>
    );
  }

  return (
    <MapView
      style={[styles.container, { height }]}
      initialRegion={{
        latitude,
        longitude,
        latitudeDelta: 0.015,
        longitudeDelta: 0.015,
      }}
      scrollEnabled={false}
      zoomEnabled={false}
    >
      <Marker
        coordinate={{ latitude, longitude }}
        title={title}
        pinColor={colors.primary}
      />
    </MapView>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#E2E8F0',
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  grid: {
    ...StyleSheet.absoluteFillObject,
  },
  gridLine: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  gridLineH: {
    left: 0,
    right: 0,
    height: 1,
  },
  gridLineV: {
    top: 0,
    bottom: 0,
    width: 1,
  },
  roadHorizontal: {
    position: 'absolute',
    top: '45%',
    left: 0,
    right: 0,
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  roadVertical: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '48%',
    width: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  markerContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    ...shadows.sm,
    zIndex: 10,
  },
  pin: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pinIcon: {
    fontSize: 16,
  },
  pinLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginTop: 2,
  },
  coordinatesText: {
    position: 'absolute',
    bottom: spacing.sm,
    left: spacing.sm,
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: 'bold',
  },
  fallback: {
    backgroundColor: colors.border,
  },
  fallbackText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
});
