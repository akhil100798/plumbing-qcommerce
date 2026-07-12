import React from 'react';
import { View, StyleSheet, Text } from 'react-native';

interface IconBadgeProps {
  children: React.ReactNode;
  count?: number;
  showDot?: boolean;
}

export function IconBadge({ children, count = 0, showDot = false }: IconBadgeProps) {
  const hasBadge = count > 0 || showDot;

  return (
    <View style={styles.container}>
      {children}
      {hasBadge && (
        <View style={[styles.badge, showDot && styles.dot]}>
          {!showDot && count > 0 && (
            <Text style={styles.badgeText}>
              {count > 99 ? '99+' : count}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444', // Red 500
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 2,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  dot: {
    minWidth: 8,
    height: 8,
    borderRadius: 4,
    top: 0,
    right: 0,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '700',
    textAlign: 'center',
  },
});
