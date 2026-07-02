import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { DashboardScreen } from '../screens/dashboard/DashboardScreen';
import { ActiveJobScreen } from '../screens/jobs/ActiveJobScreen';
import { EarningsScreen } from '../screens/business/EarningsScreen';
import { MaterialRequestScreen } from '../screens/materials/MaterialRequestScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { colors, spacing, typography } from '../theme';
import { MainTabParamList } from '../types/navigation';

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarIcon: ({ color, focused }) => {
          let emoji = '🏠';
          if (route.name === 'Home') {
            emoji = '🏠';
          } else if (route.name === 'Jobs') {
            emoji = '🔧';
          } else if (route.name === 'Earnings') {
            emoji = '📈';
          } else if (route.name === 'Materials') {
            emoji = '🔩';
          } else if (route.name === 'Profile') {
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
        name="Home"
        component={DashboardScreen as any}
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen
        name="Jobs"
        component={ActiveJobScreen as any}
        options={{ tabBarLabel: 'Jobs' }}
      />
      <Tab.Screen
        name="Earnings"
        component={EarningsScreen}
        options={{ tabBarLabel: 'Earnings' }}
      />
      <Tab.Screen
        name="Materials"
        component={MaterialRequestScreen as any}
        initialParams={{ jobId: 'PC123456' }}
        options={{ tabBarLabel: 'Materials' }}
      />
      <Tab.Screen
        name="Profile"
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
