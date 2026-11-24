import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Alert,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { colors, borderRadius, spacing, typography } from '../../theme';
import { reviewService } from '../../services/reviews/reviewService';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { AppStackParamList } from '../../types/navigation';
import { Review } from '../../types';
import { StoreIcon } from '../../components/common/StoreIcon';

const mockReviewsList: Review[] = [
  {
    id: 1,
    customerName: 'Ramesh Kumar (Plumber)',
    rating: 5,
    comment: 'All CPVC fittings were packaged and ready at counter when I arrived. Saved 30 mins on job.',
    createdAt: '2025-03-20T10:30:00Z',
  },
  {
    id: 2,
    customerName: 'Suresh Patel (Plumber)',
    rating: 5,
    comment: 'Genuine Astral pipes provided at agreed pricing. Counter staff verified order quickly.',
    createdAt: '2025-03-18T14:15:00Z',
  },
  {
    id: 3,
    customerName: 'Amit Sharma',
    rating: 4,
    comment: 'Good stock of brass angle valves. Fast counter pickup.',
    createdAt: '2025-03-15T09:45:00Z',
  },
  {
    id: 4,
    customerName: 'Rajesh Verma (Plumber)',
    rating: 5,
    comment: 'Always reliable store for plumbing materials and fittings.',
    createdAt: '2025-03-12T16:20:00Z',
  },
];

export const ReviewsRatingsScreen = () => {
  const navigation = useNavigation<NavigationProp<AppStackParamList>>();
  const [reviews, setReviews] = useState<Review[]>(mockReviewsList);
  const [loading, setLoading] = useState(false);
  const [avgRating, setAvgRating] = useState(4.7);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const data = await reviewService.getReviews();
      if (data && data.length > 0) {
        setReviews(data);
        const avg = data.reduce((sum: number, r: Review) => sum + r.rating, 0) / data.length;
        setAvgRating(Math.round(avg * 10) / 10);
      }
    } catch {
      // Retain mock reviews if network fails
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const distribution = [
    { star: 5, pct: 68, color: '#059669' },
    { star: 4, pct: 22, color: '#10B981' },
    { star: 3, pct: 7, color: '#F59E0B' },
    { star: 2, pct: 2, color: '#F97316' },
    { star: 1, pct: 1, color: '#EF4444' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            if (navigation.canGoBack()) navigation.goBack();
            else navigation.navigate('Main', { screen: 'AccountTab' });
          }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.headerButton}
        >
          <StoreIcon name="arrow-left" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reviews & Ratings</Text>
        <View style={{ width: 36 }} />
      </View>

      <FlatList
        data={reviews}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshing={loading}
        onRefresh={loadReviews}
        ListHeaderComponent={
          <>
            {/* Ratings Summary Card */}
            <View style={styles.summaryCard}>
              <View style={styles.scoreCol}>
                <Text style={styles.bigRatingText}>{avgRating.toFixed(1)}</Text>
                <View style={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <StoreIcon
                      key={i}
                      name="review"
                      size={14}
                      color={i <= Math.round(avgRating) ? '#F59E0B' : colors.border}
                    />
                  ))}
                </View>
                <Text style={styles.reviewCountText}>({reviews.length} Reviews)</Text>
              </View>

              <View style={styles.distributionCol}>
                {distribution.map((item) => (
                  <View key={item.star} style={styles.distRow}>
                    <Text style={styles.starNum}>{item.star}</Text>
                    <View style={styles.distTrack}>
                      <View
                        style={[
                          styles.distFill,
                          { width: `${item.pct}%`, backgroundColor: item.color },
                        ]}
                      />
                    </View>
                    <Text style={styles.distPctText}>{item.pct}%</Text>
                  </View>
                ))}
              </View>
            </View>

            <Text style={styles.sectionHeader}>Customer & Plumber Feedback</Text>
          </>
        }
        renderItem={({ item }) => (
          <View style={styles.reviewCard}>
            <View style={styles.reviewTopRow}>
              <View style={styles.userAvatar}>
                <Text style={styles.userAvatarText}>
                  {item.customerName ? item.customerName.charAt(0).toUpperCase() : 'U'}
                </Text>
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{item.customerName || 'Verified Customer'}</Text>
                <Text style={styles.reviewDate}>
                  {new Date(item.createdAt).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </Text>
              </View>
              <View style={styles.cardStars}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <StoreIcon
                    key={i}
                    name="review"
                    size={12}
                    color={i <= item.rating ? '#F59E0B' : colors.border}
                  />
                ))}
              </View>
            </View>

            {item.comment ? (
              <Text style={styles.reviewComment}>{item.comment}</Text>
            ) : null}
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <StoreIcon name="review" size={44} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No Reviews Yet</Text>
            <Text style={styles.emptySubtitle}>
              Reviews from plumbers and counter pickups will appear here.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  scoreCol: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 110,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    paddingRight: spacing.md,
  },
  bigRatingText: {
    fontSize: 40,
    fontWeight: typography.fontWeight.black,
    color: colors.textPrimary,
    letterSpacing: -1,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
    marginVertical: 4,
  },
  reviewCountText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  distributionCol: {
    flex: 1,
    paddingLeft: spacing.lg,
    gap: 6,
  },
  distRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  starNum: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    width: 10,
  },
  distTrack: {
    flex: 1,
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  distFill: {
    height: '100%',
    borderRadius: 3,
  },
  distPctText: {
    fontSize: 10.5,
    color: colors.textMuted,
    width: 26,
    textAlign: 'right',
  },
  sectionHeader: {
    fontSize: 13.5,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  reviewCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  reviewTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  userAvatarText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  userInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  userName: {
    fontSize: 13,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  reviewDate: {
    fontSize: 10.5,
    color: colors.textMuted,
    marginTop: 1,
  },
  cardStars: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewComment: {
    fontSize: 12.5,
    color: colors.textPrimary,
    lineHeight: 18,
    marginTop: spacing.md,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl * 2,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  emptySubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
});

export default ReviewsRatingsScreen;
