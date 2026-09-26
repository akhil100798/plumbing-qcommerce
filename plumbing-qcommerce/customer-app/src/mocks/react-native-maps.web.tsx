/**
 * Web stub for react-native-maps.
 * react-native-maps uses native modules that are not available in a browser.
 * This stub renders a styled placeholder so the app can be QA-tested on web.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

interface Coordinate {
  latitude: number;
  longitude: number;
}

interface MapViewProps {
  style?: object;
  initialRegion?: Region;
  scrollEnabled?: boolean;
  zoomEnabled?: boolean;
  children?: React.ReactNode;
}

interface MarkerProps {
  coordinate: Coordinate;
  title?: string;
  pinColor?: string;
}

interface PolylineProps {
  coordinates: Coordinate[];
  strokeColor?: string;
  strokeWidth?: number;
}

const MapView: React.FC<MapViewProps> = ({ style, children }) => (
  <View style={[styles.mapContainer, style]}>
    {/* Map grid lines */}
    <View style={styles.grid}>
      {[...Array(5)].map((_, i) => (
        <View key={`h-${i}`} style={[styles.gridLine, styles.gridLineH, { top: `${20 * i}%` as any }]} />
      ))}
      {[...Array(5)].map((_, i) => (
        <View key={`v-${i}`} style={[styles.gridLine, styles.gridLineV, { left: `${20 * i}%` as any }]} />
      ))}
    </View>
    {/* Road lines */}
    <View style={styles.road} />
    <View style={[styles.road, styles.roadVertical]} />
    {/* Label */}
    <View style={styles.labelContainer}>
      <Text style={styles.labelEmoji}>🗺️</Text>
      <Text style={styles.labelText}>Map View</Text>
      <Text style={styles.labelSub}>(Web Preview)</Text>
    </View>
    {children}
  </View>
);

export const Marker: React.FC<MarkerProps> = ({ title, pinColor }) => (
  <View style={styles.markerWrapper}>
    <View style={[styles.markerPin, pinColor ? { backgroundColor: pinColor } : {}]}>
      <Text style={styles.markerText}>📍</Text>
    </View>
    {title ? <Text style={styles.markerLabel}>{title}</Text> : null}
  </View>
);

export const Polyline: React.FC<PolylineProps> = ({ strokeColor }) => (
  <View style={[styles.polyline, strokeColor ? { backgroundColor: strokeColor } : {}]} />
);

const styles = StyleSheet.create({
  mapContainer: {
    backgroundColor: '#e8f4ea',
    borderRadius: 12,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    minHeight: 200,
  },
  grid: {
    ...StyleSheet.absoluteFillObject,
  },
  gridLine: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.4)',
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
  road: {
    position: 'absolute',
    top: '50%' as any,
    left: 0,
    right: 0,
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.6)',
    marginTop: -4,
  },
  roadVertical: {
    top: 0,
    bottom: 0,
    left: '50%' as any,
    right: undefined,
    width: 8,
    height: undefined,
    marginLeft: -4,
    marginTop: 0,
  },
  labelContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.85)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    zIndex: 10,
  },
  labelEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  labelText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1f2937',
  },
  labelSub: {
    fontSize: 10,
    color: '#6b7280',
    marginTop: 2,
  },
  markerWrapper: {
    position: 'absolute',
    top: '30%' as any,
    right: '30%' as any,
    alignItems: 'center',
    zIndex: 20,
  },
  markerPin: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  markerText: {
    fontSize: 14,
  },
  markerLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: '#1f2937',
    backgroundColor: 'white',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2,
  },
  polyline: {
    position: 'absolute',
    left: '30%' as any,
    right: '30%' as any,
    top: '45%' as any,
    height: 3,
    backgroundColor: '#3B82F6',
    opacity: 0.7,
    zIndex: 5,
  },
});

export default MapView;
