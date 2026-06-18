import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import io, { Socket } from 'socket.io-client';

const EDGE_SERVER_URL = 'http://10.0.2.2:3000'; // Android emulator localhost alias
const CUSTOMER_ID = 'cust_999';

export default function App() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [activeJob, setActiveJob] = useState<any>(null);

  useEffect(() => {
    // Connect to the Edge Server
    const newSocket = io(EDGE_SERVER_URL);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Customer connected to WebSocket Edge Server');
      newSocket.emit('register_customer', { customerId: CUSTOMER_ID });
    });

    // Listen for Plumber acceptance or live tracking updates
    newSocket.on('PLUMBER_ASSIGNED', (data) => {
      setIsSearching(false);
      setActiveJob(data);
      Alert.alert('Success!', `Plumber ${data.plumberId} has accepted your request.`);
    });

    return () => {
      newSocket.close();
    };
  }, []);

  const requestNearbyPlumber = async () => {
    setIsSearching(true);
    try {
      // Workflow 1: Auto-assign via Edge Server REST API
      const response = await fetch(`${EDGE_SERVER_URL}/api/v1/edge/requests/nearby`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: CUSTOMER_ID,
          longitude: -122.4194, // Mock coords
          latitude: 37.7749
        }),
      });
      
      const result = await response.json();
      if (!response.ok) {
        setIsSearching(false);
        Alert.alert('Notice', result.message || 'Error finding plumbers');
      } else {
        // Await WebSocket event 'PLUMBER_ASSIGNED'
        console.log("Broadcasted successfully. Awaiting plumber acceptance.", result);
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
      </View>

      <View style={styles.content}>
        {activeJob ? (
          <View style={styles.trackingCard}>
            <Text style={styles.trackingTitle}>Plumber En Route!</Text>
            <Text style={styles.detailText}>Assigned ID: <Text style={styles.bold}>{activeJob.plumberId}</Text></Text>
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
                  <Text style={[styles.cardTitle, {color: '#fff'}]}>⚡ Quick Assign</Text>
                  <Text style={[styles.cardDesc, {color: '#d1fae5'}]}>Instant 0-latency dispatch of the nearest available plumber using Geo-spatial radius search.</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.workflowCard} onPress={() => Alert.alert('WIP', 'Store selection UI pending.')}>
              <Text style={styles.cardTitle}>🏪 Pick a Store</Text>
              <Text style={styles.cardDesc}>Browse hardware stores and dispatch specific plumbers assigned to them.</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.workflowCard} onPress={() => Alert.alert('WIP', 'Plumber directory UI pending.')}>
              <Text style={styles.cardTitle}>👨‍🔧 Direct Plumber</Text>
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
  header: { backgroundColor: '#3b82f6', paddingTop: 70, paddingBottom: 25, paddingHorizontal: 20, shadowColor: '#000', elevation: 4 },
  headerTitle: { color: '#fff', fontSize: 32, fontWeight: '900' },
  headerSub: { color: '#bfdbfe', fontSize: 18, marginTop: 4, fontWeight: '600' },
  content: { flex: 1, padding: 20 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#374151', marginBottom: 20 },
  requestContainer: { flex: 1 },
  workflowCard: { backgroundColor: '#fff', padding: 22, borderRadius: 16, marginBottom: 15, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2, borderWidth: 1, borderColor: '#e5e7eb' },
  lightningCard: { backgroundColor: '#10b981', borderColor: '#059669' },
  disabledCard: { opacity: 0.7 },
  cardTitle: { fontSize: 22, fontWeight: '900', color: '#111827', marginBottom: 6 },
  cardDesc: { fontSize: 15, color: '#6b7280', lineHeight: 22 },
  trackingCard: { backgroundColor: '#fff', padding: 20, borderRadius: 16, elevation: 5, borderWidth: 2, borderColor: '#3b82f6' },
  trackingTitle: { fontSize: 24, fontWeight: '900', color: '#10b981', marginBottom: 10, textAlign: 'center' },
  detailText: { fontSize: 16, color: '#4b5563', textAlign: 'center', marginBottom: 20 },
  bold: { fontWeight: 'bold', color: '#111827' },
  mapMockup: { height: 220, backgroundColor: '#f3f4f6', borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: '#d1d5db', borderStyle: 'dashed' },
  mapText: { color: '#6b7280', fontWeight: 'bold', fontSize: 16 },
  etaText: { color: '#3b82f6', fontWeight: '900', fontSize: 20, marginTop: 8 },
  cancelBtn: { backgroundColor: '#ef4444', padding: 15, borderRadius: 8, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});
