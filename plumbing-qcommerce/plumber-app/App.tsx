import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Switch, TouchableOpacity, Platform } from 'react-native';
import io, { Socket } from 'socket.io-client';
import * as Location from 'expo-location';

const LOCAL_HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
const SERVER_URL = process.env.EXPO_PUBLIC_EDGE_URL || `http://${LOCAL_HOST}:3000`;
const CORE_API_URL = process.env.EXPO_PUBLIC_CORE_API_URL || `http://${LOCAL_HOST}:8081`;
const LOCAL_PLUMBER_EMAIL = process.env.EXPO_PUBLIC_PLUMBER_EMAIL || 'plumber1@plumb.local';
const LOCAL_PLUMBER_PASSWORD = process.env.EXPO_PUBLIC_PLUMBER_PASSWORD || 'LocalPass123!';

interface LoginResponse {
  token: string;
  email: string;
}

interface JobOffer {
  jobId: string;
  customerId: string;
  distance: number;
}

export default function App() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [plumberEmail, setPlumberEmail] = useState(LOCAL_PLUMBER_EMAIL);
  const [connectionStatus, setConnectionStatus] = useState('Signing in to local backend...');
  const [isOnline, setIsOnline] = useState(false);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [jobOffer, setJobOffer] = useState<JobOffer | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function signIn() {
      try {
        const response = await fetch(`${CORE_API_URL}/api/v1/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: LOCAL_PLUMBER_EMAIL,
            password: LOCAL_PLUMBER_PASSWORD,
          }),
        });

        if (!response.ok) {
          throw new Error('Local plumber login failed');
        }

        const result = (await response.json()) as LoginResponse;
        if (!isMounted) return;
        setAuthToken(result.token);
        setPlumberEmail(result.email);
        setConnectionStatus('Authenticated. Connecting to dispatch edge...');
      } catch (error) {
        if (!isMounted) return;
        setConnectionStatus('Local backend login failed');
      }
    }

    signIn();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!authToken) return;

    const newSocket = io(SERVER_URL, {
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

    newSocket.on('JOB_OFFER', (offer: JobOffer) => {
      setJobOffer(offer);
    });

    return () => {
      newSocket.close();
      setSocket(null);
    };
  }, [authToken]);

  useEffect(() => {
    let locationInterval: ReturnType<typeof setInterval> | null = null;

    const startTracking = async () => {
      if (isOnline && socket) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          alert('Permission to access location was denied');
          setIsOnline(false);
          return;
        }

        locationInterval = setInterval(async () => {
          const loc = await Location.getCurrentPositionAsync({});
          setLocation(loc);

          socket.emit(
            'location_ping',
            {
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
            },
            (ack?: { ok?: boolean; error?: string }) => {
              if (ack?.error) {
                setConnectionStatus('Location update rejected by edge');
              }
            }
          );
        }, 5000);
      }
    };

    if (isOnline) {
      startTracking();
    }

    return () => {
      if (locationInterval) clearInterval(locationInterval);
    };
  }, [isOnline, socket]);

  const toggleOnline = (value: boolean) => {
    if (value && !socket) {
      setConnectionStatus('Waiting for authenticated edge connection');
      return;
    }
    setIsOnline(value);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>PlumbCommerce | Partner</Text>
        <Text style={styles.headerSubText}>{connectionStatus}</Text>
      </View>

      <View style={styles.statusCard}>
        <Text style={styles.identityText}>Signed in as {plumberEmail}</Text>
        <Text style={styles.statusText}>Availability Status</Text>
        <View style={styles.toggleRow}>
          <Text style={isOnline ? styles.onlineText : styles.offlineText}>
            {isOnline ? 'ONLINE AND TRACKING' : 'OFFLINE'}
          </Text>
          <Switch value={isOnline} onValueChange={toggleOnline} trackColor={{ false: '#fca5a5', true: '#6ee7b7' }} thumbColor={isOnline ? '#10b981' : '#ef4444'} />
        </View>
        {location && isOnline && (
          <Text style={styles.coords}>
            Lat: {location.coords.latitude.toFixed(4)}, Lon: {location.coords.longitude.toFixed(4)}
          </Text>
        )}
      </View>

      {jobOffer ? (
        <View style={styles.jobCard}>
          <Text style={styles.jobAlert}>New Job Offer</Text>
          <View style={styles.jobDetailsContainer}>
            <Text style={styles.jobDetail}>
              ID: <Text style={styles.bold}>{jobOffer.jobId}</Text>
            </Text>
            <Text style={styles.jobDetail}>
              Client: <Text style={styles.bold}>{jobOffer.customerId}</Text>
            </Text>
            <Text style={styles.jobDetail}>
              Distance: <Text style={styles.bold}>{jobOffer.distance.toFixed(2)} km</Text> away
            </Text>
          </View>
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.rejectButton} onPress={() => setJobOffer(null)}>
              <Text style={styles.rejectButtonText}>DECLINE</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.acceptButton}
              onPress={() => {
                alert('Job accepted. Navigate to the customer location.');
                setJobOffer(null);
              }}
            >
              <Text style={styles.buttonText}>ACCEPT AND NAVIGATE</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.idleView}>
          <Text style={styles.idleText}>
            {isOnline ? 'Searching for nearby customers...' : 'Go online to receive routing jobs.'}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f4f5' },
  header: { backgroundColor: '#1e40af', padding: 20, paddingTop: 60, alignItems: 'center', shadowColor: '#000', elevation: 5 },
  headerText: { color: '#fff', fontSize: 22, fontWeight: '800' },
  headerSubText: { color: '#dbeafe', fontSize: 13, fontWeight: '700', marginTop: 8 },
  statusCard: { backgroundColor: '#fff', margin: 15, padding: 20, borderRadius: 12, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5, elevation: 3 },
  identityText: { color: '#6b7280', fontSize: 13, fontWeight: '700', marginBottom: 14 },
  statusText: { fontSize: 14, color: '#6b7280', marginBottom: 10, textTransform: 'uppercase', fontWeight: 'bold' },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  onlineText: { color: '#059669', fontWeight: '900', fontSize: 18 },
  offlineText: { color: '#dc2626', fontWeight: '900', fontSize: 18 },
  coords: { marginTop: 12, color: '#6b7280', fontSize: 12, fontFamily: 'monospace' },
  idleView: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  idleText: { color: '#6b7280', fontSize: 16, fontWeight: '600', textAlign: 'center' },
  jobCard: { backgroundColor: '#fff', margin: 15, padding: 20, borderRadius: 12, borderWidth: 2, borderColor: '#dc2626', elevation: 8 },
  jobAlert: { fontSize: 20, fontWeight: '900', color: '#dc2626', textAlign: 'center', marginBottom: 15 },
  jobDetailsContainer: { backgroundColor: '#fee2e2', padding: 15, borderRadius: 8, marginBottom: 20 },
  jobDetail: { fontSize: 16, marginBottom: 5, color: '#7f1d1d' },
  bold: { fontWeight: 'bold' },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between' },
  acceptButton: { backgroundColor: '#059669', padding: 15, borderRadius: 8, flex: 0.65, alignItems: 'center', elevation: 2 },
  rejectButton: { backgroundColor: '#f9fafb', padding: 15, borderRadius: 8, flex: 0.3, alignItems: 'center', borderWidth: 1, borderColor: '#d1d5db' },
  buttonText: { color: '#fff', fontWeight: '800', fontSize: 14, textAlign: 'center' },
  rejectButtonText: { color: '#374151', fontWeight: '800', fontSize: 14 },
});
