import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { DashboardScreen } from '../screens/dashboard/DashboardScreen';
import { JobsScreen } from '../screens/jobs/JobsScreen';
import { EarningsScreen } from '../screens/business/EarningsScreen';
import { MaterialsScreen } from '../screens/materials/MaterialsScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { colors, shadows, spacing, typography } from '../theme';
import { MainTabParamList } from '../types/navigation';
import {
  SvgNavHome,
  SvgNavJobs,
  SvgNavEarnings,
  SvgMatPackageBox,
  SvgNavProfile,
} from '../assets/svg';

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabNavigator() {
  return (
    <Tab.Navigator
      id="MainTab"
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.stitchBlue,
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarIcon: ({ color, focused }) => {
          let IconComponent = SvgNavHome;
          if (route.name === 'Home') {
            IconComponent = SvgNavHome;
          } else if (route.name === 'Jobs') {
            IconComponent = SvgNavJobs;
          } else if (route.name === 'Earnings') {
            IconComponent = SvgNavEarnings;
          } else if (route.name === 'Materials') {
            IconComponent = SvgMatPackageBox;
          } else if (route.name === 'Profile') {
            IconComponent = SvgNavProfile;
          }

          return (
            <View style={styles.iconWrapper}>
              <IconComponent
                width={22}
                height={22}
                fill={focused ? colors.stitchBlue : '#94A3B8'}
                stroke={focused ? colors.stitchBlue : '#94A3B8'}
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
        component={JobsScreen}
        options={{ tabBarLabel: 'Jobs' }}
      />
      <Tab.Screen
        name="Earnings"
        component={EarningsScreen}
        options={{ tabBarLabel: 'Earnings' }}
      />
      <Tab.Screen
        name="Materials"
        component={MaterialsScreen}
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
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    height: Platform.OS === 'android' ? 70 : 66,
    paddingBottom: Platform.OS === 'android' ? 10 : 8,
    paddingTop: 8,
    ...shadows.md,
  },
  tabBarLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
