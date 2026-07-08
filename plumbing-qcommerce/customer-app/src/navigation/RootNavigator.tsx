import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';

import { AddressManagementScreen } from '../screens/AddressManagementScreen';
import { AddressScreen } from '../screens/AddressScreen';
import { BookPlumberScreen } from '../screens/BookPlumberScreen';
import { CartScreen } from '../screens/CartScreen';
import { CategoryScreen } from '../screens/CategoryScreen';
import { MaterialApprovalScreen } from '../screens/MaterialApprovalScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { OffersScreen } from '../screens/OffersScreen';
import { ChatScreen } from '../screens/ChatScreen';
import { OrderConfirmationScreen } from '../screens/OrderConfirmationScreen';
import { StoreDetailsScreen } from '../screens/StoreDetailsScreen';
import { OrderDetailsScreen } from '../screens/OrderDetailsScreen';
import { OrderTrackingScreen } from '../screens/OrderTrackingScreen';
import { PaymentMethodsScreen } from '../screens/PaymentMethodsScreen';
import { PaymentScreen } from '../screens/PaymentScreen';
import { PlumberConfirmationScreen } from '../screens/PlumberConfirmationScreen';
import { PlumberTrackingScreen } from '../screens/PlumberTrackingScreen';
import { ProductDetailsScreen } from '../screens/ProductDetailsScreen';
import { ProductListingScreen } from '../screens/ProductListingScreen';
import { SearchScreen } from '../screens/SearchScreen';
import { ServiceCompletionScreen } from '../screens/ServiceCompletionScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { SupportScreen } from '../screens/SupportScreen';
import { WalletScreen } from '../screens/WalletScreen';
import { AppStackParamList } from '../types/navigation';
import { AuthNavigator } from './AuthNavigator';
import { MainTabNavigator } from './MainTabNavigator';

import { useSelector } from 'react-redux';

const Stack = createStackNavigator<AppStackParamList>();

export function RootNavigator() {
  const { isAuthenticated, user } = useSelector((state: any) => state.auth);

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        {isAuthenticated && user?.profileComplete === false ? (
          <Stack.Screen 
            name="Auth" 
            component={AuthNavigator} 
            initialParams={{ screen: 'CompleteProfile' } as any}
          />
        ) : !isAuthenticated ? (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabNavigator} />
        <Stack.Screen name="Search" component={SearchScreen} />
        <Stack.Screen name="Categories" component={CategoryScreen} />
        <Stack.Screen name="ProductListing" component={ProductListingScreen} />
        <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} />
        <Stack.Screen name="Cart" component={CartScreen} />
        <Stack.Screen name="Address" component={AddressScreen} />
        <Stack.Screen name="Payment" component={PaymentScreen} />
        <Stack.Screen name="OrderDetails" component={OrderDetailsScreen} />
        <Stack.Screen name="OrderTracking" component={OrderTrackingScreen} />
        <Stack.Screen name="BookPlumber" component={BookPlumberScreen} />
        <Stack.Screen name="PlumberConfirmation" component={PlumberConfirmationScreen} />
        <Stack.Screen name="PlumberTracking" component={PlumberTrackingScreen} />
        <Stack.Screen name="MaterialApproval" component={MaterialApprovalScreen} />
        <Stack.Screen name="ServiceCompletion" component={ServiceCompletionScreen} />
        <Stack.Screen name="AddressManagement" component={AddressManagementScreen} />
        <Stack.Screen name="PaymentMethods" component={PaymentMethodsScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="Wallet" component={WalletScreen} />
        <Stack.Screen name="Offers" component={OffersScreen} />
        <Stack.Screen name="Support" component={SupportScreen} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen name="OrderConfirmation" component={OrderConfirmationScreen} />
        <Stack.Screen name="StoreDetails" component={StoreDetailsScreen} />
        <Stack.Screen name="Chat" component={ChatScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}







