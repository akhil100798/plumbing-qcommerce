import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { colors } from '../../theme';

interface MapPlaceholderProps {
  children?: React.ReactNode;
  height?: number;
  style?: ViewStyle;
}

export function MapPlaceholder({ children, height = 260, style }: MapPlaceholderProps) {
  const gridV = [40, 100, 160, 220, 280, 340];
  const gridH = [40, 90, 140, 190, 240];

  return (
    <View style={[styles.container, { height }, style]}>
      <Svg width="100%" height="100%" viewBox="0 0 400 260" style={StyleSheet.absoluteFill}>
        <Rect x="0" y="0" width="400" height="260" fill="#EBF2FA" />
        {gridV.map((x) => (
          <Path key={`v-${x}`} d={`M${x} 0 L${x} 260`} stroke="#E3E7EE" strokeWidth={2} />
        ))}
        {gridH.map((y) => (
          <Path key={`h-${y}`} d={`M0 ${y} L400 ${y}`} stroke="#E3E7EE" strokeWidth={2} />
        ))}
        <Path
          d="M60 220 C 90 190, 60 150, 100 130 S 180 90, 160 60 S 260 40, 300 20"
          stroke={colors.primary}
          strokeWidth={5}
          fill="none"
          strokeLinecap="round"
        />
        <Circle cx="60" cy="220" r="7" fill={colors.textPrimary} />
        <Circle cx="300" cy="20" r="7" fill={colors.error} />
      </Svg>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#EBF2FA',
    overflow: 'hidden',
  },
});
