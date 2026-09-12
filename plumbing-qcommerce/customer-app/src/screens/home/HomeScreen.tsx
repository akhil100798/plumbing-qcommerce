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
import { FixKartHeader } from '../../components/common/FixKartHeader';
import { SearchBar } from '../../components/common/SearchBar';
import { CategoryCard } from '../../components/common/CategoryCard';
import { ServiceCard } from '../../components/common/ServiceCard';
import { ProductCard } from '../../components/common/ProductCard';
import { Category } from '../../data/categories';
import { PlumbingService } from '../../data/services';
import { Product } from '../../data/products';
import { CatalogService } from '../../services/catalogService';
import { useCart } from '../../services/cartService';
import { useOrders } from '../../services/orderService';
import {
  WrenchIcon,
  ShieldCheckIcon,
  ChevronRightIcon,
  ClockIcon,
} from '../../assets/svg/Icons';

interface HomeScreenProps {
  onNavigateToSearch: () => void;
  onNavigateToCategory: (categoryName: string) => void;
  onNavigateToServiceDetail: (serviceId: string) => void;
  onNavigateToProductDetail: (productId: string) => void;
  onNavigateToTracking: (orderId: string) => void;
  onNavigateToPlus: () => void;
  onNavigateToNotifications: () => void;
  onNavigateToSavedAddresses: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onNavigateToSearch,
  onNavigateToCategory,
  onNavigateToServiceDetail,
  onNavigateToProductDetail,
  onNavigateToTracking,
  onNavigateToPlus,
  onNavigateToNotifications,
  onNavigateToSavedAddresses,
}) => {
  const { addItem, items: cartItems } = useCart();
  const { activeOrder } = useOrders();
  const [categoriesList, setCategoriesList] = useState<Category[]>([]);
  const [servicesList, setServicesList] = useState<PlumbingService[]>([]);
  const [productsList, setProductsList] = useState<Product[]>([]);

  useEffect(() => {
    let isMounted = true;
    async function loadCatalog() {
      try {
        const [cats, srvs, prods] = await Promise.all([
          CatalogService.getCategories(),
          CatalogService.getServices(),
          CatalogService.getProducts(),
        ]);
        if (isMounted) {
          setCategoriesList(cats);
          setServicesList(srvs);
          setProductsList(prods);
        }
      } catch (e) {
        console.warn('Failed to fetch home catalog:', e);
      }
    }
    loadCatalog();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <View style={styles.container}>
      <FixKartHeader
        onLocationPress={onNavigateToSavedAddresses}
        onNotificationPress={onNavigateToNotifications}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Bar Trigger */}
        <View style={styles.searchContainer}>
          <SearchBar editable={false} onPress={onNavigateToSearch} />
        </View>

        {/* Active Order Banner if live */}
        {activeOrder && (
          <TouchableOpacity
            style={styles.activeOrderCard}
            onPress={() => onNavigateToTracking(activeOrder.id)}
            activeOpacity={0.9}
            accessibilityRole="button"
            accessibilityLabel={`Track live service order #${activeOrder.orderNumber}`}
          >
            <View style={styles.activeOrderLeft}>
              <View style={styles.liveBadge}>
                <View style={styles.pulsingDot} />
                <Text style={styles.liveBadgeText}>LIVE SERVICE</Text>
              </View>
              <Text style={styles.activeOrderTitle}>
                {activeOrder.items[0]?.title || 'Plumbing Service'}
              </Text>
              <Text style={styles.activeOrderStatus}>
                {activeOrder.statusLabel} • {activeOrder.orderNumber}
              </Text>
            </View>
            <View style={styles.activeOrderRight}>
              <Text style={styles.trackBtnText}>Track Plumber</Text>
              <ChevronRightIcon size={16} color={colors.primary} />
            </View>
          </TouchableOpacity>
        )}

        {/* Emergency Plumbing Hero Banner */}
        <View style={styles.heroBanner}>
          <View style={styles.heroLeft}>
            <View style={styles.heroBadge}>
              <ClockIcon size={12} color={colors.onPrimary} />
              <Text style={styles.heroBadgeText}>EXPRESS 30 MINS</Text>
            </View>
            <Text style={styles.heroTitle}>Water Leakage or Pipe Burst?</Text>
            <Text style={styles.heroSubtitle}>
              Get a certified master plumber at your doorstep in under 30 minutes.
            </Text>
            <TouchableOpacity
              style={styles.heroActionBtn}
              onPress={() => onNavigateToServiceDetail('srv_2')}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Book Emergency Plumber"
            >
              <Text style={styles.heroActionText}>Book Emergency Plumber</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.heroRight}>
            <WrenchIcon size={64} color="#ffffff" />
          </View>
        </View>

        {/* Quick Categories Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Plumbing Categories</Text>
            <TouchableOpacity onPress={onNavigateToSearch} accessibilityRole="button">
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.categoryGrid}>
            {categoriesList.map((cat) => (
              <CategoryCard
                key={cat.id}
                category={cat}
                onPress={() => onNavigateToCategory(cat.name)}
              />
            ))}
          </View>
        </View>

        {/* FixKart Plus Promo Banner */}
        <TouchableOpacity
          style={styles.plusCard}
          onPress={onNavigateToPlus}
          activeOpacity={0.9}
          accessibilityRole="button"
          accessibilityLabel="Explore FixKart Plus"
        >
          <View style={styles.plusContent}>
            <View style={styles.plusTag}>
              <Text style={styles.plusTagText}>FIXKART PLUS</Text>
            </View>
            <Text style={styles.plusTitle}>Save up to ₹2,400 / Year on Home Repairs</Text>
            <Text style={styles.plusDesc}>
              Free visiting fees • 15% off genuine spare parts • Priority plumber dispatch
            </Text>
          </View>
          <View style={styles.plusAction}>
            <Text style={styles.plusJoinText}>Explore</Text>
            <ChevronRightIcon size={16} color={colors.onPrimary} />
          </View>
        </TouchableOpacity>

        {/* Popular Services Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Most Booked Services</Text>
            <TouchableOpacity onPress={onNavigateToSearch} accessibilityRole="button">
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {servicesList.slice(0, 4).map((service) => {
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

        {/* Genuine Plumbing Products E-Commerce Store */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Plumbing Spares & Fittings</Text>
            <TouchableOpacity onPress={onNavigateToSearch} accessibilityRole="button">
              <Text style={styles.viewAllText}>Store</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.productsGrid}>
            {productsList.map((product) => {
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

        {/* FixKart Assurance Banner */}
        <View style={styles.assuranceCard}>
          <View style={styles.assuranceHeader}>
            <ShieldCheckIcon size={24} color={colors.primary} />
            <Text style={styles.assuranceTitle}>The FixKart Promise</Text>
          </View>
          <View style={styles.assuranceGrid}>
            <View style={styles.assuranceItem}>
              <Text style={styles.assuranceNumber}>30 Min</Text>
              <Text style={styles.assuranceLabel}>Average Arrival Time</Text>
            </View>
            <View style={styles.assuranceItem}>
              <Text style={styles.assuranceNumber}>60 Days</Text>
              <Text style={styles.assuranceLabel}>Service Warranty</Text>
            </View>
            <View style={styles.assuranceItem}>
              <Text style={styles.assuranceNumber}>100%</Text>
              <Text style={styles.assuranceLabel}>Verified Background</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.section,
  },
  searchContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  activeOrderCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    backgroundColor: colors.primaryFixed,
    borderRadius: 16,
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  activeOrderLeft: {
    flex: 1,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  pulsingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ffffff',
    marginRight: 4,
  },
  liveBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  activeOrderTitle: {
    fontFamily: typography.h4.fontFamily,
    fontSize: 16,
    fontWeight: '600',
    color: colors.onBackground,
  },
  activeOrderStatus: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  activeOrderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  trackBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    marginRight: 4,
  },
  heroBanner: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: 20,
    padding: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  heroLeft: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  heroBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.onPrimary,
    marginLeft: 4,
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontFamily: typography.h3.fontFamily,
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
    color: colors.onPrimary,
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 16,
    marginBottom: spacing.md,
  },
  heroActionBtn: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  heroActionText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
  },
  heroRight: {
    opacity: 0.25,
  },
  section: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontFamily: typography.h3.fontFamily,
    fontSize: 18,
    fontWeight: '600',
    color: colors.onBackground,
  },
  viewAllText: {
    fontFamily: typography.button.fontFamily,
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  plusCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    backgroundColor: colors.inverseSurface,
    borderRadius: 18,
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  plusContent: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  plusTag: {
    backgroundColor: colors.primaryContainer,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  plusTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  plusTitle: {
    fontFamily: typography.h4.fontFamily,
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  plusDesc: {
    fontSize: 11,
    color: colors.inverseOnSurface,
    opacity: 0.8,
    lineHeight: 15,
  },
  plusAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  plusJoinText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.onPrimary,
    marginRight: 4,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  assuranceCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.surfaceVariant,
  },
  assuranceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  assuranceTitle: {
    fontFamily: typography.h3.fontFamily,
    fontSize: 18,
    fontWeight: '600',
    color: colors.onBackground,
    marginLeft: 8,
  },
  assuranceGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  assuranceItem: {
    alignItems: 'center',
    flex: 1,
  },
  assuranceNumber: {
    fontFamily: typography.h3.fontFamily,
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 2,
  },
  assuranceLabel: {
    fontSize: 11,
    color: colors.secondary,
    textAlign: 'center',
  },
});
