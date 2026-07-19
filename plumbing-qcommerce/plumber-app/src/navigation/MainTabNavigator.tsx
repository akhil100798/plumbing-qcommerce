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

import HomeIcon from '../assets/icons/home.svg';
import JobsIcon from '../assets/icons/active-job.svg';
import EarningsIcon from '../assets/icons/earnings.svg';
import MaterialsIcon from '../assets/icons/material-request.svg';
import ProfileIcon from '../assets/icons/profile.svg';

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
          let IconComponent = HomeIcon;
          if (route.name === 'Home') {
            IconComponent = HomeIcon;
          } else if (route.name === 'Jobs') {
            IconComponent = JobsIcon;
          } else if (route.name === 'Earnings') {
            IconComponent = EarningsIcon;
          } else if (route.name === 'Materials') {
            IconComponent = MaterialsIcon;
          } else if (route.name === 'Profile') {
            IconComponent = ProfileIcon;
          }

          return (
            <View style={styles.iconWrapper}>
              <IconComponent
                width={22}
                height={22}
                stroke={color}
                fill="none"
              />
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
});
