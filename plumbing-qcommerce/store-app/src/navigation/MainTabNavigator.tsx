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

import HomeIcon from '../assets/icons/home.svg';
import OrderIcon from '../assets/icons/order.svg';
import InventoryIcon from '../assets/icons/inventory.svg';
import MaterialRequestIcon from '../assets/icons/material-request.svg';
import ProfileIcon from '../assets/icons/profile.svg';

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabNavigator() {
  return (
    <Tab.Navigator
      id="main"
      initialRouteName="HomeTab"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarIcon: ({ color, focused }) => {
          let IconComp = HomeIcon;
          if (route.name === 'HomeTab') {
            IconComp = HomeIcon;
          } else if (route.name === 'OrdersTab') {
            IconComp = OrderIcon;
          } else if (route.name === 'InventoryTab') {
            IconComp = InventoryIcon;
          } else if (route.name === 'DispatchTab') {
            IconComp = MaterialRequestIcon;
          } else if (route.name === 'AccountTab') {
            IconComp = ProfileIcon;
          }

          return (
            <View style={styles.iconWrapper}>
              <IconComp width={20} height={20} stroke={color} />
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
