import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import io, { Socket } from 'socket.io-client';
import { useDispatch, useSelector } from 'react-redux';

import { StoreCard } from '../components/cards/StoreCard';
import { SearchBar } from '../components/common/SearchBar';
import { borderRadius, colors, spacing, typography } from '../theme';
import { AuthRepository } from '../services/auth/authRepository';
import { ProductRepository } from '../services/products/productRepository';
import { StoreRepository } from '../services/stores/storeRepository';
import { CartRepository } from '../services/cart/cartRepository';
import { OrderRepository } from '../services/orders/orderRepository';
import { PlumberRepository } from '../services/plumbers/plumberRepository';
import { getConfiguredEdgeUrl } from '../services/mockPolicy';
import { RootState } from '../redux/store';
import { addToCart as addToCartAction, clearCart as clearCartAction } from '../redux/slices/cartSlice';
import { loginStart, loginSuccess, loginFailure, logout } from '../redux/slices/authSlice';
import { startSearching, stopSearching, setActiveJob, setBookingConfig } from '../redux/slices/plumbersSlice';
import { setActiveProductOrder, updateProductOrderStatus } from '../redux/slices/ordersSlice';

const EDGE_UNAVAILABLE_MESSAGE = 'Nearby plumber live tracking is not configured in staging.';
const CUSTOMER_ID = 'cust_999';

type BookingMode = 'quick' | 'store' | 'expert';

interface ServiceOption {
  id: BookingMode;
  title: string;
  subtitle: string;
  eta: string;
  price: string;
  accent: string;
}

interface ActiveJob {
  plumberId?: string;
  message?: string;
}

interface MaterialPaymentRequest {
  productOrderId: number;
  serviceOrderId: number;
  plumberName: string;
  totalAmount: number;
  message: string;
}

const serviceOptions: ServiceOption[] = [
  {
    id: 'quick',
    title: 'Quick plumber',
    subtitle: 'Nearest verified partner for urgent leaks and blockages.',
    accent: '#11A683',
    eta: '8-12 min',
    price: 'From Rs. 199',
  },
  {
    id: 'store',
    title: 'Store assisted repair',
    subtitle: 'Parts and plumber routed from the closest hardware partner.',
    accent: '#F59E0B',
    eta: '15-25 min',
    price: 'Parts billed live',
  },
  {
    id: 'expert',
    title: 'Book top expert',
    subtitle: 'Choose a specialist for geyser, bathroom, kitchen, or pump jobs.',
    accent: '#2563EB',
    eta: '30-45 min',
    price: 'Fixed inspection',
  },
];

const categories = ['Leak repair', 'Drain clean', 'Tap install', 'Bathroom', 'Motor pump'];

interface HomeCategory {
  id: number;
  name: string;
  icon: string;
}

const homeCategories: HomeCategory[] = [
  { id: 1, name: 'Pipe Leakage', icon: '🚰' },
  { id: 2, name: 'Tap Repair', icon: '🚿' },
  { id: 3, name: 'Toilet Repair', icon: '🚽' },
  { id: 4, name: 'Water Tank', icon: '🛢️' },
  { id: 5, name: 'Motor Repair', icon: '⚙️' },
  { id: 6, name: 'More', icon: '➕' },
];

const nearbyStores = [
  { id: 1, name: 'Sri Pipes', distance: '0.8 km', duration: '15-20 min' },
  { id: 2, name: 'Sri Supply Co.', distance: '1.2 km', duration: '20-25 min' },
];

interface Product {
  id: number;
  sku: string;
  name: string;
  description: string;
  price: number;
  categoryName: string;
}

