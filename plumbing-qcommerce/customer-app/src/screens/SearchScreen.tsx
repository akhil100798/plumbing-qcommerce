import { StackScreenProps } from '@react-navigation/stack';
import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { SearchBar } from '../components/common/SearchBar';
import { colors, spacing, typography } from '../theme';
import { AppStackParamList } from '../types/navigation';

type Props = StackScreenProps<AppStackParamList, 'Search'>;

const recentSearches = ['PVC Pipe', 'CPVC Elbow', 'Tap'];
const popularSearches = [
  'Water Tank',
  'Basin Mixer',
  'Flush Tank',
  'Ball Valve',
  'Wrench',
  'GI Pipe',
];
const trendingNow = ['Ashirvad CPVC Pipe', 'Jaquar Basin', 'Hindware Toilet Seat'];

import { useDispatch, useSelector } from 'react-redux';
import { addToCart, removeFromCart } from '../redux/slices/cartSlice';
import { RootState } from '../redux/store';
import { ProductCard } from '../components/cards/ProductCard';
import { apiClient } from '../services/apiClient';
import { ActivityIndicator } from 'react-native';

export function SearchScreen({ navigation }: Props) {
  const dispatch = useDispatch();
  const cartItems = useSelector((state: RootState) => state.cart.items);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await apiClient.get<any[]>('/catalog/search', {
          params: { q: query },
        });
        setResults(response.data);
      } catch (err) {
        console.error('Failed to search products', err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  const handleSelectSearch = (term: string) => {
    setQuery(term);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.searchBarContainer}>
          <SearchBar
            placeholder="Search for pipes, taps, fittings..."
            value={query}
            onChangeText={setQuery}
          />
        </View>
      </View>

      {query.trim().length > 0 ? (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {loading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : results.length === 0 ? (
            <View style={styles.centerContainer}>
              <Text style={styles.emptyText}>No products found matching "{query}"</Text>
            </View>
          ) : (
            results.map((product) => {
              const qty = cartItems[product.id] || 0;
              return (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  name={product.name}
                  price={product.price}
                  categoryName={product.categoryName || 'General'}
                  quantityInCart={qty}
                  onAdd={() => dispatch(addToCart(product.id))}
                  onRemove={() => dispatch(removeFromCart(product.id))}
                  onPress={() => navigation.navigate('ProductDetails', { productId: product.id })}
                />
              );
            })
          )}
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Searches</Text>
            <View style={styles.chipRow}>
              {recentSearches.map((item, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.chip}
                  onPress={() => handleSelectSearch(item)}
                >
                  <Text style={styles.chipText}>{item}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Popular Searches</Text>
            <View style={styles.chipRow}>
              {popularSearches.map((item, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.chip}
                  onPress={() => handleSelectSearch(item)}
                >
                  <Text style={styles.chipText}>{item}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Trending Now</Text>
            <View style={styles.trendingList}>
              {trendingNow.map((item, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.trendingItem}
                  onPress={() => handleSelectSearch(item)}
                >
                  <Text style={styles.trendingIcon}>📈</Text>
                  <Text style={styles.trendingText}>{item}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background || '#F8F9FF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.layout,
    paddingVertical: spacing.md,
    backgroundColor: colors.surfaceContainerLowest || '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.border || '#C1C6D6',
    gap: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLowest || '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border || '#C1C6D6',
  },
  backButtonText: {
    fontSize: 20,
    color: colors.textPrimary,
    fontWeight: 'bold',
  },
  searchBarContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.layout,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.heading,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    backgroundColor: colors.surfaceContainerLowest || '#FFFFFF',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: colors.border || '#C1C6D6',
  },
  chipText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.body,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
  },
  trendingList: {
    backgroundColor: colors.surfaceContainerLowest || '#FFFFFF',
    borderRadius: spacing.md,
    borderWidth: 1,
    borderColor: colors.border || '#C1C6D6',
    overflow: 'hidden',
  },
  trendingItem: {
    flexDirection: 'row',
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border || '#C1C6D6',
  },
  trendingIcon: {
    fontSize: 18,
  },
  trendingText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.body,
    color: colors.textPrimary,
  },
  centerContainer: {
    paddingVertical: spacing.huge,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.body,
    color: colors.textMuted,
  },
});
