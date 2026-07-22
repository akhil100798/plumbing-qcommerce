import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, typography, borderRadius } from '../../theme';
import ArrowRightIcon from '../../assets/icons/arrow-right.svg';
import ProfileIcon from '../../assets/icons/profile.svg';

interface MenuRowProps {
  icon?: string;
  label: string;
  onPress?: () => void;
  danger?: boolean;
  showChevron?: boolean;
  iconColor?: string;
}

export function MenuRow({ icon, label, onPress, danger, showChevron = true, iconColor }: MenuRowProps) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.6}>
      <View style={[styles.iconWrap, danger && { backgroundColor: `${colors.error}1A` }]}>
        <ProfileIcon
          width={16}
          height={16}
          stroke={danger ? colors.error : iconColor || colors.primary}
        />
      </View>
      <Text style={[styles.label, danger && { color: colors.error }]}>{label}</Text>
      {showChevron && <ArrowRightIcon width={16} height={16} stroke={colors.textMuted} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.sm,
    backgroundColor: `${colors.primary}1A`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  label: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
});
