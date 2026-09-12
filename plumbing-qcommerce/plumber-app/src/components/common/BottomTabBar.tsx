import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import HomeIcon from '../../assets/icons/home.svg';
import JobIcon from '../../assets/icons/active-job.svg';
import EarningsIcon from '../../assets/icons/earnings.svg';
import ProfileIcon from '../../assets/icons/profile.svg';
import { colors, typography, spacing } from '../../theme';

interface TabItem {
  id: string;
  label: string;
  IconComponent: React.FC<{ width?: number; height?: number; stroke?: string }>;
}

const TABS: TabItem[] = [
  { id: 'Home', label: 'Home', IconComponent: HomeIcon },
  { id: 'Jobs', label: 'Jobs', IconComponent: JobIcon },
  { id: 'Earnings', label: 'Earnings', IconComponent: EarningsIcon },
  { id: 'Profile', label: 'Profile', IconComponent: ProfileIcon },
];

interface BottomTabBarProps {
  active?: string;
  onTabPress?: (tabId: string) => void;
}

export function BottomTabBar({ active = 'Earnings', onTabPress }: BottomTabBarProps) {
  return (
    <View style={styles.container}>
      {TABS.map((tab) => {
        const isActive = tab.id === active;
        const IconComp = tab.IconComponent;
        const iconColor = isActive ? colors.primary : colors.textMuted;
        return (
          <TouchableOpacity
            key={tab.id}
            testID={`plumber-tab-${tab.id.toLowerCase()}`}
            style={styles.tab}
            onPress={() => onTabPress?.(tab.id)}
            activeOpacity={0.7}
            accessibilityRole="tab"
            accessibilityLabel={tab.label}
            accessibilityState={{ selected: isActive }}
          >
            <IconComp width={22} height={22} stroke={iconColor} />
            <Text style={[styles.label, isActive && styles.labelActive]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  tab: { flex: 1, alignItems: 'center' },
  label: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  labelActive: {
    color: colors.primary,
    fontWeight: typography.fontWeight.bold,
  },
});
