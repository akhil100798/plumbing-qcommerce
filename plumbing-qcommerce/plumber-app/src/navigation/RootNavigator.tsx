import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React, { useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { AuthNavigator } from './AuthNavigator';
import { MainTabNavigator } from './MainTabNavigator';
import { IncomingJobRequestScreen } from '../screens/jobs/IncomingJobRequestScreen';
import { ActiveJobScreen } from '../screens/jobs/ActiveJobScreen';
import { NavigationScreen } from '../screens/jobs/NavigationScreen';
import { ReachedCustomerScreen } from '../screens/jobs/ReachedCustomerScreen';
import { StartWorkScreen } from '../screens/jobs/StartWorkScreen';
import { DiagnosisScreen } from '../screens/jobs/DiagnosisScreen';
import { BeforePhotosScreen } from '../screens/photos/BeforePhotosScreen';
import { StoreSelectionScreen } from '../screens/materials/StoreSelectionScreen';
import { MaterialRequestScreen } from '../screens/materials/MaterialRequestScreen';
import { MaterialApprovalStatusScreen } from '../screens/materials/MaterialApprovalStatusScreen';
import { MaterialTrackingScreen } from '../screens/materials/MaterialTrackingScreen';
import { AfterPhotosScreen } from '../screens/photos/AfterPhotosScreen';
import { CompleteServiceScreen } from '../screens/completion/CompleteServiceScreen';
import { MaterialsScreen } from '../screens/materials/MaterialsScreen';
import { EarningsScreen } from '../screens/business/EarningsScreen';
import { WalletScreen } from '../screens/business/WalletScreen';
import { JobHistoryScreen } from '../screens/business/JobHistoryScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { DrawerMenuScreen } from '../screens/profile/DrawerMenuScreen';
import { ChatScreen } from '../screens/ChatScreen';
import { AppStackParamList } from '../types/navigation';
import { colors, typography } from '../theme';

const Stack = createStackNavigator<AppStackParamList>();

export const navigationRef = React.createRef<any>();

const QA_SCREENS = [
  { label: '01 Splash', target: 'Auth', params: { screen: 'Splash' } },
  { label: '02 Login', target: 'Auth', params: { screen: 'Login' } },
  { label: '03 OTP Verification', target: 'Auth', params: { screen: 'Otp', params: { phone: '+91 98765 43210' } } },
  { label: '04 Dashboard', target: 'Main', params: { screen: 'Home' } },
  { label: '05 Incoming Job', target: 'IncomingJobRequest', params: { jobId: 'JOB-1024', customerId: 'CUST-001', distance: 2.4 } },
  { label: '06 Active Job', target: 'ActiveJob', params: { jobId: 'JOB-1024' } },
  { label: '07 Navigation / Route', target: 'Navigation', params: { jobId: 'JOB-1024', customerId: 'CUST-001', latitude: 12.9716, longitude: 77.5946, plumberLatitude: 12.9600, plumberLongitude: 77.5800, routeEta: '12 mins', routeDistance: '3.8 km', turnInstruction: 'Turn right on 100ft Ring Rd', turnDistance: '450m', address: 'Indiranagar 100ft Rd, Bangalore' } },
  { label: '08 Reached Customer', target: 'ReachedCustomer', params: { jobId: 'JOB-1024' } },
  { label: '09 Start Work', target: 'StartWork', params: { jobId: 'JOB-1024' } },
  { label: '10 Material Request', target: 'MaterialRequest', params: { jobId: 'JOB-1024', storeId: 1, storeName: 'FixKart Hub - Indiranagar' } },
  { label: '11 Material Approval', target: 'MaterialApprovalStatus', params: { jobId: 'JOB-1024', productOrderId: 101 } },
  { label: '12 Material Tracking', target: 'MaterialTracking', params: { jobId: 'JOB-1024', productOrderId: 101 } },
  { label: '13 Before Photos', target: 'BeforePhotos', params: { jobId: 'JOB-1024' } },
  { label: '14 After Photos', target: 'AfterPhotos', params: { jobId: 'JOB-1024' } },
  { label: '15 Complete Service', target: 'CompleteService', params: { jobId: 'JOB-1024' } },
  { label: '16 Earnings', target: 'Earnings', params: undefined },
  { label: '17 Wallet', target: 'Wallet', params: undefined },
  { label: '18 Job History', target: 'JobHistory', params: undefined },
  { label: '19 Profile', target: 'Profile', params: undefined },
  { label: '20 Drawer Menu', target: 'Drawer', params: undefined },
  { label: 'OP: Diagnosis Screen', target: 'Diagnosis', params: { jobId: 'JOB-1024' } },
  { label: 'OP: Store Selection', target: 'StoreSelection', params: { jobId: 'JOB-1024' } },
  { label: 'OP: Materials Catalog', target: 'Materials', params: { jobId: 'JOB-1024' } },
  { label: 'OP: Live Chat Screen', target: 'Chat', params: { name: 'Rajesh Kumar', role: 'Customer' } },
];

export function RootNavigator() {
  const [qaVisible, setQaVisible] = useState(false);

  return (
    <View style={styles.rootWrapper}>
      <NavigationContainer
        ref={navigationRef}
        onReady={() => {
          (global as any).navigationRef = navigationRef;
          (global as any).navigateScreen = (name: string, params?: any) => {
            navigationRef.current?.navigate(name, params);
          };
        }}
      >
        <Stack.Navigator
          id="RootStack"
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
          <Stack.Screen name="Diagnosis" component={DiagnosisScreen} />
          <Stack.Screen name="BeforePhotos" component={BeforePhotosScreen} />
          <Stack.Screen name="StoreSelection" component={StoreSelectionScreen} />
          <Stack.Screen name="MaterialRequest" component={MaterialRequestScreen} />
          <Stack.Screen name="MaterialApprovalStatus" component={MaterialApprovalStatusScreen} />
          <Stack.Screen name="MaterialTracking" component={MaterialTrackingScreen} />
          <Stack.Screen name="AfterPhotos" component={AfterPhotosScreen} />
          <Stack.Screen name="CompleteService" component={CompleteServiceScreen} />
          <Stack.Screen name="Materials" component={MaterialsScreen} />
          <Stack.Screen name="Earnings" component={EarningsScreen} />
          <Stack.Screen name="Wallet" component={WalletScreen} />
          <Stack.Screen name="JobHistory" component={JobHistoryScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="Drawer" component={DrawerMenuScreen} />
          <Stack.Screen name="Chat" component={ChatScreen} />
        </Stack.Navigator>
      </NavigationContainer>

      {/* Floating QA Badge to switch between screens during verification */}
      <TouchableOpacity
        style={styles.qaFab}
        onPress={() => setQaVisible(true)}
        activeOpacity={0.8}
        testID="qa-screen-switcher-fab"
      >
        <Text style={styles.qaFabText}>QA</Text>
      </TouchableOpacity>

      <Modal visible={qaVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>FixKart Plumber QA Screen Switcher</Text>
              <TouchableOpacity onPress={() => setQaVisible(false)} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>X</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false}>
              {QA_SCREENS.map((item, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.modalItem}
                  onPress={() => {
                    setQaVisible(false);
                    navigationRef.current?.navigate(item.target, item.params);
                  }}
                >
                  <Text style={styles.modalItemText}>{item.label}</Text>
                  <Text style={styles.modalItemTarget}>{item.target}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  rootWrapper: {
    flex: 1,
    position: 'relative',
  },
  qaFab: {
    position: 'absolute',
    top: 36,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 59, 184, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  qaFabText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    width: '100%',
    maxHeight: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: typography.fontWeight.bold,
    color: colors.stitchBlue,
  },
  closeBtn: {
    padding: 6,
  },
  closeBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#64748B',
  },
  modalList: {
    marginTop: 8,
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F1F5F9',
  },
  modalItemText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  modalItemTarget: {
    fontSize: 11,
    color: '#64748B',
  },
});
