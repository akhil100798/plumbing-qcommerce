import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { DashboardScreen } from '../screens/dashboard/DashboardScreen';
import { OrdersScreen } from '../screens/orders/OrdersScreen';
import { InventoryScreen } from '../screens/inventory/InventoryScreen';
import { MaterialRequestsScreen } from '../screens/orders/MaterialRequestsScreen';
import { AccountScreen } from '../screens/profile/AccountScreen';
import { colors, spacing, typography } from '../theme';
import { MainTabParamList } from '../types/navigation';

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="HomeTab"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarIcon: ({ color, focused }) => {
          let emoji = '🏠';
          if (route.name === 'HomeTab') {
            emoji = '🏠';
          } else if (route.name === 'OrdersTab') {
            emoji = '📋';
          } else if (route.name === 'InventoryTab') {
            emoji = '📦';
          } else if (route.name === 'DispatchTab') {
            emoji = '🚚';
          } else if (route.name === 'AccountTab') {
            emoji = '👤';
          }

          return (
            <View style={styles.iconWrapper}>
              <Text style={[styles.tabEmoji, { opacity: focused ? 1 : 0.6 }]}>
                {emoji}
              </Text>
            </View>
          );
        },
      })}
    >
      <Tab.Screen
        name="HomeTab"
        component={DashboardScreen}
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen
        name="OrdersTab"
        component={OrdersScreen}
        options={{ tabBarLabel: 'Orders' }}
      />
      <Tab.Screen
        name="InventoryTab"
        component={InventoryScreen}
        options={{ tabBarLabel: 'Inventory' }}
      />
      <Tab.Screen
        name="DispatchTab"
        component={MaterialRequestsScreen}
        options={{ tabBarLabel: 'Materials' }}
      />
      <Tab.Screen
        name="AccountTab"
        component={AccountScreen}
        options={{ tabBarLabel: 'Account' }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.card,
    borderTopWidth: 1.5,
    borderTopColor: colors.border,
    height: 64,
    paddingBottom: spacing.xs,
    paddingTop: spacing.xs,
  },
  tabBarLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabEmoji: {
    fontSize: 20,
  },
});
export default MainTabNavigator;
