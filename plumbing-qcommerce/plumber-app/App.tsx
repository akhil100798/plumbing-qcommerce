import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Switch, TouchableOpacity } from 'react-native';
import io, { Socket } from 'socket.io-client';
import * as Location from 'expo-location';

const SERVER_URL = 'http://10.0.2.2:3000'; // 10.0.2.2 points to host localhost in Android Emmulator
const PLUMBER_ID = 'plmr_404';

interface JobOffer {
  jobId: string;
  customerId: string;
  distance: number;
}

export default function App() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [jobOffer, setJobOffer] = useState<JobOffer | null>(null);

  useEffect(() => {
    // Connect to Node.js Edge Server via WebSockets
    const newSocket = io(SERVER_URL);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to Edge Server');
      newSocket.emit('register_plumber', { plumberId: PLUMBER_ID });
    });

    // Listen for direct or geo-fenced job offers
    newSocket.on('JOB_OFFER', (offer: JobOffer) => {
      setJobOffer(offer);
    });

    return () => {
      newSocket.close();
    };
  }, []);

  useEffect(() => {
    let locationInterval: NodeJS.Timeout | null = null;

    const startTracking = async () => {
      if (isOnline && socket) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          alert('Permission to access location was denied');
          setIsOnline(false);
          return;
        }

        // Send location ping every 5 seconds simulating continuous background tracking
        locationInterval = setInterval(async () => {
          const loc = await Location.getCurrentPositionAsync({});
          setLocation(loc);

          socket.emit('location_ping', {
            plumberId: PLUMBER_ID,
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          });
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>PlumbCommerce | Partner</Text>
      </View>

      <View style={styles.statusCard}>
        <Text style={styles.statusText}>Availability Status</Text>
        <View style={styles.toggleRow}>
          <Text style={isOnline ? styles.onlineText : styles.offlineText}>
            {isOnline ? 'ONLINE & TRACKING' : 'OFFLINE'}
          </Text>
          <Switch value={isOnline} onValueChange={setIsOnline} trackColor={{ false: '#fca5a5', true: '#6ee7b7' }} thumbColor={isOnline ? '#10b981' : '#ef4444'} />
        </View>
        {location && isOnline && (
          <Text style={styles.coords}>
            Lat: {location.coords.latitude.toFixed(4)}, Lon: {location.coords.longitude.toFixed(4)}
          </Text>
        )}
      </View>

      {jobOffer ? (
        <View style={styles.jobCard}>
          <Text style={styles.jobAlert}>🚨 NEW JOB OFFER ALARM 🚨</Text>
          <View style={styles.jobDetailsContainer}>
            <Text style={styles.jobDetail}>ID: <Text style={styles.bold}>{jobOffer.jobId}</Text></Text>
            <Text style={styles.jobDetail}>Client: <Text style={styles.bold}>{jobOffer.customerId}</Text></Text>
            <Text style={styles.jobDetail}>Distance: <Text style={styles.bold}>{jobOffer.distance.toFixed(2)} km</Text> away</Text>
          </View>
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.rejectButton} onPress={() => setJobOffer(null)}>
              <Text style={styles.buttonText}>DECLINE</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.acceptButton} onPress={() => {
              alert('Job Accepted! Navigating to customer...');
              setJobOffer(null);
            }}>
              <Text style={styles.buttonText}>ACCEPT & NAVIGATE</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.idleView}>
          <Text style={styles.idleText}>
            {isOnline ? '📡 Searching for nearby customers...' : 'Go Online to receive routing jobs.'}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f4f4' },
  header: { backgroundColor: '#1e40af', padding: 20, paddingTop: 60, alignItems: 'center', shadowColor: '#000', elevation: 5 },
  headerText: { color: '#fff', fontSize: 22, fontWeight: '800' },
  statusCard: { backgroundColor: '#fff', margin: 15, padding: 20, borderRadius: 12, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5, elevation: 3 },
  statusText: { fontSize: 14, color: '#6b7280', marginBottom: 10, textTransform: 'uppercase', fontWeight: 'bold' },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  onlineText: { color: '#10b981', fontWeight: '900', fontSize: 18 },
  offlineText: { color: '#ef4444', fontWeight: '900', fontSize: 18 },
  coords: { marginTop: 12, color: '#9ca3af', fontSize: 12, fontFamily: 'monospace' },
  idleView: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  idleText: { color: '#9ca3af', fontSize: 16, fontWeight: '500' },
  jobCard: { backgroundColor: '#fff', margin: 15, padding: 20, borderRadius: 12, borderWidth: 3, borderColor: '#ef4444', elevation: 8 },
  jobAlert: { fontSize: 20, fontWeight: '900', color: '#dc2626', textAlign: 'center', marginBottom: 15 },
  jobDetailsContainer: { backgroundColor: '#fee2e2', padding: 15, borderRadius: 8, marginBottom: 20 },
  jobDetail: { fontSize: 16, marginBottom: 5, color: '#7f1d1d' },
  bold: { fontWeight: 'bold' },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between' },
  acceptButton: { backgroundColor: '#10b981', padding: 15, borderRadius: 8, flex: 0.65, alignItems: 'center', elevation: 2 },
  rejectButton: { backgroundColor: '#f3f4f6', padding: 15, borderRadius: 8, flex: 0.3, alignItems: 'center', borderWidth: 1, borderColor: '#d1d5db' },
  buttonText: { color: '#fff', fontWeight: '800', fontSize: 14 },
});
