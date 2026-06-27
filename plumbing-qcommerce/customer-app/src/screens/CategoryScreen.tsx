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

type Props = StackScreenProps<AppStackParamList, 'Categories'>;

interface CategoryItem {
  id: number;
  name: string;
  icon: string;
}

const categoriesData: CategoryItem[] = [
  { id: 1, name: 'Pipes', icon: '🪵' },
  { id: 2, name: 'Fittings', icon: '⚙️' },
  { id: 3, name: 'Taps', icon: '🚰' },
  { id: 4, name: 'Sanitaryware', icon: '🚽' },
  { id: 5, name: 'Water Tanks', icon: '🛢️' },
  { id: 6, name: 'Tools', icon: '🛠️' },
  { id: 7, name: 'Electrical', icon: '🔌' },
  { id: 8, name: 'All Categories', icon: '🗂️' },
];

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
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>←</Text>
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
                <Text style={styles.iconText}>{item.icon}</Text>
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
    width: 40,
    height: 40,
    borderRadius: 20,
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
