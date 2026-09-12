import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { SearchBar } from '../../components/common/SearchBar';
import { ServiceCard } from '../../components/common/ServiceCard';
import { ProductCard } from '../../components/common/ProductCard';
import { CatalogService } from '../../services/catalogService';
import { PlumbingService } from '../../data/services';
import { Product } from '../../data/products';
import { useCart } from '../../services/cartService';
import { ChevronLeftIcon, WrenchIcon } from '../../assets/svg/Icons';

interface SearchScreenProps {
  onBack: () => void;
  onNavigateToServiceDetail: (serviceId: string) => void;
  onNavigateToProductDetail: (productId: string) => void;
  initialQuery?: string;
}

export const SearchScreen: React.FC<SearchScreenProps> = ({
  onBack,
  onNavigateToServiceDetail,
  onNavigateToProductDetail,
  initialQuery = '',
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'services' | 'products'>('all');
  const [matchedServices, setMatchedServices] = useState<PlumbingService[]>([]);
  const [matchedProducts, setMatchedProducts] = useState<Product[]>([]);
  const { addItem, items: cartItems } = useCart();

  const recentSearches = ['Tap repair', 'CPVC pipes', 'Western toilet', 'Geyser service', 'Brass valve'];
  const filters = [
    { id: 'all', label: 'All Items' },
    { id: 'services', label: 'Plumbing Services' },
    { id: 'products', label: 'Genuine Spares' },
  ];

  useEffect(() => {
    let isMounted = true;
    async function performSearch() {
      if (!query.trim()) {
        const [srvs, prods] = await Promise.all([
          CatalogService.getServices(),
          CatalogService.getProducts(),
        ]);
        if (isMounted) {
          setMatchedServices(srvs);
          setMatchedProducts(prods);
        }
      } else {
        const res = await CatalogService.searchCatalog(query);
        if (isMounted) {
          setMatchedServices(res.services);
          setMatchedProducts(res.products);
        }
      }
    }
    performSearch();
    return () => {
      isMounted = false;
    };
  }, [query]);

  const showServices = selectedFilter === 'all' || selectedFilter === 'services';
  const showProducts = selectedFilter === 'all' || selectedFilter === 'products';

  const totalResults =
    (showServices ? matchedServices.length : 0) +
    (showProducts ? matchedProducts.length : 0);

  return (
    <View style={styles.container}>
      {/* Search Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7} accessibilityLabel="Back button">
          <ChevronLeftIcon size={24} color={colors.onBackground} />
        </TouchableOpacity>
        <View style={styles.searchBarWrapper}>
          <SearchBar
            value={query}
            onChangeText={setQuery}
            onClear={() => setQuery('')}
            placeholder="Search plumber services, pipes, taps..."
            autoFocus={true}
          />
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {filters.map((f) => {
          const isActive = selectedFilter === f.id;
          return (
            <TouchableOpacity
              key={f.id}
              style={[styles.filterChip, isActive && styles.activeFilterChip]}
              onPress={() => setSelectedFilter(f.id as any)}
              activeOpacity={0.8}
              accessibilityRole="button"
            >
              <Text style={[styles.filterText, isActive && styles.activeFilterText]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Recent Search Suggestions if empty query */}
        {!query && (
          <View style={styles.recentSection}>
            <Text style={styles.recentTitle}>POPULAR SEARCHES</Text>
            <View style={styles.tagsContainer}>
              {recentSearches.map((term, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.recentTag}
                  onPress={() => setQuery(term)}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                >
                  <Text style={styles.tagText}>{term}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {totalResults === 0 ? (
          <View style={styles.emptyContainer}>
            <WrenchIcon size={48} color={colors.outline} />
            <Text style={styles.emptyTitle}>No results for "{query}"</Text>
            <Text style={styles.emptySubtitle}>
              Try searching with general keywords like "tap", "leakage", "pipes", or "geyser".
            </Text>
          </View>
        ) : (
          <>
            {/* Matched Services */}
            {showServices && matchedServices.length > 0 && (
              <View style={styles.resultsSection}>
                <Text style={styles.sectionHeading}>
                  Plumbing Services ({matchedServices.length})
                </Text>
                {matchedServices.map((service) => {
                  const isAdded = cartItems.some((i) => i.id === service.id);
                  return (
                    <ServiceCard
                      key={service.id}
                      service={service}
                      isAdded={isAdded}
                      onPress={() => onNavigateToServiceDetail(service.id)}
                      onBook={() => addItem(service, 'service')}
                    />
                  );
                })}
              </View>
            )}

            {/* Matched Products */}
            {showProducts && matchedProducts.length > 0 && (
              <View style={styles.resultsSection}>
                <Text style={styles.sectionHeading}>
                  Genuine Spare Parts ({matchedProducts.length})
                </Text>
                <View style={styles.productsGrid}>
                  {matchedProducts.map((product) => {
                    const isAdded = cartItems.some((i) => i.id === product.id);
                    return (
                      <ProductCard
                        key={product.id}
                        product={product}
                        isAdded={isAdded}
                        onPress={() => onNavigateToProductDetail(product.id)}
                        onAdd={() => addItem(product, 'product')}
                      />
                    );
                  })}
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.surface,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  searchBarWrapper: {
    flex: 1,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceVariant,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: colors.background,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.surfaceVariant,
  },
  activeFilterChip: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.secondary,
  },
  activeFilterText: {
    color: colors.onPrimary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 90,
  },
  recentSection: {
    marginBottom: spacing.lg,
  },
  recentTitle: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    fontWeight: '700',
    color: colors.secondary,
    marginBottom: spacing.sm,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  recentTag: {
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.surfaceVariant,
  },
  tagText: {
    fontSize: 12,
    color: colors.onBackground,
  },
  resultsSection: {
    marginBottom: spacing.lg,
  },
  sectionHeading: {
    fontFamily: typography.h4.fontFamily,
    fontSize: 16,
    fontWeight: '600',
    color: colors.onBackground,
    marginBottom: spacing.sm,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontFamily: typography.h3.fontFamily,
    fontSize: 18,
    fontWeight: '600',
    color: colors.onBackground,
    marginTop: spacing.md,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontFamily: typography.body2.fontFamily,
    fontSize: 14,
    fontWeight: '400',
    color: colors.secondary,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
});
