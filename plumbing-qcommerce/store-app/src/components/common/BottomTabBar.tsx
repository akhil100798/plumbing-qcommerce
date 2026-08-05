import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import HomeIcon from '../../assets/icons/home.svg';
import OrdersIcon from '../../assets/icons/order.svg';
import InventoryIcon from '../../assets/icons/inventory.svg';
import AnalyticsIcon from '../../assets/icons/analytics.svg';
import MoreIcon from '../../assets/icons/more.svg';
import { colors, typography, spacing } from '../../theme';

interface BottomTabBarProps {
  active: 'Home' | 'Orders' | 'Inventory' | 'Analytics' | 'More' | string;
  navigation?: any;
}

const tabs = [
  { key: 'Home', label: 'Home', screen: 'Dashboard', Icon: HomeIcon },
  { key: 'Orders', label: 'Orders', screen: 'Orders', Icon: OrdersIcon },
  { key: 'Inventory', label: 'Inventory', screen: 'Inventory', Icon: InventoryIcon },
  { key: 'Analytics', label: 'Analytics', screen: 'SalesAnalytics', Icon: AnalyticsIcon },
  { key: 'More', label: 'More', screen: 'Account', Icon: MoreIcon },
];

export function BottomTabBar({ active, navigation }: BottomTabBarProps) {
  return (
    <View style={styles.bar}>
      {tabs.map((tab) => {
        const isActive = tab.key === active || (active === 'Dashboard' && tab.key === 'Home');
        const color = isActive ? colors.primary : colors.textMuted;
        const IconComponent = tab.Icon;
        return (
          <TouchableOpacity
            key={tab.key}
            testID={`store-tab-${tab.key.toLowerCase()}`}
            style={styles.tab}
            activeOpacity={0.7}
            onPress={() => {
              if (tab.key === 'Home') {
                navigation?.navigate('Main', { screen: 'HomeTab' });
              } else if (tab.key === 'Orders') {
                navigation?.navigate('Main', { screen: 'OrdersTab' });
              } else if (tab.key === 'Inventory') {
                navigation?.navigate('Main', { screen: 'InventoryTab' });
              } else if (tab.key === 'Analytics') {
                navigation?.navigate('SalesAnalytics');
              } else if (tab.key === 'More') {
                navigation?.navigate('Main', { screen: 'AccountTab' });
              } else {
                navigation?.navigate(tab.screen);
              }
            }}
          >
            <IconComponent width={22} height={22} stroke={color} fill={isActive ? colors.primaryLight : 'none'} />
            <Text style={[styles.label, { color }, isActive && styles.labelActive]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
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
    marginTop: 3,
    fontWeight: typography.fontWeight.semibold,
  },
  labelActive: {
    color: colors.primary,
    fontWeight: typography.fontWeight.bold,
  },
});

export default BottomTabBar;
