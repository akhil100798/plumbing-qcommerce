import React, { useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  StatusBar,
  Dimensions,
  Platform,
} from 'react-native';
import { AuthProvider, useAuth } from './src/services/authService';
import { CartProvider } from './src/services/cartService';
import { OrderProvider } from './src/services/orderService';
import { colors } from './src/theme/colors';
import { BottomNavigation, TabRoute } from './src/components/common/BottomNavigation';

// Screens
import { SplashScreen } from './src/screens/auth/SplashScreen';
import { LoginScreen } from './src/screens/auth/LoginScreen';
import { OtpScreen } from './src/screens/auth/OtpScreen';
import { HomeScreen } from './src/screens/home/HomeScreen';
import { SearchScreen } from './src/screens/catalog/SearchScreen';
import { ServiceDetailScreen } from './src/screens/catalog/ServiceDetailScreen';
import { ProductDetailScreen } from './src/screens/catalog/ProductDetailScreen';
import { CartScreen } from './src/screens/cart/CartScreen';
import { CheckoutScreen } from './src/screens/checkout/CheckoutScreen';
import { PaymentSuccessScreen } from './src/screens/checkout/PaymentSuccessScreen';
import { OrdersScreen } from './src/screens/orders/OrdersScreen';
import { OrderTrackingScreen } from './src/screens/orders/OrderTrackingScreen';
import { ProfileScreen } from './src/screens/profile/ProfileScreen';
import { SavedAddressesScreen } from './src/screens/profile/SavedAddressesScreen';
import { SupportChatScreen } from './src/screens/support/SupportChatScreen';

type ScreenRoute =
  | 'splash'
  | 'login'
  | 'otp'
  | 'home'
  | 'search'
  | 'orders'
  | 'cart'
  | 'profile'
  | 'service_detail'
  | 'product_detail'
  | 'checkout'
  | 'payment_success'
  | 'order_tracking'
  | 'saved_addresses'
  | 'support_chat';

