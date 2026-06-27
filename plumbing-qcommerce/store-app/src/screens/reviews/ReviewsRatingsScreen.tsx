import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, FlatList, Alert } from 'react-native';
import { colors, borderRadius, spacing, typography, shadows } from '../../theme';
import { ScreenWrapper } from '../../components/common/ScreenWrapper';
import { AppHeader } from '../../components/common/AppHeader';
import { ReviewCard } from '../../components/cards/WalletReviewsPromoCards';
import { mockReviews } from '../../mocks';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { AppStackParamList } from '../../types/navigation';
import { Review } from '../../types';

export const ReviewsRatingsScreen = () => {
  const navigation = useNavigation<NavigationProp<AppStackParamList>>();
  
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);

  const loadReviews = async () => {
    setLoading(true);
    try {
      // Simulate API fetch delay
      await new Promise(resolve => setTimeout(resolve, 500));
      setReviews(mockReviews);
    } catch (e) {
      Alert.alert('Error', 'Failed to retrieve reviews');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  return (
    <ScreenWrapper style={styles.container}>
      <AppHeader title="Reviews & Ratings" onBack={() => navigation.goBack()} />

      <View style={styles.summaryCard}>
        <View style={styles.scoreBox}>
          <Text style={styles.scoreText}>4.8</Text>
          <View style={styles.starsRow}>
            {[...Array(5)].map((_, i) => (
              <Text key={i} style={styles.starEmoji}>★</Text>
            ))}
          </View>
          <Text style={styles.subText}>Based on 320 reviews</Text>
        </View>

        <View style={styles.barsContainer}>
          {[
            { star: 5, pct: 80, count: 256 },
            { star: 4, pct: 15, count: 48 },
            { star: 3, pct: 3, count: 10 },
            { star: 2, pct: 1, count: 4 },
            { star: 1, pct: 1, count: 2 }
          ].map(item => (
            <View key={item.star} style={styles.barRow}>
              <Text style={styles.rowStar}>{item.star} ★</Text>
              <View style={styles.barTrack}>
                <View style={[styles.activeBar, { width: `${item.pct}%` as any }]} />
              </View>
              <Text style={styles.rowCount}>{item.count}</Text>
            </View>
          ))}
        </View>
      </View>

      <Text style={styles.sectionHeader}>Customer Comments</Text>

      <FlatList
        data={reviews}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.list}
        refreshing={loading}
        onRefresh={loadReviews}
        renderItem={({ item }) => (
          <ReviewCard review={item} />
        )}
      />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
  },
  summaryCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    margin: spacing.layout,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  scoreBox: {
    alignItems: 'center',
    flex: 1,
  },
  scoreText: {
    fontSize: 36,
    fontWeight: typography.fontWeight.black,
    color: colors.textPrimary,
  },
  starsRow: {
    flexDirection: 'row',
    marginVertical: spacing.xs,
  },
  starEmoji: {
    color: colors.warning,
    fontSize: 16,
    marginHorizontal: 1,
  },
  subText: {
    fontSize: 9,
    color: colors.textMuted,
  },
  barsContainer: {
    flex: 1.5,
    marginLeft: spacing.lg,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  rowStar: {
    fontSize: 9,
    fontWeight: 'bold',
    color: colors.textSecondary,
    width: 24,
  },
  barTrack: {
    flex: 1,
    height: 6,
    backgroundColor: colors.background,
    borderRadius: 3,
    marginHorizontal: spacing.sm,
    overflow: 'hidden',
  },
  activeBar: {
    height: '100%',
    backgroundColor: colors.warning,
    borderRadius: 3,
  },
  rowCount: {
    fontSize: 9,
    color: colors.textMuted,
    width: 24,
    textAlign: 'right',
  },
  sectionHeader: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textSecondary,
    marginLeft: spacing.layout,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  list: {
    paddingHorizontal: spacing.layout,
  },
});
export default ReviewsRatingsScreen;
