import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { useOrders } from '../../services/orderService';
import { MaterialRequestSummaryResponse, ServiceOrder } from '../../types/backend';
import {
  ChevronLeftIcon,
  PhoneCallIcon,
  StarIcon,
  CheckCircleIcon,
  WrenchIcon,
  LocationPinIcon,
} from '../../assets/svg/Icons';

interface OrderTrackingScreenProps {
  orderId: string;
  onBack: () => void;
  onNavigateToSupport: () => void;
}

export const OrderTrackingScreen: React.FC<OrderTrackingScreenProps> = ({
  orderId,
  onBack,
  onNavigateToSupport,
}) => {
  const {
    getOrderById,
    fetchOrderDetails,
    fetchMaterialRequests,
    confirmServiceCompletion,
    submitOrderRating,
    cancelServiceOrder,
  } = useOrders();

  const [rawOrder, setRawOrder] = useState<ServiceOrder | null>(null);
  const [materialRequests, setMaterialRequests] = useState<MaterialRequestSummaryResponse[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedRating, setSelectedRating] = useState<number>(5);
  const [ratingComment, setRatingComment] = useState<string>('');
  const [ratingSubmitted, setRatingSubmitted] = useState<boolean>(false);
  const [isSubmittingRating, setIsSubmittingRating] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  const localOrder = getOrderById(orderId);

  const pollOrder = useCallback(async () => {
    const details = await fetchOrderDetails(orderId);
    if (details) {
      setRawOrder(details);
      if (details.rating) {
        setSelectedRating(details.rating);
        setRatingSubmitted(true);
        if (details.ratingComment) setRatingComment(details.ratingComment);
      }
    }
    const mats = await fetchMaterialRequests(orderId);
    setMaterialRequests(mats);
  }, [orderId, fetchOrderDetails, fetchMaterialRequests]);

  useEffect(() => {
    pollOrder();
    const interval = setInterval(pollOrder, 5000);
    return () => clearInterval(interval);
  }, [pollOrder]);

  const order = localOrder;

  if (!order) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={styles.loadingText}>Loading order details...</Text>
      </View>
    );
  }

  const numericId = Number(orderId.replace(/[^0-9]/g, ''));
  const pinCode = numericId ? String((numericId * 13) % 9000 + 1000) : '8421';

  const handleConfirmCompletion = async () => {
    setActionLoading(true);
    const success = await confirmServiceCompletion(orderId);
    setActionLoading(false);
    if (success) {
      await pollOrder();
    }
  };

  const handleCancel = async () => {
    setActionLoading(true);
    const success = await cancelServiceOrder(orderId);
    setActionLoading(false);
    if (success) {
      await pollOrder();
    }
  };

  const handleSubmitRating = async () => {
    if (selectedRating < 1) return;
    setIsSubmittingRating(true);
    const success = await submitOrderRating(orderId, selectedRating, ratingComment);
    setIsSubmittingRating(false);
    if (success) {
      setRatingSubmitted(true);
      await pollOrder();
    }
  };

  const canCancel =
    rawOrder?.status === 'PENDING' ||
    rawOrder?.status === 'ACCEPTED' ||
    order.status === 'requested' ||
    order.status === 'assigned';

  const isCompleted =
    rawOrder?.status === 'COMPLETED' ||
    rawOrder?.status === 'CUSTOMER_CONFIRMED' ||
    rawOrder?.status === 'PAID' ||
    order.status === 'completed';

  const isAwaitingConfirmation = rawOrder?.status === 'COMPLETED';

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7} accessibilityLabel="Back button">
          <ChevronLeftIcon size={22} color={colors.onBackground} />
        </TouchableOpacity>
        <View style={styles.headerTitleCol}>
          <Text style={styles.headerTitle}>Live Tracking</Text>
          <Text style={styles.headerSub}>Order #{order.orderNumber}</Text>
        </View>
        <TouchableOpacity style={styles.supportBtn} onPress={onNavigateToSupport} accessibilityRole="button">
          <Text style={styles.supportBtnText}>Help</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Live GPS Map Simulation View */}
        <View style={styles.mapContainer}>
          <View style={styles.mapMockBackground}>
            <View style={styles.mapRoadH} />
            <View style={styles.mapRoadV} />
            <View style={styles.routeLine} />

            <View style={styles.plumberMarker}>
              <View style={styles.plumberMarkerCircle}>
                <WrenchIcon size={16} color="#ffffff" />
              </View>
              <View style={styles.plumberMarkerLabel}>
                <Text style={styles.markerText}>
                  {order.plumber ? `${order.plumber.name} (Live)` : 'Dispatching...'}
                </Text>
              </View>
            </View>

            <View style={styles.customerMarker}>
              <LocationPinIcon size={24} color={colors.primary} />
            </View>
          </View>

          <View style={styles.etaPill}>
            <View style={styles.pulsingDot} />
            <Text style={styles.etaText}>
              {order.statusLabel} • {order.orderNumber}
            </Text>
          </View>
        </View>

        {/* Customer Confirmation Action if completed */}
        {isAwaitingConfirmation && (
          <View style={styles.confirmPromptCard}>
            <Text style={styles.confirmPromptTitle}>Plumber marked work as completed</Text>
            <Text style={styles.confirmPromptSub}>
              Please verify the plumbing repair was resolved satisfactorily.
            </Text>
            <TouchableOpacity
              style={styles.confirmActionBtn}
              onPress={handleConfirmCompletion}
              disabled={actionLoading}
              activeOpacity={0.8}
              accessibilityRole="button"
            >
              {actionLoading ? (
                <ActivityIndicator color={colors.onPrimary} size="small" />
              ) : (
                <Text style={styles.confirmActionBtnText}>Confirm Completion</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Plumber Contact Card */}
        {order.plumber && (
          <View style={styles.plumberCard}>
            <View style={styles.plumberHeader}>
              <Image source={{ uri: order.plumber.photoUrl }} style={styles.plumberImg} />
              <View style={styles.plumberMain}>
                <Text style={styles.plumberName}>{order.plumber.name}</Text>
                <View style={styles.plumberRatingRow}>
                  <StarIcon size={12} fill={colors.star} />
                  <Text style={styles.ratingVal}>{order.plumber.rating}</Text>
                  <Text style={styles.jobsDone}> • {order.plumber.completedJobs} jobs completed</Text>
                </View>
                <Text style={styles.experienceBadge}>
                  {order.plumber.experienceYears} Years Exp • {order.plumber.badge}
                </Text>
              </View>

              <TouchableOpacity style={styles.callBtn} activeOpacity={0.8} accessibilityRole="button" accessibilityLabel="Call Plumber">
                <PhoneCallIcon size={20} color={colors.onPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.otpCard}>
              <View>
                <Text style={styles.otpLabel}>Start Service Verification PIN</Text>
                <Text style={styles.otpSub}>Share this with plumber upon arrival</Text>
              </View>
              <View style={styles.otpCodeBadge}>
                <Text style={styles.otpCodeText}>{pinCode}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Material Approval & Tracking Card */}
        {materialRequests && materialRequests.length > 0 && (
          <View style={styles.materialCard}>
            <View style={styles.materialCardHeader}>
              <WrenchIcon size={18} color={colors.primary} />
              <Text style={styles.materialCardTitle}>Plumber Material Requests</Text>
            </View>
            <Text style={styles.materialCardDesc}>
              Materials and spare parts required for this service order:
            </Text>

            {materialRequests.map((mat) => (
              <View key={mat.id} style={styles.materialItemRow}>
                <View style={styles.matInfo}>
                  <Text style={styles.matTitle}>
                    {mat.storeName || 'FixKart Authorized Store'} • {mat.itemCount} Items
                  </Text>
                  <Text style={styles.matCost}>₹{mat.totalAmount}</Text>
                </View>

                <View style={styles.approvedBadge}>
                  <CheckCircleIcon size={16} color={colors.primary} />
                  <Text style={styles.approvedBadgeText}>{mat.status}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Service Progress Timeline */}
        <View style={styles.timelineCard}>
          <Text style={styles.timelineTitle}>Service Progress Timeline</Text>

          {order.timeline.map((step, idx) => (
            <View key={idx} style={styles.timelineStep}>
              <View style={styles.timelineIndicatorCol}>
                <View
                  style={[
                    styles.timelineDot,
                    step.completed ? styles.timelineDotDone : styles.timelineDotPending,
                  ]}
                >
                  {step.completed && <Text style={styles.timelineCheckMark}>✓</Text>}
                </View>
                {idx < order.timeline.length - 1 && (
                  <View
                    style={[
                      styles.timelineLine,
                      step.completed && styles.timelineLineDone,
                    ]}
                  />
                )}
              </View>

              <View style={styles.timelineTextCol}>
                <View style={styles.timelineTitleRow}>
                  <Text
                    style={[
                      styles.stepTitle,
                      step.completed && styles.stepTitleDone,
                    ]}
                  >
                    {step.title}
                  </Text>
                  <Text style={styles.stepTime}>{step.time}</Text>
                </View>
                <Text style={styles.stepDesc}>{step.description}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Rating Section if Completed */}
        {isCompleted && (
          <View style={styles.ratingCard}>
            <Text style={styles.ratingCardTitle}>
              {ratingSubmitted ? 'Your Service Rating' : 'Rate Your Plumber & Service'}
            </Text>

            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => !ratingSubmitted && setSelectedRating(star)}
                  disabled={ratingSubmitted}
                  style={styles.starBtn}
                >
                  <StarIcon
                    size={32}
                    fill={star <= selectedRating ? colors.star : 'transparent'}
                    color={star <= selectedRating ? colors.star : colors.outline}
                  />
                </TouchableOpacity>
              ))}
            </View>

            {!ratingSubmitted ? (
              <>
                <TextInput
                  style={styles.reviewInput}
                  value={ratingComment}
                  onChangeText={setRatingComment}
                  placeholder="Leave feedback on service quality, punctuality, and work..."
                  placeholderTextColor={colors.outline}
                  multiline={true}
                />
                <TouchableOpacity
                  style={styles.submitRatingBtn}
                  onPress={handleSubmitRating}
                  disabled={isSubmittingRating}
                  activeOpacity={0.8}
                >
                  {isSubmittingRating ? (
                    <ActivityIndicator color={colors.onPrimary} size="small" />
                  ) : (
                    <Text style={styles.submitRatingText}>Submit Rating</Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.ratingSavedBanner}>
                <CheckCircleIcon size={18} color={colors.success} />
                <Text style={styles.ratingSavedText}>
                  Thank you! Your rating has been submitted to FixKart.
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Order Details & Summary */}
        <View style={styles.detailsCard}>
          <Text style={styles.detailsCardTitle}>Booking Summary</Text>
          {order.items.map((item, idx) => (
            <View key={idx} style={styles.summaryItemRow}>
              <Text style={styles.summaryItemTitle}>
                {item.title} (x{item.quantity})
              </Text>
              <Text style={styles.summaryItemPrice}>₹{item.price * item.quantity}</Text>
            </View>
          ))}

          <View style={styles.divider} />

          <View style={styles.summaryTotalRow}>
            <Text style={styles.summaryTotalLabel}>Total Amount</Text>
            <Text style={styles.summaryTotalAmount}>₹{order.total}</Text>
          </View>
        </View>

        {/* Cancel Action if applicable */}
        {canCancel && (
          <TouchableOpacity
            style={styles.cancelBookingBtn}
            onPress={handleCancel}
            disabled={actionLoading}
            activeOpacity={0.8}
          >
            {actionLoading ? (
              <ActivityIndicator color={colors.error} size="small" />
            ) : (
              <Text style={styles.cancelBookingBtnText}>Cancel Booking</Text>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: spacing.sm,
    fontSize: 13,
    color: colors.secondary,
  },
  header: {
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
  headerTitleCol: {
    flex: 1,
  },
  headerTitle: {
    fontFamily: typography.h4.fontFamily,
    fontSize: 16,
    fontWeight: '600',
    color: colors.onBackground,
  },
  headerSub: {
    fontSize: 11,
    color: colors.secondary,
  },
  supportBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.primaryFixed,
    borderRadius: 8,
  },
  supportBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 90,
  },
  mapContainer: {
    height: 180,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#dbe7f6',
    position: 'relative',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.surfaceVariant,
  },
  mapMockBackground: {
    flex: 1,
    position: 'relative',
  },
  mapRoadH: {
    position: 'absolute',
    top: 90,
    left: 0,
    right: 0,
    height: 16,
    backgroundColor: '#c5d7ee',
  },
  mapRoadV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 120,
    width: 16,
    backgroundColor: '#c5d7ee',
  },
  routeLine: {
    position: 'absolute',
    top: 86,
    left: 70,
    width: 220,
    height: 6,
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  plumberMarker: {
    position: 'absolute',
    top: 60,
    left: 50,
    alignItems: 'center',
  },
  plumberMarkerCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  plumberMarkerLabel: {
    backgroundColor: colors.surface,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2,
  },
  markerText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.primary,
  },
  customerMarker: {
    position: 'absolute',
    top: 75,
    right: 50,
  },
  etaPill: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: colors.onBackground,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  pulsingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
    marginRight: 6,
  },
  etaText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.onBackground,
  },
  confirmPromptCard: {
    backgroundColor: colors.primaryFixed,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  confirmPromptTitle: {
    fontFamily: typography.h4.fontFamily,
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 2,
  },
  confirmPromptSub: {
    fontSize: 11,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.sm,
  },
  confirmActionBtn: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  confirmActionBtnText: {
    color: colors.onPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  plumberCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.surfaceVariant,
    marginBottom: spacing.md,
  },
  plumberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  plumberImg: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.surfaceContainer,
  },
  plumberMain: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  plumberName: {
    fontFamily: typography.h4.fontFamily,
    fontSize: 16,
    fontWeight: '600',
    color: colors.onBackground,
  },
  plumberRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  ratingVal: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.onBackground,
    marginLeft: 3,
  },
  jobsDone: {
    fontSize: 11,
    color: colors.secondary,
  },
  experienceBadge: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  callBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  otpCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.primaryFixed,
    padding: 12,
    borderRadius: 12,
    marginTop: spacing.md,
  },
  otpLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  otpSub: {
    fontSize: 10,
    color: colors.onSurfaceVariant,
    marginTop: 1,
  },
  otpCodeBadge: {
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  otpCodeText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 2,
  },
  materialCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.surfaceVariant,
    marginBottom: spacing.md,
  },
  materialCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  materialCardTitle: {
    fontFamily: typography.h4.fontFamily,
    fontSize: 16,
    fontWeight: '600',
    color: colors.onBackground,
    marginLeft: 6,
  },
  materialCardDesc: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    color: colors.secondary,
    marginBottom: spacing.sm,
  },
  materialItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 10,
    borderRadius: 10,
    marginBottom: 6,
  },
  matInfo: {
    flex: 1,
  },
  matTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.onBackground,
  },
  matCost: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 2,
  },
  approvedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryFixed,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  approvedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
    marginLeft: 4,
  },
  timelineCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.surfaceVariant,
    marginBottom: spacing.md,
  },
  timelineTitle: {
    fontFamily: typography.h4.fontFamily,
    fontSize: 16,
    fontWeight: '600',
    color: colors.onBackground,
    marginBottom: spacing.md,
  },
  timelineStep: {
    flexDirection: 'row',
  },
  timelineIndicatorCol: {
    alignItems: 'center',
    width: 28,
  },
  timelineDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineDotDone: {
    backgroundColor: colors.primary,
  },
  timelineDotPending: {
    backgroundColor: colors.surfaceContainerHigh,
    borderWidth: 2,
    borderColor: colors.outlineVariant,
  },
  timelineCheckMark: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: colors.surfaceVariant,
    marginVertical: 4,
  },
  timelineLineDone: {
    backgroundColor: colors.primary,
  },
  timelineTextCol: {
    flex: 1,
    paddingLeft: spacing.xs,
    paddingBottom: spacing.md,
  },
  timelineTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.secondary,
  },
  stepTitleDone: {
    color: colors.onBackground,
    fontWeight: '700',
  },
  stepTime: {
    fontSize: 11,
    color: colors.secondary,
  },
  stepDesc: {
    fontSize: 11,
    color: colors.secondary,
    marginTop: 2,
    lineHeight: 15,
  },
  ratingCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.surfaceVariant,
    marginBottom: spacing.md,
  },
  ratingCardTitle: {
    fontFamily: typography.h4.fontFamily,
    fontSize: 16,
    fontWeight: '600',
    color: colors.onBackground,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  starBtn: {
    padding: 4,
  },
  reviewInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.surfaceVariant,
    borderRadius: 10,
    padding: spacing.sm,
    fontSize: 12,
    color: colors.onBackground,
    minHeight: 60,
    textAlignVertical: 'top',
    marginBottom: spacing.sm,
  },
  submitRatingBtn: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  submitRatingText: {
    color: colors.onPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  ratingSavedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.successContainer,
    padding: 10,
    borderRadius: 8,
  },
  ratingSavedText: {
    color: colors.onSuccess,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  detailsCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.surfaceVariant,
    marginBottom: spacing.md,
  },
  detailsCardTitle: {
    fontFamily: typography.h4.fontFamily,
    fontSize: 16,
    fontWeight: '600',
    color: colors.onBackground,
    marginBottom: spacing.sm,
  },
  summaryItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  summaryItemTitle: {
    fontSize: 12,
    color: colors.onBackground,
  },
  summaryItemPrice: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.onBackground,
  },
  divider: {
    height: 1,
    backgroundColor: colors.surfaceVariant,
    marginVertical: spacing.sm,
  },
  summaryTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryTotalLabel: {
    fontFamily: typography.body2.fontFamily,
    fontSize: 14,
    fontWeight: '600',
    color: colors.onBackground,
  },
  summaryTotalAmount: {
    fontFamily: typography.h3.fontFamily,
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  cancelBookingBtn: {
    backgroundColor: colors.errorContainer,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelBookingBtnText: {
    color: colors.error,
    fontSize: 13,
    fontWeight: '700',
  },
});
