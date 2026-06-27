import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Platform,
} from 'react-native';

import { borderRadius, colors, shadows, spacing, typography } from '../../theme';

interface RouteMapProps {
  plumberLatitude: number;
  plumberLongitude: number;
  customerLatitude: number;
  customerLongitude: number;
  customerName?: string;
}

export function RouteMap({
  plumberLatitude,
  plumberLongitude,
  customerLatitude,
  customerLongitude,
  customerName = 'Customer',
}: RouteMapProps) {
  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <View style={styles.grid}>
          {[...Array(5)].map((_, i) => (
            <View key={`h-${i}`} style={[styles.gridLine, styles.gridLineH, { top: `${20 * i}%` }]} />
          ))}
          {[...Array(5)].map((_, i) => (
            <View key={`v-${i}`} style={[styles.gridLine, styles.gridLineV, { left: `${20 * i}%` }]} />
          ))}
        </View>
        
        {/* Road networks */}
        <View style={styles.roadOne} />
        <View style={styles.roadTwo} />
        
        {/* Plumber Node */}
        <View style={[styles.node, styles.plumberNode]}>
          <Text style={styles.nodeIcon}>🔧</Text>
          <Text style={styles.nodeLabel}>You</Text>
        </View>

        {/* Path Route Line */}
        <View style={styles.routePathLine} />

        {/* Customer Node */}
        <View style={[styles.node, styles.customerNode]}>
          <Text style={styles.nodeIcon}>🏠</Text>
          <Text style={styles.nodeLabel}>{customerName}</Text>
        </View>

        <Text style={styles.metaInfo}>
          Route: [{plumberLatitude.toFixed(4)}, {plumberLongitude.toFixed(4)}] ➜ [{customerLatitude.toFixed(4)}, {customerLongitude.toFixed(4)}]
        </Text>
      </View>
    );
  }

  let MapView = null;
  let Marker = null;
  let Polyline = null;
  try {
    const MapsModule = require('react-native-maps');
    MapView = MapsModule.default;
    Marker = MapsModule.Marker;
    Polyline = MapsModule.Polyline;
  } catch (e) {
    console.warn('react-native-maps not available, fallback to mock view');
  }

  if (!MapView || !Marker || !Polyline) {
    return (
      <View style={[styles.container, styles.fallback]}>
        <Text style={styles.fallbackText}>🗺️ GPS Route View Fallback</Text>
      </View>
    );
  }

  return (
    <MapView
      style={styles.container}
      initialRegion={{
        latitude: (plumberLatitude + customerLatitude) / 2,
        longitude: (plumberLongitude + customerLongitude) / 2,
        latitudeDelta: Math.abs(plumberLatitude - customerLatitude) * 2 || 0.03,
        longitudeDelta: Math.abs(plumberLongitude - customerLongitude) * 2 || 0.03,
      }}
    >
      <Marker
        coordinate={{ latitude: plumberLatitude, longitude: plumberLongitude }}
        title="Your Location"
        pinColor={colors.primary}
      />
      <Marker
        coordinate={{ latitude: customerLatitude, longitude: customerLongitude }}
        title={customerName}
        pinColor={colors.success}
      />
      <Polyline
        coordinates={[
          { latitude: plumberLatitude, longitude: plumberLongitude },
          { latitude: customerLatitude, longitude: customerLongitude },
        ]}
        strokeColor={colors.primary}
        strokeWidth={4}
      />
    </MapView>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flex: 1,
    backgroundColor: '#E8F4EA',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
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
  roadOne: {
    position: 'absolute',
    top: '30%',
    left: 0,
    right: 0,
    height: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    transform: [{ rotate: '-15deg' }],
  },
  roadTwo: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '45%',
    width: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    transform: [{ rotate: '30deg' }],
  },
  node: {
    position: 'absolute',
    alignItems: 'center',
    zIndex: 10,
  },
  plumberNode: {
    top: '60%',
    left: '25%',
  },
  customerNode: {
    top: '20%',
    right: '25%',
  },
  nodeIcon: {
    fontSize: 24,
    backgroundColor: colors.surface,
    padding: spacing.xs,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.primary,
    ...shadows.sm,
  },
  nodeLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginTop: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    paddingHorizontal: spacing.xs,
    borderRadius: 4,
  },
  routePathLine: {
    position: 'absolute',
    width: '45%',
    height: 4,
    backgroundColor: colors.primary,
    top: '43%',
    left: '30%',
    transform: [{ rotate: '-35deg' }],
    opacity: 0.8,
  },
  metaInfo: {
    position: 'absolute',
    bottom: spacing.md,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    color: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    fontSize: 10,
    fontWeight: 'bold',
  },
  fallback: {
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
});
