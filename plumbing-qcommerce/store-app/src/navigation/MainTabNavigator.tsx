import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { DashboardScreen } from '../screens/dashboard/DashboardScreen';
import { OrdersScreen } from '../screens/orders/OrdersScreen';
import { InventoryScreen } from '../screens/inventory/InventoryScreen';
import { MaterialRequestsScreen } from '../screens/orders/MaterialRequestsScreen';
import { AccountScreen } from '../screens/profile/AccountScreen';
import { colors, spacing, typography } from '../theme';
import { MainTabParamList } from '../types/navigation';
import { StoreIcon, StoreIconName } from '../components/common/StoreIcon';

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
          let iconName: StoreIconName = 'home';
          if (route.name === 'HomeTab') {
            iconName = 'home';
          } else if (route.name === 'OrdersTab') {
            iconName = 'orders';
          } else if (route.name === 'InventoryTab') {
            iconName = 'inventory';
          } else if (route.name === 'MaterialsTab') {
            iconName = 'materials';
          } else if (route.name === 'AccountTab') {
            iconName = 'account';
          }

          return (
            <View style={styles.iconWrapper}>
              <StoreIcon name={iconName} size={22} color={color} strokeWidth={focused ? 2.2 : 1.8} />
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
        name="MaterialsTab"
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
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    height: 64,
    paddingBottom: spacing.xs,
    paddingTop: spacing.xs,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: -2,
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default MainTabNavigator;
