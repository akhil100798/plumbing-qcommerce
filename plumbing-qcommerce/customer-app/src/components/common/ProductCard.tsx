import React from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { Product } from "../../data/products";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";
import { spacing } from "../../theme/spacing";
import { StarIcon } from "../../assets/svg/Icons";

interface ProductCardProps {
  product: Product;
  onPress: () => void;
  onAdd: () => void;
  isAdded?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onPress,
  onAdd,
  isAdded = false,
}) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.imageWrapper}>
        <Image source={{ uri: product.imageUrl }} style={styles.image} />
        {product.badge && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{product.badge}</Text>
          </View>
        )}
      </View>

      <Text style={styles.brand}>{product.brand}</Text>
      <Text style={styles.name} numberOfLines={2}>
        {product.name}
      </Text>

      <View style={styles.ratingRow}>
        <StarIcon size={12} color={colors.star} />
        <Text style={styles.rating}>{product.rating}</Text>
        <Text style={styles.reviews}>({product.reviewsCount})</Text>
      </View>

      <View style={styles.bottomRow}>
        <View>
          <Text style={styles.price}>₹{product.price}</Text>
          <Text style={styles.originalPrice}>₹{product.originalPrice}</Text>
        </View>

        <TouchableOpacity
          style={[styles.addBtn, isAdded && styles.addedBtn]}
          onPress={onAdd}
          activeOpacity={0.8}
        >
          <Text style={[styles.addBtnText, isAdded && styles.addedBtnText]}>
            {isAdded ? "ADDED" : "ADD"}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: "48%",
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.sm,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.surfaceVariant,
    shadowColor: colors.onBackground,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  imageWrapper: {
    width: "100%",
    height: 120,
    borderRadius: 12,
    backgroundColor: colors.surfaceContainer,
    overflow: "hidden",
    position: "relative",
    marginBottom: spacing.xs,
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  badge: {
    position: "absolute",
    top: 6,
    left: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: "700",
    color: colors.onPrimary,
  },
  brand: {
    ...typography.label,
    color: colors.primary,
    fontSize: 10,
    marginBottom: 2,
  },
  name: {
    ...typography.body2,
    fontWeight: "600",
    color: colors.onBackground,
    height: 38,
    lineHeight: 18,
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  rating: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.onBackground,
    marginLeft: 3,
  },
  reviews: {
    fontSize: 10,
    color: colors.secondary,
    marginLeft: 2,
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 4,
  },
  price: {
    ...typography.h4,
    fontWeight: "700",
    color: colors.onBackground,
  },
  originalPrice: {
    fontSize: 11,
    color: colors.secondary,
    textDecorationLine: "line-through",
  },
  addBtn: {
    borderWidth: 1.5,
    borderColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: colors.surface,
  },
  addedBtn: {
    backgroundColor: colors.primary,
  },
  addBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.primary,
  },
  addedBtnText: {
    color: colors.onPrimary,
  },
});