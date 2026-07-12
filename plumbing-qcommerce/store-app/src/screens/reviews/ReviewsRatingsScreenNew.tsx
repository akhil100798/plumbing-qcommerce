import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, FlatList, Alert } from 'react-native';
import { colors, borderRadius, spacing, typography, shadows } from '../../theme';
import { ScreenWrapper } from '../../components/common/ScreenWrapper';
import { AppHeader } from '../../components/common/AppHeader';
import { ReviewCard } from '../../components/cards/WalletReviewsPromoCards';
import { reviewService } from '../../services/reviews/reviewService';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { AppStackParamList } from '../../types/navigation';
import { Review } from '../../types';
import StarIcon from '../../assets/icons/star.svg';
import SuccessCheckIcon from '../../assets/icons/success-check.svg';

export const ReviewsRatingsScreen = () => {
  const navigation = useNavigation<NavigationProp<AppStackParamList>>();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [avgRating, setAvgRating] = useState(0);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const data = await reviewService.getReviews();
      setReviews(data);
      if (data.length > 0) {
        const avg = data.reduce((sum: number, r: Review) => sum + r.rating, 0) / data.length;
        setAvgRating(Math.round(avg * 10) / 10);
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to retrieve store reviews');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  return (
    <ScreenWrapper style={styles.container}>
      <AppHeader title="Reviews and Ratings" onBackPress={() => navigation.goBack()} />

      <View style={styles.summaryCard}>
        <View style={styles.ratingCircle}>
          <Text style={styles.ratingNum}>{avgRating > 0 ? avgRating : '4.6'}</Text>
          <View style={styles.ratingStarRow}>
            {[1, 2, 3, 4, 5].map(i => (
              <StarIcon
                key={i}
                width={10}
                height={10}
                fill={i <= Math.round(avgRating || 4.6) ? colors.warning : colors.border}
                stroke={i <= Math.round(avgRating || 4.6) ? colors.warning : colors.border}
                style={{ marginRight: 1 }}
              />
            ))}
          </View>
          <Text style={styles.ratingCount}>{reviews.length > 0 ? reviews.length : 128} reviews</Text>
        </View>

        <View style={styles.breakdown}>
          {[5, 4, 3, 2, 1].map(star => {
            const mockPcts = [70, 20, 6, 2, 2];
            const count = reviews.filter(r => Math.round(r.rating) === star).length;
            const pct = reviews.length > 0 ? (count / reviews.length) * 100 : mockPcts[5 - star];
            return (
              <View key={star} style={styles.breakdownRow}>
                <Text style={styles.breakdownStar}>{star}</Text>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${pct}%` as any }]} />
                </View>
              </View>
            );
          })}
        </View>
      </View>

      <Text style={styles.sectionHeader}>Recent Reviews</Text>

      <FlatList
        data={reviews}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.list}
        refreshing={loading}
        onRefresh={loadReviews}
        renderItem={({ item }) => <ReviewCard review={item} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <SuccessCheckIcon width={40} height={40} stroke={colors.textMuted} style={{ marginBottom: spacing.md }} />
            <Text style={styles.emptyText}>No customer reviews yet</Text>
          </View>
        }
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
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  ratingCircle: {
    alignItems: 'center',
    marginRight: spacing.xl,
  },
  ratingNum: {
    fontSize: 36,
    fontWeight: typography.fontWeight.black,
    color: colors.textPrimary,
  },
  ratingStarRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  ratingCount: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 4,
  },
  breakdown: {
    flex: 1,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  breakdownStar: {
    fontSize: 10,
    color: colors.textSecondary,
    width: 14,
  },
  barTrack: {
    flex: 1,
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: colors.warning,
    borderRadius: 3,
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
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.giant,
  },
  emptyText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.bold,
  },
});
export default ReviewsRatingsScreen;
