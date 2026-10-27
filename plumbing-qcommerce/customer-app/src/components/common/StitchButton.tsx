import React, { useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { colors, spacing, typography } from '../../theme';

interface StitchButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'approval' | 'outline' | 'danger' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function StitchButton({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  iconLeft,
  iconRight,
  style,
  testID,
}: StitchButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const isInteractionDisabled = disabled || loading;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.98,
      useNativeDriver: true,
      speed: 100,
      bounciness: 0,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 100,
      bounciness: 4,
    }).start();
  };

  const getContainerStyle = () => {
    switch (variant) {
      case 'secondary':
      case 'approval':
        return styles.approvalBtn;
      case 'outline':
        return styles.outlineBtn;
      case 'danger':
        return styles.dangerBtn;
      case 'ghost':
        return styles.ghostBtn;
      case 'primary':
      default:
        return styles.primaryBtn;
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'outline':
      case 'ghost':
        return styles.outlineText;
      case 'primary':
      case 'secondary':
      case 'approval':
      case 'danger':
      default:
        return styles.solidText;
    }
  };

  return (
    <Animated.View style={{ transform: [{ scale }], width: style ? undefined : 'auto' }}>
      <Pressable
        testID={testID}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isInteractionDisabled}
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.baseButton,
          getContainerStyle(),
          disabled && styles.disabledBtn,
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator
            color={variant === 'outline' || variant === 'ghost' ? colors.primary : colors.surface}
            size="small"
          />
        ) : (
          <View style={styles.contentRow}>
            {iconLeft && <View style={styles.iconLeft}>{iconLeft}</View>}
            <Text style={[styles.baseText, getTextStyle()]}>{title}</Text>
            {iconRight && <View style={styles.iconRight}>{iconRight}</View>}
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  baseButton: {
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 3,
  },
  approvalBtn: {
    backgroundColor: colors.secondary, // #066445 Stitch Emerald
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  outlineBtn: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  dangerBtn: {
    backgroundColor: colors.error,
  },
  ghostBtn: {
    backgroundColor: 'transparent',
  },
  disabledBtn: {
    opacity: 0.5,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  baseText: {
    fontSize: 15,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: -0.2,
  },
  solidText: {
    color: colors.surface,
  },
  outlineText: {
    color: colors.textSecondary,
  },
  iconLeft: {
    marginRight: spacing.xs,
  },
  iconRight: {
    marginLeft: spacing.xs,
  },
});