function MainAppNavigator() {
  const { isAuthenticated, logout } = useAuth();
  const [currentRoute, setCurrentRoute] = useState<ScreenRoute>('splash');
  const [activeTab, setActiveTab] = useState<TabRoute>('home');
  const [selectedServiceId, setSelectedServiceId] = useState<string>('srv_1');
  const [selectedProductId, setSelectedProductId] = useState<string>('prod_1');
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [tempPhone, setTempPhone] = useState<string>('9876511223');
  const [searchInitialQuery, setSearchInitialQuery] = useState<string>('');

  const isMainTab =
    currentRoute === 'home' ||
    currentRoute === 'search' ||
    currentRoute === 'orders' ||
    currentRoute === 'cart' ||
    currentRoute === 'profile';

  const handleTabPress = (tab: TabRoute) => {
    setActiveTab(tab);
    setCurrentRoute(tab);
  };

  const navigateToServiceDetail = (id: string) => {
    setSelectedServiceId(id);
    setCurrentRoute('service_detail');
  };

  const navigateToProductDetail = (id: string) => {
    setSelectedProductId(id);
    setCurrentRoute('product_detail');
  };

  const navigateToTracking = (orderId: string) => {
    setSelectedOrderId(orderId);
    setCurrentRoute('order_tracking');
  };

  const renderCurrentScreen = () => {
    switch (currentRoute) {
      case 'splash':
        return (
          <SplashScreen
            onFinish={() => {
              if (isAuthenticated) {
                setCurrentRoute('home');
                setActiveTab('home');
              } else {
                setCurrentRoute('login');
              }
            }}
          />
        );

      case 'login':
        return (
          <LoginScreen
            onSendOtp={(phone) => {
              setTempPhone(phone);
              setCurrentRoute('otp');
            }}
            onSkip={() => {
              setCurrentRoute('home');
              setActiveTab('home');
            }}
          />
        );

      case 'otp':
        return (
          <OtpScreen
            phone={tempPhone}
            onVerify={() => {
              setCurrentRoute('home');
              setActiveTab('home');
            }}
            onBack={() => setCurrentRoute('login')}
          />
        );

      case 'home':
        return (
          <HomeScreen
            onNavigateToSearch={() => {
              setSearchInitialQuery('');
              setActiveTab('search');
              setCurrentRoute('search');
            }}
            onNavigateToCategory={(cat) => {
              setSearchInitialQuery(cat);
              setActiveTab('search');
              setCurrentRoute('search');
            }}
            onNavigateToServiceDetail={navigateToServiceDetail}
            onNavigateToProductDetail={navigateToProductDetail}
            onNavigateToTracking={navigateToTracking}
            onNavigateToPlus={() => {
              setActiveTab('profile');
              setCurrentRoute('profile');
            }}
            onNavigateToNotifications={() => {}}
            onNavigateToSavedAddresses={() => setCurrentRoute('saved_addresses')}
          />
        );

      case 'search':
        return (
          <SearchScreen
            initialQuery={searchInitialQuery}
            onBack={() => {
              setActiveTab('home');
              setCurrentRoute('home');
            }}
            onNavigateToServiceDetail={navigateToServiceDetail}
            onNavigateToProductDetail={navigateToProductDetail}
          />
        );

      case 'service_detail':
        return (
          <ServiceDetailScreen
            serviceId={selectedServiceId}
            onBack={() => setCurrentRoute('home')}
            onNavigateToCart={() => {
              setActiveTab('cart');
              setCurrentRoute('cart');
            }}
          />
        );

      case 'product_detail':
        return (
          <ProductDetailScreen
            productId={selectedProductId}
            onBack={() => setCurrentRoute('home')}
            onNavigateToCart={() => {
              setActiveTab('cart');
              setCurrentRoute('cart');
            }}
          />
        );

      case 'cart':
        return (
          <CartScreen
            onBack={() => {
              setActiveTab('home');
              setCurrentRoute('home');
            }}
            onNavigateToCheckout={() => setCurrentRoute('checkout')}
            onNavigateToHome={() => {
              setActiveTab('home');
              setCurrentRoute('home');
            }}
            onNavigateToSavedAddresses={() => setCurrentRoute('saved_addresses')}
          />
        );

      case 'checkout':
        return (
          <CheckoutScreen
            onBack={() => setCurrentRoute('cart')}
            onPaymentSuccess={(newOrderId) => {
              setSelectedOrderId(newOrderId);
              setCurrentRoute('payment_success');
            }}
          />
        );

      case 'payment_success':
        return (
          <PaymentSuccessScreen
            orderId={selectedOrderId}
            onTrackOrder={navigateToTracking}
            onGoHome={() => {
              setActiveTab('home');
              setCurrentRoute('home');
            }}
          />
        );

      case 'orders':
        return (
          <OrdersScreen
            onNavigateToTracking={navigateToTracking}
            onNavigateToHome={() => {
              setActiveTab('home');
              setCurrentRoute('home');
            }}
          />
        );

      case 'order_tracking':
        return (
          <OrderTrackingScreen
            orderId={selectedOrderId}
            onBack={() => {
              setActiveTab('orders');
              setCurrentRoute('orders');
            }}
            onNavigateToSupport={() => setCurrentRoute('support_chat')}
          />
        );

      case 'profile':
        return (
          <ProfileScreen
            onNavigateToSavedAddresses={() => setCurrentRoute('saved_addresses')}
            onNavigateToSupport={() => setCurrentRoute('support_chat')}
            onNavigateToOrders={() => {
              setActiveTab('orders');
              setCurrentRoute('orders');
            }}
            onLogout={() => {
              logout();
              setCurrentRoute('login');
            }}
          />
        );

      case 'saved_addresses':
        return (
          <SavedAddressesScreen
            onBack={() => setCurrentRoute(activeTab)}
          />
        );

      case 'support_chat':
        return (
          <SupportChatScreen
            onBack={() => setCurrentRoute(activeTab)}
          />
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
      <View style={styles.screenWrapper}>
        <View style={styles.screenBody}>{renderCurrentScreen()}</View>
        {isMainTab && (
          <BottomNavigation activeTab={activeTab} onTabPress={handleTabPress} />
        )}
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <OrderProvider>
          <View style={styles.webContainer}>
            <View style={styles.mobileFrame}>
              <MainAppNavigator />
            </View>
          </View>
        </OrderProvider>
      </CartProvider>
    </AuthProvider>
  );
}

const { width } = Dimensions.get('window');
const isWebPreview = Platform.OS === 'web' && width > 480;

const styles = StyleSheet.create({
  webContainer: {
    flex: 1,
    backgroundColor: isWebPreview ? '#e2e8f0' : colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mobileFrame: {
    width: '100%',
    maxWidth: 390,
    height: isWebPreview ? 844 : '100%',
    backgroundColor: colors.background,
    overflow: 'hidden',
    borderRadius: isWebPreview ? 32 : 0,
    borderWidth: isWebPreview ? 6 : 0,
    borderColor: isWebPreview ? '#1e293b' : 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
  },
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  screenWrapper: {
    flex: 1,
    backgroundColor: colors.background,
  },
  screenBody: {
    flex: 1,
  },
});
