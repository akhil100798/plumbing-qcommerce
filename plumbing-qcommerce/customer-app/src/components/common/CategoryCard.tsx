import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Category } from "../../data/categories";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";
import { spacing } from "../../theme/spacing";
import {
  CategoryPipesIcon,
  CategoryFaucetsIcon,
  CategorySanitaryIcon,
  CategoryValvesIcon,
  CategoryTanksIcon,
  CategoryDrainageIcon,
  CategoryGeysersIcon,
  WrenchIcon,
} from "../../assets/svg/Icons";

interface CategoryCardProps {
  category: Category;
  onPress: () => void;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({ category, onPress }) => {
  const renderCategoryIcon = () => {
    switch (category.iconName) {
      case "piping":
        return <CategoryPipesIcon size={24} color={colors.primary} />;
      case "faucet":
        return <CategoryFaucetsIcon size={24} color={colors.primary} />;
      case "bath":
        return <CategorySanitaryIcon size={24} color={colors.primary} />;
      case "valve":
        return <CategoryValvesIcon size={24} color={colors.primary} />;
      case "tank":
        return <CategoryTanksIcon size={24} color={colors.primary} />;
      case "drain":
        return <CategoryDrainageIcon size={24} color={colors.primary} />;
      case "flame":
        return <CategoryGeysersIcon size={24} color={colors.primary} />;
      default:
        return <WrenchIcon size={24} color={colors.primary} />;
    }
  };

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.surface }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.iconContainer, { backgroundColor: category.color }]}>
        {renderCategoryIcon()}
      </View>
      <Text style={styles.name} numberOfLines={2}>
        {category.name}
      </Text>
      <Text style={styles.count}>{category.itemCount}+ Items</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: "23%",
    alignItems: "center",
    marginBottom: spacing.md,
    borderRadius: 14,
    paddingVertical: spacing.sm,
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: colors.surfaceVariant,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  name: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    fontWeight: "600",
    color: colors.onBackground,
    textAlign: "center",
    lineHeight: 14,
    minHeight: 28,
  },
  count: {
    fontSize: 10,
    color: colors.secondary,
    marginTop: 2,
  },
});
