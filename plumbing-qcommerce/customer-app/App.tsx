import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import io, { Socket } from 'socket.io-client';

const LOCAL_HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
const EDGE_SERVER_URL = process.env.EXPO_PUBLIC_EDGE_URL || `http://${LOCAL_HOST}:3000`;
const CORE_API_URL = process.env.EXPO_PUBLIC_CORE_API_URL || `http://${LOCAL_HOST}:8081`;
const LOCAL_CUSTOMER_EMAIL = process.env.EXPO_PUBLIC_CUSTOMER_EMAIL || 'customer@plumb.local';
const LOCAL_CUSTOMER_PASSWORD = process.env.EXPO_PUBLIC_CUSTOMER_PASSWORD || 'LocalPass123!';

interface LoginResponse {
  token: string;
  email: string;
}

export default function App() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [customerEmail, setCustomerEmail] = useState(LOCAL_CUSTOMER_EMAIL);
  const [connectionStatus, setConnectionStatus] = useState('Signing in to local backend...');
  const [isSearching, setIsSearching] = useState(false);
  const [activeJob, setActiveJob] = useState<any>(null);

  useEffect(() => {
    let isMounted = true;

    async function signIn() {
      try {
        const response = await fetch(`${CORE_API_URL}/api/v1/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: LOCAL_CUSTOMER_EMAIL,
            password: LOCAL_CUSTOMER_PASSWORD,
          }),
        });

        if (!response.ok) {
          throw new Error('Local customer login failed');
        }

        const result = (await response.json()) as LoginResponse;
        if (!isMounted) return;
        setAuthToken(result.token);
        setCustomerEmail(result.email);
        setConnectionStatus('Authenticated. Connecting to dispatch edge...');
      } catch (error) {
        if (!isMounted) return;
        setConnectionStatus('Local backend login failed');
        Alert.alert('Login failed', 'Start the local Docker stack and retry the customer simulator.');
      }
    }

    signIn();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!authToken) return;

    const newSocket = io(EDGE_SERVER_URL, {
      auth: { token: authToken },
    });
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setConnectionStatus('Connected to dispatch edge');
    });

    newSocket.on('connect_error', () => {
      setConnectionStatus('Edge authentication failed');
    });

    newSocket.on('disconnect', () => {
      setConnectionStatus('Disconnected from dispatch edge');
    });

    newSocket.on('PLUMBER_ASSIGNED', (data) => {
      setIsSearching(false);
      setActiveJob(data);
      Alert.alert('Success', `Plumber ${data.plumberId} accepted your request.`);
    });

    return () => {
      newSocket.close();
      setSocket(null);
    };
  }, [authToken]);

  const requestNearbyPlumber = async () => {
    if (!authToken || !socket) {
      Alert.alert('Not ready', 'Customer login is still in progress.');
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`${EDGE_SERVER_URL}/api/v1/edge/requests/nearby`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          longitude: -122.4194,
          latitude: 37.7749,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        setIsSearching(false);
        Alert.alert('Notice', result.message || 'Error finding plumbers');
      } else {
        setConnectionStatus(`Request broadcast to ${result.notified?.length ?? 0} nearby plumbers`);
      }
    } catch (error) {
      setIsSearching(false);
      Alert.alert('Error', 'Failed to reach Edge Server.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>PlumbCommerce</Text>
        <Text style={styles.headerSub}>Need a fix fast?</Text>
        <Text style={styles.statusText}>{connectionStatus}</Text>
      </View>

      <View style={styles.content}>
        {activeJob ? (
          <View style={styles.trackingCard}>
            <Text style={styles.trackingTitle}>Plumber En Route</Text>
            <Text style={styles.detailText}>
              Assigned ID: <Text style={styles.bold}>{activeJob.plumberId}</Text>
            </Text>
            <View style={styles.mapMockup}>
              <Text style={styles.mapText}>Live GPS Tracking Map View</Text>
              <Text style={styles.etaText}>ETA: 2.4 mins</Text>
            </View>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setActiveJob(null)}>
              <Text style={styles.btnText}>Cancel Request</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.requestContainer}>
            <Text style={styles.identityText}>Signed in as {customerEmail}</Text>
            <Text style={styles.sectionTitle}>Select Service Workflow</Text>

            <TouchableOpacity
              style={[styles.workflowCard, styles.lightningCard, isSearching && styles.disabledCard]}
              onPress={requestNearbyPlumber}
              disabled={isSearching}
            >
              {isSearching ? (
                <ActivityIndicator color="#fff" size="large" />
              ) : (
                <>
                  <Text style={[styles.cardTitle, styles.lightText]}>Quick Assign</Text>
                  <Text style={[styles.cardDesc, styles.lightMutedText]}>
                    Instant dispatch of the nearest available plumber using secure edge routing.
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.workflowCard} onPress={() => Alert.alert('WIP', 'Store selection UI pending.')}>
              <Text style={styles.cardTitle}>Pick a Store</Text>
              <Text style={styles.cardDesc}>Browse hardware stores and dispatch specific plumbers assigned to them.</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.workflowCard} onPress={() => Alert.alert('WIP', 'Plumber directory UI pending.')}>
              <Text style={styles.cardTitle}>Direct Plumber</Text>
              <Text style={styles.cardDesc}>Review ratings and book a specific expert plumber directly.</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { backgroundColor: '#2563eb', paddingTop: 70, paddingBottom: 25, paddingHorizontal: 20, shadowColor: '#000', elevation: 4 },
  headerTitle: { color: '#fff', fontSize: 32, fontWeight: '900' },
  headerSub: { color: '#bfdbfe', fontSize: 18, marginTop: 4, fontWeight: '600' },
  statusText: { color: '#eff6ff', fontSize: 13, marginTop: 12, fontWeight: '700' },
  content: { flex: 1, padding: 20 },
  identityText: { color: '#6b7280', fontSize: 13, fontWeight: '700', marginBottom: 8 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#374151', marginBottom: 20 },
  requestContainer: { flex: 1 },
  workflowCard: { backgroundColor: '#fff', padding: 22, borderRadius: 14, marginBottom: 15, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2, borderWidth: 1, borderColor: '#e5e7eb' },
  lightningCard: { backgroundColor: '#059669', borderColor: '#047857' },
  disabledCard: { opacity: 0.7 },
  cardTitle: { fontSize: 22, fontWeight: '900', color: '#111827', marginBottom: 6 },
  cardDesc: { fontSize: 15, color: '#6b7280', lineHeight: 22 },
  lightText: { color: '#fff' },
  lightMutedText: { color: '#d1fae5' },
  trackingCard: { backgroundColor: '#fff', padding: 20, borderRadius: 14, elevation: 5, borderWidth: 2, borderColor: '#2563eb' },
  trackingTitle: { fontSize: 24, fontWeight: '900', color: '#059669', marginBottom: 10, textAlign: 'center' },
  detailText: { fontSize: 16, color: '#4b5563', textAlign: 'center', marginBottom: 20 },
  bold: { fontWeight: 'bold', color: '#111827' },
  mapMockup: { height: 220, backgroundColor: '#f3f4f6', borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: '#d1d5db', borderStyle: 'dashed' },
  mapText: { color: '#6b7280', fontWeight: 'bold', fontSize: 16 },
  etaText: { color: '#2563eb', fontWeight: '900', fontSize: 20, marginTop: 8 },
  cancelBtn: { backgroundColor: '#dc2626', padding: 15, borderRadius: 8, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
