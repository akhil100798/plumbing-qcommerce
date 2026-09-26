import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { HomeScreen } from '../screens/HomeScreen';
import { OrdersScreen } from '../screens/OrdersScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { StoreScreen } from '../screens/StoreScreen';
import { colors, spacing, typography } from '../theme';
import { MainTabParamList } from '../types/navigation';
import { AnimatedBottomTabButton } from '../components/common/AnimatedBottomTabButton';
import { AppIcon } from '../components/common/AppIcon';
import HomeIcon from '../assets/icons/home.svg';
import StoreIcon from '../assets/icons/store-directory.svg';
import OrdersIcon from '../assets/icons/order.svg';
import ProfileIcon from '../assets/icons/profile.svg';

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
        tabBarButton: (props) => <AnimatedBottomTabButton {...props} />,
        tabBarIcon: ({ color }) => {
          let IconComp = HomeIcon;
          if (route.name === 'HomeTab') {
            IconComp = HomeIcon;
          } else if (route.name === 'StoreTab') {
            IconComp = StoreIcon;
          } else if (route.name === 'OrdersTab') {
            IconComp = OrdersIcon;
          } else if (route.name === 'ProfileTab') {
            IconComp = ProfileIcon;
          }

          return (
            <AppIcon icon={IconComp} size={22} color={color} />
          );
        },
      })}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen
        name="StoreTab"
        component={StoreScreen}
        options={{ tabBarLabel: 'Store' }}
      />
      <Tab.Screen
        name="OrdersTab"
        component={OrdersScreen}
        options={{ tabBarLabel: 'Orders' }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{ tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.surface,
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
