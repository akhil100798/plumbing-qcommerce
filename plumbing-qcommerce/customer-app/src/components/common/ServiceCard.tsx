import React from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { PlumbingService } from "../../data/services";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";
import { spacing } from "../../theme/spacing";
import { StarIcon, ClockIcon, ShieldCheckIcon } from "../../assets/svg/Icons";

interface ServiceCardProps {
  service: PlumbingService;
  onPress: () => void;
  onBook: () => void;
  isAdded?: boolean;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({
  service,
  onPress,
  onBook,
  isAdded = false,
}) => {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={styles.contentRow}>
        <View style={styles.infoCol}>
          {service.badge && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{service.badge.toUpperCase()}</Text>
            </View>
          )}

          <Text style={styles.title} numberOfLines={2}>
            {service.title}
          </Text>

          <View style={styles.ratingRow}>
            <View style={styles.ratingBox}>
              <StarIcon size={12} fill={colors.star} />
              <Text style={styles.ratingText}>{service.rating.toFixed(1)}</Text>
            </View>
            <Text style={styles.reviewsText}>({service.reviewsCount})</Text>
            <View style={styles.dot} />
            <View style={styles.timeRow}>
              <ClockIcon size={12} color={colors.secondary} />
              <Text style={styles.timeText}>{service.durationMinutes} mins</Text>
            </View>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.price}>₹{service.price}</Text>
            <Text style={styles.originalPrice}>₹{service.originalPrice}</Text>
            <Text style={styles.savePercent}>
              {Math.round(((service.originalPrice - service.price) / service.originalPrice) * 100)}% OFF
            </Text>
          </View>

          <View style={styles.guaranteeRow}>
            <ShieldCheckIcon size={14} color={colors.primary} />
            <Text style={styles.guaranteeText}>FixKart 60-Day Warranty</Text>
          </View>
        </View>

        <View style={styles.imageCol}>
          <Image source={{ uri: service.imageUrl }} style={styles.image} />
          <TouchableOpacity
            style={[styles.bookBtn, isAdded && styles.addedBtn]}
            onPress={onBook}
            activeOpacity={0.8}
          >
            <Text style={[styles.bookBtnText, isAdded && styles.addedBtnText]}>
              {isAdded ? "ADDED ✓" : "ADD +"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.surfaceVariant,
    shadowColor: colors.onBackground,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  contentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  infoCol: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: colors.primaryFixed,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.primary,
    letterSpacing: 0.4,
  },
  title: {
    fontFamily: typography.h4.fontFamily,
    fontSize: 16,
    fontWeight: "600",
    color: colors.onBackground,
    marginBottom: 6,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  ratingBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.warningContainer,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: 4,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.onBackground,
    marginLeft: 3,
  },
  reviewsText: {
    fontSize: 11,
    color: colors.secondary,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.outline,
    marginHorizontal: 6,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  timeText: {
    fontSize: 11,
    color: colors.secondary,
    marginLeft: 3,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 6,
  },
  price: {
    fontFamily: typography.h3.fontFamily,
    fontSize: 18,
    fontWeight: "600",
    color: colors.onBackground,
    marginRight: 6,
  },
  originalPrice: {
    fontSize: 13,
    color: colors.secondary,
    textDecorationLine: "line-through",
    marginRight: 6,
  },
  savePercent: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.success,
  },
  guaranteeRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  guaranteeText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: "600",
    marginLeft: 4,
  },
  imageCol: {
    width: 105,
    alignItems: "center",
  },
  image: {
    width: 105,
    height: 100,
    borderRadius: 12,
    backgroundColor: colors.surfaceContainer,
  },
  bookBtn: {
    marginTop: -16,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 10,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  addedBtn: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  bookBtnText: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.primary,
  },
  addedBtnText: {
    color: colors.onPrimary,
  },
});
