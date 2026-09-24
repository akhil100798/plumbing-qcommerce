import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React, { ComponentType, useEffect, useRef } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';

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

const FOCUSABLE_SELECTOR = 'a,button,input,textarea,select,[tabindex]';
const PREVIOUS_TAB_INDEX_ATTRIBUTE = 'data-fixkart-previous-tabindex';

function TabScreenFocusBoundary({ children }: { children: React.ReactNode }) {
  const isFocused = useIsFocused();
  const containerRef = useRef<View>(null);

  useEffect(() => {
    if (Platform.OS !== 'web') return undefined;

    const root = containerRef.current as unknown as HTMLElement | null;
    if (!root || typeof root.querySelectorAll !== 'function') return undefined;

    const updateFocusableDescendants = () => {
      root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR).forEach((element) => {
        if (!isFocused) {
          if (!element.hasAttribute(PREVIOUS_TAB_INDEX_ATTRIBUTE)) {
            element.setAttribute(
              PREVIOUS_TAB_INDEX_ATTRIBUTE,
              element.getAttribute('tabindex') ?? '',
            );
          }
          element.setAttribute('tabindex', '-1');
          return;
        }

        if (!element.hasAttribute(PREVIOUS_TAB_INDEX_ATTRIBUTE)) return;
        const previousTabIndex = element.getAttribute(PREVIOUS_TAB_INDEX_ATTRIBUTE);
        if (previousTabIndex) {
          element.setAttribute('tabindex', previousTabIndex);
        } else {
          element.removeAttribute('tabindex');
        }
        element.removeAttribute(PREVIOUS_TAB_INDEX_ATTRIBUTE);
      });
    };

    updateFocusableDescendants();
    if (isFocused) return undefined;

    const observer = new MutationObserver(updateFocusableDescendants);
    observer.observe(root, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [isFocused]);

  return (
    <View ref={containerRef} style={styles.screenBoundary}>
      {children}
    </View>
  );
}

function withTabScreenFocusBoundary<P extends object>(ScreenComponent: ComponentType<P>) {
  function TabScreen(props: P) {
    return (
      <TabScreenFocusBoundary>
        <ScreenComponent {...props} />
      </TabScreenFocusBoundary>
    );
  }

  TabScreen.displayName = `TabScreenFocusBoundary(${ScreenComponent.displayName || ScreenComponent.name || 'Screen'})`;
  return TabScreen;
}

const HomeTabScreen = withTabScreenFocusBoundary(DashboardScreen);
const OrdersTabScreen = withTabScreenFocusBoundary(MaterialRequestsScreen);
const InventoryTabScreen = withTabScreenFocusBoundary(InventoryScreen);
const MaterialsTabScreen = withTabScreenFocusBoundary(MaterialRequestsScreen);
const AccountTabScreen = withTabScreenFocusBoundary(AccountScreen);

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
          } else if (route.name === 'MaterialsTab') {
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
        component={HomeTabScreen}
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen
        name="OrdersTab"
        component={OrdersTabScreen}
        options={{ tabBarLabel: 'Orders' }}
      />
      <Tab.Screen
        name="InventoryTab"
        component={InventoryTabScreen}
        options={{ tabBarLabel: 'Inventory' }}
      />
      <Tab.Screen
        name="MaterialsTab"
        component={MaterialsTabScreen}
        options={{ tabBarLabel: 'Materials' }}
      />
      <Tab.Screen
        name="AccountTab"
        component={AccountTabScreen}
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
  screenBoundary: {
    flex: 1,
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
