import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { PlumbingService, services as fallbackServices } from '../../data/services';
import { CatalogService } from '../../services/catalogService';
import { useCart } from '../../services/cartService';
import {
  ChevronLeftIcon,
  StarIcon,
  ClockIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
} from '../../assets/svg/Icons';

interface ServiceDetailScreenProps {
  serviceId: string;
  onBack: () => void;
  onNavigateToCart: () => void;
}

export const ServiceDetailScreen: React.FC<ServiceDetailScreenProps> = ({
  serviceId,
  onBack,
  onNavigateToCart,
}) => {
  const [service, setService] = useState<PlumbingService>(
    fallbackServices.find((s) => s.id === serviceId) || fallbackServices[0]
  );
  const { addItem, items } = useCart();
  const [selectedSlot, setSelectedSlot] = useState('Today, 11:30 AM');

  useEffect(() => {
    let isMounted = true;
    CatalogService.getServiceById(serviceId).then((res) => {
      if (res && isMounted) {
        setService(res);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [serviceId]);

  const isAdded = items.some((i) => i.id === service.id);

  const slots = [
    'Today, 11:30 AM',
    'Today, 02:00 PM',
    'Today, 04:30 PM',
    'Tomorrow, 10:00 AM',
  ];

  const handleBook = () => {
    if (!isAdded) {
      addItem(service, 'service');
    }
    onNavigateToCart();
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7} accessibilityLabel="Back button">
          <ChevronLeftIcon size={22} color={colors.onBackground} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {service.title}
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Service Hero Image */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: service.imageUrl }} style={styles.serviceImage} />
          {service.badge && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{service.badge}</Text>
            </View>
          )}
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.category}>{service.category}</Text>
          <Text style={styles.title}>{service.title}</Text>

          <View style={styles.metaRow}>
            <View style={styles.ratingBox}>
              <StarIcon size={14} fill={colors.star} />
              <Text style={styles.ratingScore}>{service.rating}</Text>
            </View>
            <Text style={styles.reviewsCount}>({service.reviewsCount} reviews)</Text>
            <View style={styles.durationBadge}>
              <ClockIcon size={12} color={colors.primary} />
              <Text style={styles.durationText}>{service.durationMinutes} Mins</Text>
            </View>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.price}>₹{service.price}</Text>
            <Text style={styles.originalPrice}>₹{service.originalPrice}</Text>
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>
                {Math.round(((service.originalPrice - service.price) / service.originalPrice) * 100)}% OFF
              </Text>
            </View>
          </View>
          <Text style={styles.visitingFeeNote}>+ ₹49 Standard Visiting / Inspection Fee</Text>
        </View>

        {/* Arrival Slot Selector */}
        <View style={styles.slotCard}>
          <Text style={styles.slotCardTitle}>Select Plumber Arrival Time</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.slotScroll}>
            {slots.map((slot, idx) => {
              const isSelected = selectedSlot === slot;
              return (
                <TouchableOpacity
                  key={idx}
                  style={[styles.slotChip, isSelected && styles.selectedSlotChip]}
                  onPress={() => setSelectedSlot(slot)}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                >
                  <Text style={[styles.slotText, isSelected && styles.selectedSlotText]}>
                    {slot}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Included Tasks */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>What’s Included</Text>
          {service.includedTasks.map((task, idx) => (
            <View key={idx} style={styles.taskRow}>
              <CheckCircleIcon size={16} color={colors.success} />
              <Text style={styles.taskText}>{task}</Text>
            </View>
          ))}
        </View>

        {/* Excluded Tasks */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>What’s Not Included</Text>
          {service.excludedTasks.map((task, idx) => (
            <View key={idx} style={styles.taskRow}>
              <Text style={styles.excludedCross}>✕</Text>
              <Text style={styles.excludedTaskText}>{task}</Text>
            </View>
          ))}
        </View>

        {/* FixKart Guarantee Banner */}
        <View style={styles.guaranteeCard}>
          <ShieldCheckIcon size={22} color={colors.primary} />
          <View style={styles.guaranteeTextCol}>
            <Text style={styles.guaranteeTitle}>FixKart 60-Day Service Guarantee</Text>
            <Text style={styles.guaranteeDesc}>
              Free rework if any leakage recurrence within 60 days of service.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Booking Bar */}
      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.bottomPriceLabel}>Total Service Cost</Text>
          <Text style={styles.bottomPrice}>₹{service.price + 49}</Text>
        </View>

        <TouchableOpacity style={styles.bookBtn} onPress={handleBook} activeOpacity={0.8} accessibilityRole="button">
          <Text style={styles.bookBtnText}>{isAdded ? 'Go to Cart' : 'Book Plumber'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceVariant,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  headerTitle: {
    fontFamily: typography.h4.fontFamily,
    fontSize: 16,
    fontWeight: '600',
    color: colors.onBackground,
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  imageContainer: {
    height: 220,
    backgroundColor: colors.surface,
    position: 'relative',
  },
  serviceImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  badge: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.lg,
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.onPrimary,
  },
  infoCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceVariant,
  },
  category: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  title: {
    fontFamily: typography.h2.fontFamily,
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
    color: colors.onBackground,
    marginBottom: spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceVariant,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: 6,
  },
  ratingScore: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.onBackground,
    marginLeft: 3,
  },
  reviewsCount: {
    fontSize: 11,
    color: colors.secondary,
    marginRight: 10,
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryFixed,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  durationText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    marginLeft: 3,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  price: {
    fontFamily: typography.h2.fontFamily,
    fontSize: 22,
    fontWeight: '700',
    color: colors.onBackground,
    marginRight: spacing.sm,
  },
  originalPrice: {
    fontFamily: typography.body2.fontFamily,
    fontSize: 14,
    color: colors.secondary,
    textDecorationLine: 'line-through',
    marginRight: spacing.sm,
  },
  discountBadge: {
    backgroundColor: colors.primaryFixed,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
  },
  visitingFeeNote: {
    fontSize: 11,
    color: colors.secondary,
    marginTop: 2,
  },
  slotCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    marginTop: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceVariant,
  },
  slotCardTitle: {
    fontFamily: typography.h4.fontFamily,
    fontSize: 16,
    fontWeight: '600',
    color: colors.onBackground,
    marginBottom: spacing.sm,
  },
  slotScroll: {
    flexDirection: 'row',
  },
  slotChip: {
    backgroundColor: colors.background,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.surfaceVariant,
  },
  selectedSlotChip: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  slotText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.onBackground,
  },
  selectedSlotText: {
    color: colors.onPrimary,
    fontWeight: '700',
  },
  sectionCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    marginTop: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceVariant,
  },
  sectionHeading: {
    fontFamily: typography.h4.fontFamily,
    fontSize: 16,
    fontWeight: '600',
    color: colors.onBackground,
    marginBottom: spacing.sm,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  taskText: {
    fontFamily: typography.body2.fontFamily,
    fontSize: 14,
    color: colors.onBackground,
    marginLeft: spacing.sm,
    flex: 1,
  },
  excludedCross: {
    color: colors.error,
    fontSize: 12,
    fontWeight: '800',
    marginRight: spacing.sm,
  },
  excludedTaskText: {
    fontFamily: typography.body2.fontFamily,
    fontSize: 14,
    color: colors.secondary,
    flex: 1,
  },
  guaranteeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryFixed,
    margin: spacing.lg,
    padding: spacing.md,
    borderRadius: 14,
  },
  guaranteeTextCol: {
    marginLeft: spacing.sm,
    flex: 1,
  },
  guaranteeTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  guaranteeDesc: {
    fontSize: 10,
    color: colors.onSurfaceVariant,
    marginTop: 1,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceVariant,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bottomPriceLabel: {
    fontSize: 10,
    color: colors.secondary,
    textTransform: 'uppercase',
  },
  bottomPrice: {
    fontFamily: typography.h2.fontFamily,
    fontSize: 22,
    fontWeight: '700',
    color: colors.onBackground,
  },
  bookBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 12,
  },
  bookBtnText: {
    fontFamily: typography.button.fontFamily,
    fontSize: 15,
    fontWeight: '600',
    color: colors.onPrimary,
  },
});