export function HomeScreen({ navigation }: any) {
  const dispatch = useDispatch();
  const [socket, setSocket] = useState<Socket | null>(null);
  const edgeServerUrl = getConfiguredEdgeUrl();
  const edgeUnavailable = !edgeServerUrl;
  
  // Plumber Booking State from Redux
  const isSearching = useSelector((state: RootState) => state.plumbers.isSearching);
  const activeJob = useSelector((state: RootState) => state.plumbers.activeJob);
  const selectedMode = useSelector((state: RootState) => state.plumbers.selectedMode);
  const selectedCategory = useSelector((state: RootState) => state.plumbers.selectedCategory || categories[0]);
  const currentUser = useSelector((state: RootState) => state.auth.user);

  // Product Catalog State
  const [products, setProducts] = useState<Product[]>([]);
  const cart = useSelector((state: RootState) => state.cart.items);
  const token = useSelector((state: RootState) => state.auth.token);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // Delivery Tracking State from Redux
  const activeProductOrder = useSelector((state: RootState) => state.orders.activeProductOrder);
  const productOrderStatus = activeProductOrder?.status || '';
  const [otpInput, setOtpInput] = useState<string>('');
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  // Notifications state for badge count
  const unreadCount = useSelector((state: RootState) => state.notifications.unreadCount);

  // Phase 3: Plumber mid-job material request payment
  const [materialPaymentRequest, setMaterialPaymentRequest] = useState<MaterialPaymentRequest | null>(null);
  const [isApprovingPayment, setIsApprovingPayment] = useState(false);

  // Fetch Products on Startup
  useEffect(() => {
    ProductRepository.getProducts()
      .then(data => {
        setProducts(data);
      })
      .catch(err => console.log('Failed to fetch products:', err));
  }, []);

  // WebSockets Setup
  useEffect(() => {
    if (!edgeServerUrl) {
      setSocket(null);
      return;
    }

    const newSocket = io(edgeServerUrl);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      newSocket.emit('register_customer', { customerId: CUSTOMER_ID });
    });

    newSocket.on('PLUMBER_ASSIGNED', (data: ActiveJob) => {
      dispatch(setActiveJob(data));
      Alert.alert('Plumber assigned', `Partner ${data.plumberId ?? 'nearby'} is on the way.`);
    });

    newSocket.on('DELIVERY_ASSIGNED', (data: any) => {
      console.log('Received DELIVERY_ASSIGNED socket event:', data);
      if (activeProductOrder) {
        dispatch(setActiveProductOrder({
          ...activeProductOrder,
          status: 'OUT_FOR_DELIVERY',
          deliveryPartnerName: data.deliveryPartnerName,
        }));
      }
      Alert.alert('Delivery Rider Assigned', `${data.deliveryPartnerName} has picked up your materials and is out for delivery!`);
    });

    // Phase 3: Plumber requested parts mid-job — show payment approval card
    newSocket.on('MATERIAL_PAYMENT_REQUIRED', (data: MaterialPaymentRequest) => {
      console.log('Received MATERIAL_PAYMENT_REQUIRED:', data);
      setMaterialPaymentRequest(data);
    });

    return () => {
      newSocket.close();
    };
  }, [activeProductOrder, edgeServerUrl]);

  useEffect(() => {
    if (!token || !currentUser?.id) {
      return;
    }

    let cancelled = false;
    const syncMaterialRequests = async () => {
      try {
        const requests = await OrderRepository.getCustomerMaterialRequests();
        if (cancelled) {
          return;
        }

        const pendingRequest = (requests || []).find((request: any) => request.status === 'PENDING');
        if (pendingRequest) {
          setMaterialPaymentRequest({
            productOrderId: pendingRequest.id,
            serviceOrderId: pendingRequest.serviceOrderId,
            plumberName: pendingRequest.assignedPlumberName || 'Assigned plumber',
            totalAmount: Number(pendingRequest.totalAmount || 0),
            message: 'Your plumber requested additional materials to finish the service. Approve payment to continue.',
          });
        } else if (!socket) {
          setMaterialPaymentRequest(null);
        }
      } catch (error) {
        console.log('Failed to sync customer material requests:', error);
      }
    };

    syncMaterialRequests();
    const interval = setInterval(syncMaterialRequests, 15000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [token, currentUser?.id, socket]);

  // Polling for Product Order Status updates
  useEffect(() => {
    if (!activeProductOrder) return;

    const interval = setInterval(async () => {
      try {
        const data = await OrderRepository.getProductOrderStatus(activeProductOrder.id);
        dispatch(setActiveProductOrder(data));
        
        if (data.status === 'DELIVERED') {
          Alert.alert('Order Delivered', 'Your plumbing materials have been delivered successfully!');
          clearInterval(interval);
        }
      } catch (err) {
        console.log('Failed to poll order status:', err);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [activeProductOrder, edgeServerUrl]);

  const addToCart = (productId: number) => {
    dispatch(addToCartAction(productId));
  };

  const clearCart = () => {
    dispatch(clearCartAction());
  };

  const handleCheckout = async () => {
    const items = Object.entries(cart)
      .filter(([_, qty]) => qty > 0)
      .map(([id, qty]) => ({ productId: parseInt(id), quantity: qty }));

    if (items.length === 0) {
      Alert.alert('Empty Cart', 'Please add items to your cart first.');
      return;
    }

    if (!token) {
      Alert.alert('Authentication Error', 'Not logged in. Please try again.');
      return;
    }

    setIsCheckingOut(true);
    try {
      const result = await CartRepository.reserveStock({
        storeId: 1,
        items: items
      });

      setIsCheckingOut(false);
      Alert.alert(
        'Reservation Successful',
        `Order #${result.id} created.\nReserved ${items.length} item(s).\nTotal: Rs. ${result.totalAmount}`,
        [
          { text: 'Cancel/Release Order', onPress: () => releaseOrder(result.id) },
          { text: 'Pay/Confirm Order', onPress: () => confirmOrder(result.id) }
        ]
      );
      clearCart();
    } catch (err: any) {
      setIsCheckingOut(false);
      Alert.alert('Checkout Failed', err.message || 'Could not complete checkout.');
    }
  };

  const confirmOrder = async (orderId: number) => {
    try {
      await CartRepository.confirmPayment(orderId);
      // Fetch order details to set activeProductOrder for tracking
      const orderData = await OrderRepository.getProductOrderStatus(orderId);
      dispatch(setActiveProductOrder(orderData));
      Alert.alert('Confirmed', 'Order confirmed and ready for dispatch!');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to confirm order.');
    }
  };

  const releaseOrder = async (orderId: number) => {
    try {
      await CartRepository.releaseReservation(orderId);
      Alert.alert('Released', 'Reservation cancelled and stock restored.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to cancel reservation.');
    }
  };

  const verifyOrderOtp = async () => {
    if (!activeProductOrder || !otpInput) return;
    setIsVerifyingOtp(true);
    try {
      await OrderRepository.confirmProductDelivery(activeProductOrder.id, otpInput);
      setIsVerifyingOtp(false);
      dispatch(updateProductOrderStatus('DELIVERED'));
      Alert.alert('Delivery Verified', 'Order status updated to DELIVERED successfully.');
    } catch (err: any) {
      setIsVerifyingOtp(false);
      Alert.alert('Verification Failed', err.message || 'Incorrect OTP code.');
    }
  };

  // Phase 3: Customer approves the plumber's mid-job material request payment
  const approveMaterialPayment = async () => {
    if (!materialPaymentRequest || !token) return;
    setIsApprovingPayment(true);
    try {
      await CartRepository.confirmPayment(materialPaymentRequest.productOrderId);
      setIsApprovingPayment(false);
      setMaterialPaymentRequest(null);
      Alert.alert(
        '✅ Payment Approved!',
        'Parts are being dispatched to your plumber’s location. Work will resume shortly.'
      );
    } catch (err: any) {
      setIsApprovingPayment(false);
      Alert.alert('Payment Failed', err.message || 'Could not process payment. Please try again.');
    }
  };

  const requestNearbyPlumber = async () => {
    if (!edgeServerUrl) {
      Alert.alert('Feature unavailable', EDGE_UNAVAILABLE_MESSAGE);
      return;
    }

    dispatch(startSearching());
    try {
      const result = await PlumberRepository.requestNearbyPlumber({
        customerId: currentUser?.id ?? 0,
        longitude: -122.4194,
        latitude: 37.7749,
        requestType: selectedMode,
        category: selectedCategory,
      });

      dispatch(stopSearching());
      Alert.alert('Broadcast Completed', result.message || 'Job broadcasted to nearby plumbers.');
    } catch (error: any) {
      dispatch(stopSearching());
      Alert.alert('Connection issue', error.message || 'Could not reach the dispatch service.');
    }
  };

  const selectedService = useMemo(
    () => serviceOptions.find((option) => option.id === selectedMode) ?? serviceOptions[0],
    [selectedMode]
  );

  const handleCategoryPress = (category: HomeCategory) => {
    if (category.name === 'More') {
      navigation.navigate('Categories');
    } else {
      dispatch(setBookingConfig({ mode: selectedMode, category: category.name }));
    }
  };

  /* Render Product Order Dispatch Tracking screen */
  if (activeProductOrder) {
    const trackingPartner = activeProductOrder.deliveryPartnerName;
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.trackingContent}>
          <View style={[styles.hero, { backgroundColor: '#1E3A8A' }]}>
            <Text style={[styles.brand, { color: '#93C5FD' }]}>PlumbCommerce Quick-Commerce</Text>
            <Text style={styles.heroTitle}>Track Materials Order #{activeProductOrder.id}</Text>
            <Text style={[styles.heroSub, { color: '#BFDBFE' }]}>Hyperlocal delivery in 30-45 minutes</Text>
          </View>

          <View style={[styles.mapPanel, { backgroundColor: '#DBEAFE' }]}>
            <View style={[styles.routeLine, { backgroundColor: '#3B82F6' }]} />
            <View style={[styles.mapPin, styles.customerPin]}>
              <Text style={styles.pinText}>You</Text>
            </View>
            <View style={[styles.mapPin, styles.partnerPin, { backgroundColor: '#3B82F6' }]}>
              <Text style={styles.pinText}>Store</Text>
            </View>
            <View style={styles.etaBadge}>
              <Text style={[styles.etaNumber, { color: '#1D4ED8', fontSize: 18 }]}>{productOrderStatus}</Text>
              <Text style={styles.etaLabel}>Order Status</Text>
            </View>
          </View>

          <View style={styles.sheet}>
            <View style={styles.partnerRow}>
              <View style={[styles.avatar, { backgroundColor: '#3B82F6' }]}>
                <Text style={styles.avatarText}>D</Text>
              </View>
              <View style={styles.partnerCopy}>
                <Text style={styles.partnerName}>
                  {trackingPartner ? `${trackingPartner}` : 'Locating Delivery Rider...'}
                </Text>
                <Text style={styles.partnerMeta}>
                  {trackingPartner ? 'Out for delivery' : 'Searching for closest available rider'}
                </Text>
              </View>
              <Text style={[styles.statusPill, { backgroundColor: '#DBEAFE', color: '#1D4ED8' }]}>
                Active
              </Text>
            </View>

            {productOrderStatus === 'OUT_FOR_DELIVERY' && (
              <View style={styles.otpInputContainer}>
                <Text style={styles.otpInputLabel}>Enter Delivery Rider's OTP Code</Text>
                <Text style={styles.otpInputSub}>Rider will read out a 4-digit code. Enter it below to complete delivery.</Text>
                <View style={styles.otpInputRow}>
                  <TextInput
                    style={styles.otpTextInput}
                    placeholder="e.g. 1234"
                    maxLength={4}
                    keyboardType="number-pad"
                    value={otpInput}
                    onChangeText={setOtpInput}
                  />
                  <TouchableOpacity 
                    style={[styles.primaryButton, { backgroundColor: '#3B82F6', minWidth: 100 }]} 
                    onPress={verifyOrderOtp}
                  >
                    {isVerifyingOtp ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text style={styles.primaryButtonText}>Verify</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <TouchableOpacity 
              style={[styles.secondaryButton, { borderColor: '#3B82F6' }]} 
              onPress={() => {
                dispatch(setActiveProductOrder(null));
                setOtpInput('');
              }}
            >
              <Text style={[styles.secondaryButtonText, { color: '#3B82F6' }]}>Go Back to Store</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  /* Render Plumber Task Tracking screen */
  if (activeJob) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.trackingContent}>
          {/* Phase 3: Material Payment Approval Card — floats at top if request is pending */}
          {materialPaymentRequest && (
            <View style={styles.materialApprovalCard}>
              <Text style={styles.materialApprovalEyebrow}>🔧 Parts Needed by Your Plumber</Text>
              <Text style={styles.materialApprovalTitle}>{materialPaymentRequest.plumberName} needs supplies</Text>
              <Text style={styles.materialApprovalMsg}>{materialPaymentRequest.message}</Text>
              <View style={styles.materialApprovalAmountRow}>
                <Text style={styles.materialApprovalLabel}>Total to Pay</Text>
                <Text style={styles.materialApprovalAmount}>Rs. {materialPaymentRequest.totalAmount}</Text>
              </View>
              <View style={styles.materialApprovalActions}>
                <TouchableOpacity
                  style={styles.materialDeclineBtn}
                  onPress={() => setMaterialPaymentRequest(null)}
                >
                  <Text style={styles.materialDeclineBtnText}>Decline</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.materialApproveBtn, isApprovingPayment && { opacity: 0.6 }]}
                  onPress={approveMaterialPayment}
                  disabled={isApprovingPayment}
                >
                  {isApprovingPayment
                    ? <ActivityIndicator color="#FFFFFF" />
                    : <Text style={styles.materialApproveBtnText}>Approve & Pay Rs. {materialPaymentRequest.totalAmount}</Text>
                  }
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={styles.hero}>
            <Text style={styles.brand}>PlumbCommerce</Text>
            <Text style={styles.heroTitle}>Your plumber is on the way</Text>
            <Text style={styles.heroSub}>Live assignment for {selectedCategory.toLowerCase()}.</Text>
          </View>

          <View style={styles.mapPanel}>
            <View style={styles.routeLine} />
            <View style={[styles.mapPin, styles.customerPin]}>
              <Text style={styles.pinText}>You</Text>
            </View>
            <View style={[styles.mapPin, styles.partnerPin]}>
              <Text style={styles.pinText}>Pro</Text>
            </View>
            <View style={styles.etaBadge}>
              <Text style={styles.etaNumber}>9 min</Text>
              <Text style={styles.etaLabel}>estimated arrival</Text>
            </View>
          </View>

          <View style={styles.sheet}>
            <View style={styles.partnerRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>P</Text>
              </View>
              <View style={styles.partnerCopy}>
                <Text style={styles.partnerName}>Partner {activeJob.plumberId ?? 'assigned'}</Text>
                <Text style={styles.partnerMeta}>Verified plumber - 4.8 rating - Tools ready</Text>
              </View>
              <Text style={styles.statusPill}>En route</Text>
            </View>

            <View style={styles.timeline}>
              <Text style={styles.timelineItem}>Request confirmed</Text>
              <Text style={styles.timelineItem}>Partner accepted</Text>
              <Text style={styles.timelineItemMuted}>Inspection and quote pending</Text>
            </View>

            <TouchableOpacity style={styles.secondaryButton} onPress={() => dispatch(setActiveJob(null))}>
              <Text style={styles.secondaryButtonText}>Cancel request</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.locationSelector}>
          <Text style={styles.pinEmoji}>📍</Text>
          <Text style={styles.locationTitle}>Hyderabad</Text>
          <Text style={styles.dropdownArrow}>▼</Text>
        </View>
        <TouchableOpacity
          style={styles.notificationBell}
          onPress={() => navigation.navigate('Notifications')}
        >
          <Text style={styles.bellEmoji}>🔔</Text>
          {unreadCount > 0 && <View style={styles.bellBadge} />}
        </TouchableOpacity>

      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.greetingSection}>
          <Text style={styles.greetingText}>Good Evening,</Text>
          <Text style={styles.profileName}>Akhil 👋</Text>
        </View>

        <View style={styles.searchBarContainer}>
          <SearchBar
            placeholder="Search for pipes, taps, fittings..."
            editable={false}
            onFocus={() => navigation.navigate('Search')}
          />
        </View>

        <View style={[styles.hero, { backgroundColor: colors.primary }]}>
          <View style={styles.heroLeft}>
            <Text style={styles.heroTitle}>Plumbing Emergency?</Text>
            <TouchableOpacity 
              style={styles.heroButton} 
              onPress={requestNearbyPlumber}
              disabled={isSearching || edgeUnavailable}
            >
              {isSearching ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                <Text style={styles.heroButtonText}>Find Plumber Now</Text>
              )}
            </TouchableOpacity>
            <Text style={styles.etaText}>ETA 10-15 mins</Text>
            {edgeUnavailable && (
              <Text style={styles.edgeNoticeText}>{EDGE_UNAVAILABLE_MESSAGE}</Text>
            )}
          </View>
          <Text style={styles.heroPlumberIllustration}>👨‍🔧</Text>
        </View>

        <View style={styles.whatNeedSection}>
          <Text style={styles.sectionTitle}>What do you need?</Text>
          <View style={styles.categoriesGrid}>
            {homeCategories.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.categoryGridItem}
                onPress={() => handleCategoryPress(item)}
              >
                <View style={styles.gridIconCircle}>
                  <Text style={styles.gridEmoji}>{item.icon}</Text>
                </View>
                <Text style={styles.gridLabel}>{item.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.storesSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Nearby Stores</Text>
            <TouchableOpacity onPress={() => {}}>
              <Text style={styles.seeAllLink}>See all</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.storesList}>
            {nearbyStores.map((store) => (
              <StoreCard
                key={store.id}
                id={store.id}
                name={store.name}
                distance={store.distance}
                duration={store.duration}
                onPress={() => {}}
              />
            ))}
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRail}>
          {categories.map((category) => (
            <Pressable
              key={category}
              style={[styles.categoryChip, selectedCategory === category && styles.categoryChipActive]}
              onPress={() => dispatch(setBookingConfig({ mode: selectedMode, category }))}
            >
              <Text style={[styles.categoryText, selectedCategory === category && styles.categoryTextActive]}>
                {category}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.promiseRow}>
          <View style={styles.promiseCard}>
            <Text style={styles.promiseValue}>10 min</Text>
            <Text style={styles.promiseLabel}>avg response</Text>
          </View>
          <View style={styles.promiseCard}>
            <Text style={styles.promiseValue}>Rs. 0</Text>
            <Text style={styles.promiseLabel}>hidden fees</Text>
          </View>
          <View style={styles.promiseCard}>
            <Text style={styles.promiseValue}>24/7</Text>
            <Text style={styles.promiseLabel}>emergency</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Choose booking mode</Text>
        <View style={styles.modeList}>
          {serviceOptions.map((option) => {
            const selected = selectedMode === option.id;
            return (
              <TouchableOpacity
                key={option.id}
                style={[styles.modeCard, selected && { borderColor: option.accent }]}
                onPress={() => dispatch(setBookingConfig({ mode: option.id, category: selectedCategory }))}
              >
                <View style={[styles.modeIcon, { backgroundColor: option.accent }]}>
                  <Text style={styles.modeIconText}>{option.title.slice(0, 1)}</Text>
                </View>
                <View style={styles.modeCopy}>
                  <Text style={styles.modeTitle}>{option.title}</Text>
                  <Text style={styles.modeSubtitle}>{option.subtitle}</Text>
                  <View style={styles.modeMetaRow}>
                    <Text style={styles.modeMeta}>{option.eta}</Text>
                    <Text style={styles.modeMeta}>{option.price}</Text>
                  </View>
                </View>
                <View style={[styles.radio, selected && { borderColor: option.accent }]}>
                  {selected && <View style={[styles.radioDot, { backgroundColor: option.accent }]} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Order Materials (Q-Commerce)</Text>
        <View style={styles.productList}>
          {Array.isArray(products) && products.map((p) => {
            const count = cart[p.id] || 0;
            return (
              <View key={p.id} style={styles.productCard}>
                <View style={styles.productInfo}>
                  <Text style={styles.productName}>{p.name}</Text>
                  <Text style={styles.productPrice}>Rs. {p.price}</Text>
                  <Text style={styles.productCategory}>{p.categoryName}</Text>
                </View>
                <TouchableOpacity style={styles.addButton} onPress={() => addToCart(p.id)}>
                  <Text style={styles.addButtonText}>{count > 0 ? `Add More (${count})` : 'Add'}</Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        {Object.values(cart).some(c => c > 0) && (
          <View style={[styles.checkoutBar, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE', marginTop: 12, marginBottom: 12 }]}>
            <View>
              <Text style={styles.checkoutLabel}>Total Cart Items</Text>
              <Text style={styles.checkoutTitle}>
                {Object.values(cart).reduce((a, b) => a + b, 0)} Items Selected
              </Text>
            </View>
            <TouchableOpacity style={[styles.primaryButton, { backgroundColor: '#2563EB' }]} onPress={handleCheckout}>
              <Text style={styles.primaryButtonText}>Buy Now</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.checkoutBar}>
          <View>
            <Text style={styles.checkoutLabel}>Selected</Text>
            <Text style={styles.checkoutTitle}>{selectedService.title}</Text>
          </View>
          <TouchableOpacity
            style={[styles.primaryButton, isSearching && styles.primaryButtonDisabled]}
            onPress={requestNearbyPlumber}
            disabled={isSearching}
          >
            {isSearching ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryButtonText}>Find plumber</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Temporary Logout button for testing Auth flows */}
        <TouchableOpacity 
          style={[styles.secondaryButton, { marginTop: 24 }]} 
          onPress={() => {
            dispatch(logout());
            navigation.navigate('Auth', { screen: 'Login' });
          }}
        >
          <Text style={styles.secondaryButtonText}>Logout / Return to Login</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.layout,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1.5,
    borderBottomColor: colors.border,
  },
  locationSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  pinEmoji: {
    fontSize: 16,
  },
  dropdownArrow: {
    fontSize: 10,
    color: colors.textSecondary,
    marginLeft: 2,
  },
  notificationBell: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    position: 'relative',
  },
  bellEmoji: {
    fontSize: 18,
  },
  bellBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.error,
  },
  content: { padding: 18, paddingBottom: 28 },
  trackingContent: { paddingBottom: 28 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  locationLabel: { color: '#6B7280', fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  locationTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '800' },
  profileDot: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#111827', alignItems: 'center', justifyContent: 'center' },
  profileInitial: { color: '#FFFFFF', fontWeight: '900' },
  greetingSection: {
    marginBottom: spacing.md,
  },
  greetingText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },
  profileName: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.black,
    color: colors.textPrimary,
    marginTop: 2,
  },
  searchBarContainer: {
    marginBottom: spacing.lg,
  },
  hero: {
    borderRadius: borderRadius.lg,
    padding: 20,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    overflow: 'hidden',
  },
  heroLeft: {
    flex: 1,
  },
  heroTitle: { color: '#FFFFFF', fontSize: 24, fontWeight: '900' },
  heroButton: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    marginTop: spacing.md,
    alignSelf: 'flex-start',
  },
  heroButtonText: {
    color: colors.primary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  },

  etaText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: typography.fontSize.xs,
    marginTop: spacing.sm,
    fontWeight: typography.fontWeight.bold,
  },
  edgeNoticeText: {
    color: '#FDE68A',
    fontSize: typography.fontSize.xs,
    marginTop: spacing.sm,
    fontWeight: typography.fontWeight.bold,
  },
  heroPlumberIllustration: {
    fontSize: 60,
  },
  brand: { color: '#7DD3BC', fontSize: 13, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0 },
  heroSub: { color: '#D1FAE5', fontSize: 15, lineHeight: 22, marginTop: 10 },
  whatNeedSection: {
    marginBottom: spacing.lg,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  categoryGridItem: {
    width: '30%',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1,
  },
  gridIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  gridEmoji: {
    fontSize: 22,
  },
  gridLabel: {
    fontSize: 11,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  storesSection: {
    marginBottom: spacing.lg,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  seeAllLink: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: typography.fontWeight.bold,
  },
  storesList: {
    gap: spacing.xs,
  },
  categoryRail: { gap: 10, paddingBottom: 16 },
  categoryChip: { backgroundColor: '#FFFFFF', borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10, borderWidth: 1, borderColor: '#E5E7EB' },
  categoryChipActive: { backgroundColor: '#111827', borderColor: '#111827' },
  categoryText: { color: '#374151', fontSize: 14, fontWeight: '800' },
  categoryTextActive: { color: '#FFFFFF' },
  promiseRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  promiseCard: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#E5E7EB' },
  promiseValue: { color: '#111827', fontSize: 18, fontWeight: '900' },
  promiseLabel: { color: '#6B7280', fontSize: 12, fontWeight: '700', marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: colors.textPrimary },
  modeList: { gap: 12, marginTop: 12 },
  modeCard: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 18, padding: 14, borderWidth: 2, borderColor: '#FFFFFF', alignItems: 'center' },
  modeIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  modeIconText: { color: '#FFFFFF', fontSize: 18, fontWeight: '900' },
  modeCopy: { flex: 1 },
  modeTitle: { color: '#111827', fontSize: 17, fontWeight: '900' },
  modeSubtitle: { color: '#6B7280', fontSize: 13, lineHeight: 18, marginTop: 4 },
  modeMetaRow: { flexDirection: 'row', gap: 8, marginTop: 8, flexWrap: 'wrap' },
  modeMeta: { color: '#111827', backgroundColor: '#F3F4F6', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, fontSize: 12, fontWeight: '800' },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#D1D5DB', alignItems: 'center', justifyContent: 'center', marginLeft: 10 },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
  checkoutBar: { backgroundColor: '#FFFFFF', borderRadius: 22, padding: 16, marginTop: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#E5E7EB' },
  checkoutLabel: { color: '#6B7280', fontSize: 12, fontWeight: '800' },
  checkoutTitle: { color: '#111827', fontSize: 16, fontWeight: '900', marginTop: 2 },
  primaryButton: { backgroundColor: '#11A683', borderRadius: 16, minWidth: 132, height: 52, alignItems: 'center', justifyContent: 'center' },
  primaryButtonDisabled: { opacity: 0.7 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
  mapPanel: { height: 240, margin: 18, borderRadius: 30, backgroundColor: '#D7E7DD', overflow: 'hidden', justifyContent: 'center' },
  routeLine: { position: 'absolute', left: 90, right: 78, top: 114, height: 4, backgroundColor: '#11A683', borderRadius: 2 },
  mapPin: { position: 'absolute', width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: '#FFFFFF' },
  customerPin: { left: 48, top: 86, backgroundColor: '#111827' },
  partnerPin: { right: 45, top: 86, backgroundColor: '#11A683' },
  pinText: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
  etaBadge: { position: 'absolute', alignSelf: 'center', bottom: 18, backgroundColor: '#FFFFFF', borderRadius: 18, paddingHorizontal: 18, paddingVertical: 10, alignItems: 'center' },
  etaNumber: { color: '#111827', fontSize: 20, fontWeight: '900' },
  etaLabel: { color: '#6B7280', fontSize: 11, fontWeight: '700' },
  sheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, marginTop: 4 },
  partnerRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#F59E0B', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarText: { color: '#FFFFFF', fontSize: 22, fontWeight: '900' },
  partnerCopy: { flex: 1 },
  partnerName: { color: '#111827', fontSize: 18, fontWeight: '900' },
  partnerMeta: { color: '#6B7280', fontSize: 13, marginTop: 3 },
  statusPill: { color: '#065F46', backgroundColor: '#D1FAE5', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, fontSize: 12, fontWeight: '900' },
  timeline: { marginTop: 18, gap: 10 },
  timelineItem: { color: '#111827', fontSize: 15, fontWeight: '800' },
  timelineItemMuted: { color: '#9CA3AF', fontSize: 15, fontWeight: '800' },
  secondaryButton: { marginTop: 20, height: 52, borderRadius: 16, borderWidth: 1, borderColor: '#FCA5A5', alignItems: 'center', justifyContent: 'center' },
  secondaryButtonText: { color: '#DC2626', fontSize: 15, fontWeight: '900' },
  productList: { gap: 10, marginTop: 12, marginBottom: 15 },
  productCard: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center', justifyContent: 'space-between' },
  productInfo: { flex: 1 },
  productName: { color: '#111827', fontSize: 16, fontWeight: '800' },
  productPrice: { color: '#11A683', fontSize: 14, fontWeight: '800', marginTop: 2 },
  productCategory: { color: '#9CA3AF', fontSize: 11, fontWeight: '700', marginTop: 2, textTransform: 'uppercase' },
  addButton: { backgroundColor: '#111827', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  addButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  otpInputContainer: { backgroundColor: '#EFF6FF', borderRadius: 18, padding: 16, marginTop: 18, borderWidth: 2, borderStyle: 'dashed', borderColor: '#3B82F6' },
  otpInputLabel: { color: '#1D4ED8', fontSize: 14, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 },
  otpInputSub: { color: '#4B5563', fontSize: 12, fontWeight: '700', marginVertical: 6, lineHeight: 18 },
  otpInputRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  otpTextInput: { flex: 1, height: 52, backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#BFDBFE', paddingHorizontal: 16, fontSize: 18, fontWeight: '900', color: '#1E3A8A', letterSpacing: 4, textAlign: 'center' },
  // Phase 3 — Material Payment Approval Card
  materialApprovalCard: { margin: 18, marginBottom: 0, backgroundColor: '#FFFBEB', borderRadius: 24, padding: 18, borderWidth: 2, borderColor: '#F59E0B' },
  materialApprovalEyebrow: { color: '#92400E', fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 },
  materialApprovalTitle: { color: '#111827', fontSize: 20, fontWeight: '900', marginTop: 6 },
  materialApprovalMsg: { color: '#6B7280', fontSize: 14, lineHeight: 20, marginTop: 6, fontWeight: '700' },
  materialApprovalAmountRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, backgroundColor: '#FEF3C7', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10 },
  materialApprovalLabel: { color: '#92400E', fontSize: 13, fontWeight: '800' },
  materialApprovalAmount: { color: '#92400E', fontSize: 20, fontWeight: '900' },
  materialApprovalActions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  materialDeclineBtn: { flex: 1, height: 52, borderRadius: 14, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  materialDeclineBtnText: { color: '#475569', fontSize: 14, fontWeight: '900' },
  materialApproveBtn: { flex: 2, height: 52, borderRadius: 14, backgroundColor: '#F59E0B', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  materialApproveBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '900', textAlign: 'center' },
});









