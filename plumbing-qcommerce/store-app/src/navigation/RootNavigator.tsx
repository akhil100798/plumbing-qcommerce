import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';

import { SalesAnalyticsScreen } from '../screens/analytics/SalesAnalyticsScreen';
import WeeklySummaryScreen from '../screens/analytics/WeeklySummaryScreen';
import { AuthNavigator } from './AuthNavigator';
import { DashboardScreen } from '../screens/dashboard/DashboardScreen';

import { DispatchAssignmentScreen } from '../screens/dispatch/DispatchAssignmentScreen';
import { AddProductScreen } from '../screens/inventory/AddProductScreen';
import { InventoryScreen } from '../screens/inventory/InventoryScreen';
import { LowStockAlertScreen } from '../screens/inventory/LowStockAlertScreen';
import { ProductDetailsScreen } from '../screens/inventory/ProductDetailsScreen';
import { OffersPromotionsScreen } from '../screens/offers/OffersPromotionsScreen';
import { CollectionConfirmationScreen } from '../screens/orders/CollectionConfirmationScreen';
import { MaterialRequestDetailScreen } from '../screens/orders/MaterialRequestDetailScreen';
import { MaterialRequestsScreen } from '../screens/orders/MaterialRequestsScreen';
import { OrderDetailsScreen } from '../screens/orders/OrderDetailsScreen';
import { OrdersScreen } from '../screens/orders/OrdersScreen';
import { PackingScreen } from '../screens/orders/PackingScreen';
import { ReadyForPickupScreen } from '../screens/orders/ReadyForPickupScreen';

import { AccountScreen } from '../screens/profile/AccountScreen';
import { NotificationsScreen } from '../screens/profile/NotificationsScreen';
import { StoreProfileScreen } from '../screens/profile/StoreProfileScreen';
import { ReviewsRatingsScreen } from '../screens/reviews/ReviewsRatingsScreenNew';
import { WalletScreen } from '../screens/wallet/WalletScreen';

import { AppStackParamList } from '../types/navigation';
import { MainTabNavigator } from './MainTabNavigator';

const Stack = createStackNavigator<AppStackParamList>();

export const navigationRef = React.createRef<any>();

export function RootNavigator() {
  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={() => {
        if (typeof window !== 'undefined') {
          (window as any).navigateScreen = (name: string, params?: any) => {
            navigationRef.current?.navigate(name, params);
          };
        }
      }}
    >
      <Stack.Navigator
        id="root"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Auth" component={AuthNavigator} />
        <Stack.Screen name="Main" component={MainTabNavigator} />

        {/* Dashboard & KPI overlays */}
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        <Stack.Screen name="SalesAnalytics" component={SalesAnalyticsScreen} />
        <Stack.Screen name="WeeklySummary" component={WeeklySummaryScreen} />
        <Stack.Screen name="Wallet" component={WalletScreen} />
        <Stack.Screen name="LowStockAlert" component={LowStockAlertScreen} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />

        {/* Orders flow */}
        <Stack.Screen name="Orders" component={OrdersScreen} />
        <Stack.Screen name="OrderDetails" component={OrderDetailsScreen} />
        <Stack.Screen name="Packing" component={PackingScreen} />
        <Stack.Screen name="ReadyForPickup" component={ReadyForPickupScreen} />
        <Stack.Screen name="CollectionConfirmation" component={CollectionConfirmationScreen} />

        {/* Inventory Flow */}
        <Stack.Screen name="Inventory" component={InventoryScreen} />
        <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} />
        <Stack.Screen name="AddProduct" component={AddProductScreen} />

        {/* Material requests & riders */}
        <Stack.Screen name="MaterialRequests" component={MaterialRequestsScreen} />
        <Stack.Screen name="MaterialRequestDetail" component={MaterialRequestDetailScreen} />

        {/* Promos & details settings */}
        <Stack.Screen name="ReviewsRatings" component={ReviewsRatingsScreen} />
        <Stack.Screen name="OffersPromotions" component={OffersPromotionsScreen} />
        <Stack.Screen name="StoreProfile" component={StoreProfileScreen} />
        <Stack.Screen name="Account" component={AccountScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
export default RootNavigator;
