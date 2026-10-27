import React from 'react';
import {
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { colors, spacing, typography } from '../../theme';
import { SvgEcommerceCart, SvgNavigationArrowLeft } from '../../assets/svg';

interface StitchHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  showBack?: boolean;
  rightAction?: React.ReactNode;
  cartCount?: number;
  onCartPress?: () => void;
  style?: StyleProp<ViewStyle>;
  hideBack?: boolean;
}

export function StitchHeader({
  title,
  subtitle,
  onBack,
  showBack = true,
  rightAction,
  cartCount,
  onCartPress,
  style,
  hideBack = false,
}: StitchHeaderProps) {
  const shouldHideBack = hideBack || !showBack;

  return (
    <View style={[styles.header, style]}>
      <View style={styles.leftRow}>
        {!shouldHideBack && onBack && (
          <TouchableOpacity
            onPress={onBack}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            activeOpacity={0.7}
          >
            <SvgNavigationArrowLeft width={20} height={20} stroke={colors.textPrimary} />
          </TouchableOpacity>
        )}
        <View style={styles.titleColumn}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>
      {rightAction ? (
        <View style={styles.rightAction}>{rightAction}</View>
      ) : cartCount !== undefined && onCartPress ? (
        <TouchableOpacity
          onPress={onCartPress}
          style={styles.cartBtn}
          accessibilityRole="button"
          accessibilityLabel={`Shopping cart with ${cartCount} items`}
          activeOpacity={0.7}
        >
          <SvgEcommerceCart width={22} height={22} stroke={colors.textPrimary} />
          {cartCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      ) : (
        <View style={styles.spacer} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 56,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.layout,
    zIndex: 10,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  backChevron: {
    fontSize: 26,
    color: colors.textPrimary,
    lineHeight: 28,
    marginTop: -2,
    fontWeight: '600',
  },
  titleColumn: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },
  rightAction: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spacer: {
    width: 8,
  },
  cartBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cartIcon: {
    fontSize: 18,
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#059669',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  cartBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
});
