import React from 'react';
import { View, Image, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { colors } from '../../theme';
import { MASCOT_ASSETS } from '../../assets/images/mascot';

interface PlumberAvatarProps {
  size?: number;
  online?: boolean;
  uri?: string;
  style?: StyleProp<ViewStyle>;
}

export function PlumberAvatar({ size = 48, online = true, uri, style }: PlumberAvatarProps) {
  const badgeSize = Math.max(12, Math.round(size * 0.28));

  return (
    <View style={[{ width: size, height: size }, style]}>
      <View
        style={[
          styles.container,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
        ]}
      >
        <Image
          source={uri ? { uri } : MASCOT_ASSETS.avatar}
          style={{ width: size, height: size, borderRadius: size / 2 }}
          resizeMode="cover"
        />
      </View>
      {online !== undefined && (
        <View
          style={[
            styles.badge,
            {
              backgroundColor: online ? '#10B981' : '#94A3B8',
              width: badgeSize,
              height: badgeSize,
              borderRadius: badgeSize / 2,
            },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#EFF6FF',
    borderWidth: 2,
    borderColor: '#003BB8',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
});
