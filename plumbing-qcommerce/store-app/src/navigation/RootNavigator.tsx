import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';

import { DashboardScreen } from '../screens/dashboard/DashboardScreen';
import { SalesAnalyticsScreen } from '../screens/analytics/SalesAnalyticsScreen';
import { WalletScreen } from '../screens/wallet/WalletScreen';
import { LowStockAlertScreen } from '../screens/inventory/LowStockAlertScreen';
import { NotificationsScreen } from '../screens/profile/NotificationsScreen';
import { OrdersScreen } from '../screens/orders/OrdersScreen';
import { OrderDetailsScreen } from '../screens/orders/OrderDetailsScreen';
import { PackingScreen } from '../screens/orders/PackingScreen';
import { ReadyForPickupScreen } from '../screens/orders/ReadyForPickupScreen';
import { InventoryScreen } from '../screens/inventory/InventoryScreen';
import { ProductDetailsScreen } from '../screens/inventory/ProductDetailsScreen';
import { AddProductScreen } from '../screens/inventory/AddProductScreen';
import { MaterialRequestsScreen } from '../screens/orders/MaterialRequestsScreen';
import { DispatchAssignmentScreen } from '../screens/dispatch/DispatchAssignmentScreen';
import { ReviewsRatingsScreen } from '../screens/reviews/ReviewsRatingsScreenNew';
import { OffersPromotionsScreen } from '../screens/offers/OffersPromotionsScreen';
import { StoreProfileScreen } from '../screens/profile/StoreProfileScreen';
import { AccountScreen } from '../screens/profile/AccountScreen';

import { AppStackParamList } from '../types/navigation';
import { AuthNavigator } from './AuthNavigator';
import { MainTabNavigator } from './MainTabNavigator';

const Stack = createStackNavigator<AppStackParamList>();

export function RootNavigator() {
  return (
    <NavigationContainer>
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
        <Stack.Screen name="Wallet" component={WalletScreen} />
        <Stack.Screen name="LowStockAlert" component={LowStockAlertScreen} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        
        {/* Orders flow */}
        <Stack.Screen name="Orders" component={OrdersScreen} />
        <Stack.Screen name="OrderDetails" component={OrderDetailsScreen} />
        <Stack.Screen name="Packing" component={PackingScreen} />
        <Stack.Screen name="ReadyForPickup" component={ReadyForPickupScreen} />
        
        {/* Inventory Flow */}
        <Stack.Screen name="Inventory" component={InventoryScreen} />
        <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} />
        <Stack.Screen name="AddProduct" component={AddProductScreen} />
        
        {/* Material requests & riders */}
        <Stack.Screen name="MaterialRequests" component={MaterialRequestsScreen} />
        {/* Delivery routes disabled for MVP:
        <Stack.Screen name="DispatchAssignment" component={DispatchAssignmentScreen} />
        */}
        
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
