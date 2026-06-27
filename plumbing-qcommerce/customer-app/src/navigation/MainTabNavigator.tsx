import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { HomeScreen } from '../screens/HomeScreen';
import { OrdersScreen } from '../screens/OrdersScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { StoreScreen } from '../screens/StoreScreen';
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
          let iconName = '🏠';
          if (route.name === 'HomeTab') {
            iconName = 'Home';
          } else if (route.name === 'StoreTab') {
            iconName = 'Store';
          } else if (route.name === 'OrdersTab') {
            iconName = 'Orders';
          } else if (route.name === 'ProfileTab') {
            iconName = 'Profile';
          }

          // Custom emoji-based icon tabs
          const getEmoji = (name: string) => {
            switch (name) {
              case 'Home':
                return '🏠';
              case 'Store':
                return '🏪';
              case 'Orders':
                return '📋';
              case 'Profile':
                return '👤';
              default:
                return '🏠';
            }
          };

          return (
            <View style={styles.iconWrapper}>
              <Text style={[styles.tabEmoji, { opacity: focused ? 1 : 0.6 }]}>
                {getEmoji(iconName)}
              </Text>
            </View>
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
