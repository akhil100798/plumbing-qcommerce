import { StackScreenProps } from '@react-navigation/stack';
import React from 'react';
import {
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { CategoryCard } from '../components/cards/CategoryCard';
import { colors, spacing, typography } from '../theme';
import { AppStackParamList } from '../types/navigation';
import {
  SvgNavigationArrowLeft,
  SvgCategoriesPipesFittings,
  SvgPlumbingCpvcElbow,
  SvgCategoriesTapsFaucets,
  SvgCategoriesBathroomFixtures,
  SvgCategoriesWaterTanks,
  SvgCategoriesToolsHardware,
  SvgStatusLightning,
  SvgPlumbingPlumbingTools,
} from '../assets/svg';

type Props = StackScreenProps<AppStackParamList, 'Categories'>;

interface CategoryItem {
  id: number;
  name: string;
}

const categoriesData: CategoryItem[] = [
  { id: 1, name: 'Pipes' },
  { id: 2, name: 'Fittings' },
  { id: 3, name: 'Taps' },
  { id: 4, name: 'Sanitaryware' },
  { id: 5, name: 'Water Tanks' },
  { id: 6, name: 'Tools' },
  { id: 7, name: 'Electrical' },
  { id: 8, name: 'All Categories' },
];

const renderCategoryIcon = (id: number) => {
  switch (id) {
    case 1:
      return <SvgCategoriesPipesFittings width={28} height={28} stroke={colors.primary} />;
    case 2:
      return <SvgPlumbingCpvcElbow width={28} height={28} stroke={colors.primary} />;
    case 3:
      return <SvgCategoriesTapsFaucets width={28} height={28} stroke={colors.primary} />;
    case 4:
      return <SvgCategoriesBathroomFixtures width={28} height={28} stroke={colors.primary} />;
    case 5:
      return <SvgCategoriesWaterTanks width={28} height={28} stroke={colors.primary} />;
    case 6:
      return <SvgCategoriesToolsHardware width={28} height={28} stroke={colors.primary} />;
    case 7:
      return <SvgStatusLightning width={28} height={28} stroke={colors.primary} />;
    default:
      return <SvgPlumbingPlumbingTools width={28} height={28} stroke={colors.primary} />;
  }
};

export function CategoryScreen({ navigation }: Props) {
  const handleCategoryPress = (category: CategoryItem) => {
    navigation.navigate('ProductListing', {
      categoryId: category.id,
      categoryName: category.name,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <SvgNavigationArrowLeft width={20} height={20} stroke={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Categories</Text>
      </View>

      <FlatList
        data={categoriesData}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.gridItemWrapper}>
            <TouchableOpacity
              style={styles.cardContainer}
              onPress={() => handleCategoryPress(item)}
              activeOpacity={0.7}
            >
              <View style={styles.iconWrapper}>
                {renderCategoryIcon(item.id)}
              </View>
              <Text style={styles.categoryName}>{item.name}</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.layout,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  backButton: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  backButtonText: {
    fontSize: 22,
    color: colors.textPrimary,
    fontWeight: 'bold',
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  listContent: {
    padding: spacing.md,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  gridItemWrapper: {
    flex: 1,
    marginHorizontal: spacing.xs,
  },
  cardContainer: {
    backgroundColor: colors.surface,
    borderRadius: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingVertical: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  iconText: {
    fontSize: 32,
  },
  categoryName: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    textAlign: 'center',
  },
});
