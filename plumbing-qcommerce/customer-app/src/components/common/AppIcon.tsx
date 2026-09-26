import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SvgProps } from 'react-native-svg';

interface AppIconProps {
  icon: React.FC<SvgProps>;
  size: number;
  color?: string;
  backgroundColor?: string;
  rounded?: boolean;
  accessibilityLabel?: string;
}

export function AppIcon({
  icon: IconComponent,
  size,
  color = '#0F172A',
  backgroundColor,
  rounded = false,
  accessibilityLabel,
}: AppIconProps) {
  if (!IconComponent) return null;

  // We set both color and stroke for maximum compatibility.
  // Custom SVGs with hardcoded path colors will ignore these.
  const iconEl = (
    <IconComponent 
      width={size} 
      height={size} 
      color={color} 
      stroke={color}
      fill="none" 
      accessibilityLabel={accessibilityLabel} 
    />
  );

  if (backgroundColor) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor,
            width: size * 1.8,
            height: size * 1.8,
            borderRadius: rounded ? size * 0.9 : size * 0.36,
          },
        ]}
      >
        {iconEl}
      </View>
    );
  }

  return iconEl;
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
