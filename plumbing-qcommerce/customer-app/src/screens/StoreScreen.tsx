import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';
import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';

import { StoreCard } from '../components/cards/StoreCard';
import { SearchBar } from '../components/common/SearchBar';
import { borderRadius, colors, spacing, typography } from '../theme';
import { AppStackParamList, MainTabParamList } from '../types/navigation';
import { apiClient } from '../services/apiClient';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'StoreTab'>,
  StackScreenProps<AppStackParamList>
>;

interface StoreItem {
  id: number;
  name: string;
  distance: string;
  duration: string;
  address: string;
  latitude: number;
  longitude: number;
}

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export function StoreScreen({ navigation }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [stores, setStores] = useState<StoreItem[]>([]);
  const [loading, setLoading] = useState(false);
  const isFocused = useIsFocused();

  const userLat = 17.4485;
  const userLng = 78.3741;

  useEffect(() => {
    if (!isFocused) return;
    const fetchStores = async () => {
      setLoading(true);
      try {
        const response = await apiClient.get<any[]>('/stores/nearby', {
          params: { lat: userLat, lng: userLng },
        });
        const mapped = response.data.map((store) => {
          const dist = calculateDistance(userLat, userLng, store.latitude, store.longitude);
          const distStr = `${dist.toFixed(1)} km`;
          const durationMin = Math.round(dist * 10 + 10);
          const durStr = `${durationMin}-${durationMin + 5} min`;
          return {
            id: store.id,
            name: store.name,
            address: store.address,
            distance: distStr,
            duration: durStr,
            latitude: store.latitude,
            longitude: store.longitude,
          };
        });
        setStores(mapped);
      } catch (err) {
        console.error('Failed to load nearby stores', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStores();
  }, [isFocused]);

  const filteredStores = stores.filter((store) =>
    store.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Hardware Stores</Text>
        <Text style={styles.headerSub}>Find nearest partner inventory stores</Text>
      </View>

      <View style={styles.searchSection}>
        <SearchBar
          placeholder="Search stores by name..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>Nearby Partner Stores</Text>

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : filteredStores.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No matching partner stores found.</Text>
          </View>
        ) : (
          filteredStores.map((store) => (
            <StoreCard
              key={store.id}
              id={store.id}
              name={store.name}
              distance={store.distance}
              duration={store.duration}
              onPress={() =>
                navigation.navigate('StoreDetails', {
                  storeId: store.id,
                  storeName: store.name,
                })
              }
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.layout,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  headerSub: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
    marginTop: 2,
  },
  searchSection: {
    paddingHorizontal: spacing.layout,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1.5,
    borderBottomColor: colors.border,
  },
  scrollContent: {
    padding: spacing.layout,
    paddingBottom: spacing.huge,
  },
  sectionTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.huge,
  },
  emptyText: {
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
  },
  centerContainer: {
    paddingVertical: spacing.huge,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
