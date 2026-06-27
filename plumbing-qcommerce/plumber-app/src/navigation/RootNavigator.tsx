import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';

import { AuthNavigator } from './AuthNavigator';
import { MainTabNavigator } from './MainTabNavigator';
import { IncomingJobRequestScreen } from '../screens/jobs/IncomingJobRequestScreen';
import { ActiveJobScreen } from '../screens/jobs/ActiveJobScreen';
import { NavigationScreen } from '../screens/jobs/NavigationScreen';
import { ReachedCustomerScreen } from '../screens/jobs/ReachedCustomerScreen';
import { StartWorkScreen } from '../screens/jobs/StartWorkScreen';
import { BeforePhotosScreen } from '../screens/photos/BeforePhotosScreen';
import { MaterialRequestScreen } from '../screens/materials/MaterialRequestScreen';
import { MaterialApprovalStatusScreen } from '../screens/materials/MaterialApprovalStatusScreen';
import { MaterialTrackingScreen } from '../screens/materials/MaterialTrackingScreen';
import { AfterPhotosScreen } from '../screens/photos/AfterPhotosScreen';
import { CompleteServiceScreen } from '../screens/completion/CompleteServiceScreen';
import { EarningsScreen } from '../screens/business/EarningsScreen';
import { WalletScreen } from '../screens/business/WalletScreen';
import { JobHistoryScreen } from '../screens/business/JobHistoryScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { DrawerMenuScreen } from '../screens/profile/DrawerMenuScreen';
import { ChatScreen } from '../screens/ChatScreen';
import { AppStackParamList } from '../types/navigation';

const Stack = createStackNavigator<AppStackParamList>();

export function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Auth"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Auth" component={AuthNavigator} />
        <Stack.Screen name="Main" component={MainTabNavigator} />
        <Stack.Screen name="IncomingJobRequest" component={IncomingJobRequestScreen} />
        <Stack.Screen name="ActiveJob" component={ActiveJobScreen} />
        <Stack.Screen name="Navigation" component={NavigationScreen} />
        <Stack.Screen name="ReachedCustomer" component={ReachedCustomerScreen} />
        <Stack.Screen name="StartWork" component={StartWorkScreen} />
        <Stack.Screen name="BeforePhotos" component={BeforePhotosScreen} />
        <Stack.Screen name="MaterialRequest" component={MaterialRequestScreen} />
        <Stack.Screen name="MaterialApprovalStatus" component={MaterialApprovalStatusScreen} />
        <Stack.Screen name="MaterialTracking" component={MaterialTrackingScreen} />
        <Stack.Screen name="AfterPhotos" component={AfterPhotosScreen} />
        <Stack.Screen name="CompleteService" component={CompleteServiceScreen} />
        <Stack.Screen name="Earnings" component={EarningsScreen} />
        <Stack.Screen name="Wallet" component={WalletScreen} />
        <Stack.Screen name="JobHistory" component={JobHistoryScreen} />
        <Stack.Screen name="Profile" component={DrawerMenuScreen} /> {/* Standard Drawer list screen mapping */}
        <Stack.Screen name="Chat" component={ChatScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
