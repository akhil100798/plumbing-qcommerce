import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Alert, TouchableOpacity } from 'react-native';
import { colors, borderRadius, spacing, typography, shadows } from '../../theme';
import { ScreenWrapper } from '../../components/common/ScreenWrapper';
import { AppHeader } from '../../components/common/AppHeader';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { ordersService } from '../../services/orders/ordersService';
import { dispatchService } from '../../services/dispatch/dispatchService';
import { useAppDispatch } from '../../redux/store';
import { updateOrderInSlice } from '../../redux/slices/ordersSlice';
import { NavigationProp, RouteProp, useNavigation, useRoute, useIsFocused } from '@react-navigation/native';
import { AppStackParamList } from '../../types/navigation';
import { Order, Rider } from '../../types';

export const ReadyForPickupScreen = () => {
  const navigation = useNavigation<NavigationProp<AppStackParamList>>();
  const route = useRoute<RouteProp<AppStackParamList, 'ReadyForPickup'>>();
  const dispatch = useAppDispatch();
  const isFocused = useIsFocused();
  const { orderId } = route.params;

  const [order, setOrder] = useState<Order | null>(null);
  const [rider, setRider] = useState<Rider | null>(null);
  const [loading, setLoading] = useState(false);

  const loadDetails = async () => {
    try {
      const o = await ordersService.getOrderDetails(orderId);
      setOrder(o);
      
      if (o.deliveryPartnerName) {
        // Find matching rider details
        const riders = await dispatchService.getAvailableRiders();
        const found = riders.find(r => r.fullName === o.deliveryPartnerName);
        if (found) setRider(found);
      } else {
        setRider(null);
      }
    } catch (e: any) {
      Alert.alert('Error', 'Failed to retrieve pickup status');
    }
  };

  useEffect(() => {
    if (isFocused) {
      loadDetails();
    }
  }, [orderId, isFocused]);

  const handleHandover = async () => {
    if (!order) return;
    setLoading(true);
    try {
      const updated = await ordersService.handOverPackage(order.id);
      dispatch(updateOrderInSlice(updated));
      Alert.alert('Package Handed Over', 'Order is now out for delivery!', [
        { text: 'OK', onPress: () => navigation.navigate('Main', { screen: 'HomeTab' }) }
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Handover failed');
    } finally {
      setLoading(false);
    }
  };

  if (!order) {
    return (
      <ScreenWrapper style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading details...</Text>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper style={styles.container}>
      <AppHeader title="Ready for Pickup" onBack={() => navigation.goBack()} />

      <View style={styles.content}>
        <View style={styles.boxCard}>
          <Text style={styles.boxEmoji}>📦</Text>
          <Text style={styles.boxTitle}>Order Packed Successfully!</Text>
          <Text style={styles.boxSub}>Waiting for rider to pick up the package.</Text>
        </View>

        <Text style={styles.sectionHeader}>Assigned Rider</Text>

        {rider ? (
          <View style={styles.riderCard}>
            <View style={styles.riderHeader}>
              <View style={styles.riderInfo}>
                <View style={styles.riderAvatar}>
                  <Text style={styles.avatarText}>🚴</Text>
                </View>
                <View>
                  <Text style={styles.riderName}>{rider.fullName}</Text>
                  <View style={styles.ratingRow}>
                    <Text style={styles.star}>★</Text>
                    <Text style={styles.ratingVal}>{rider.rating}</Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity
                style={styles.phoneBtn}
                onPress={() => Alert.alert('Call Rider', `Calling ${rider.phone}`)}
              >
                <Text style={styles.phoneEmoji}>📞</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.riderFooter}>
              <View>
                <Text style={styles.footerLabel}>Vehicle Number</Text>
                <Text style={styles.footerVal}>{rider.vehicleNumber}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.footerLabel}>Status</Text>
                <Text style={styles.footerVal}>{rider.eta || 'Nearby'}</Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.noRiderCard}>
            <Text style={styles.noRiderText}>No rider assigned yet</Text>
            <TouchableOpacity
              style={styles.assignLink}
              onPress={() => navigation.navigate('DispatchAssignment', { orderId: order.id })}
            >
              <Text style={styles.assignLinkText}>Assign Delivery Rider Now</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.instructionCard}>
          <Text style={styles.instructionTitle}>Pickup Instruction</Text>
          <Text style={styles.instructionText}>
            1. Verify the order items count and matching packaging labels before handing over.{'\n'}
            2. Share OTP: <Text style={styles.otpHighlight}>#{order.deliveryOtp || '7234'}</Text> with the rider to verify dispatch.
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <PrimaryButton
          title="Hand Over Package"
          onPress={handleHandover}
          loading={loading}
          disabled={!rider}
        />
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  content: {
    flex: 1,
    padding: spacing.layout,
  },
  boxCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
    marginBottom: spacing.lg,
  },
  boxEmoji: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  boxTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.success,
  },
  boxSub: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  sectionHeader: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  riderCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
    marginBottom: spacing.lg,
  },
  riderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.sm,
  },
  riderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  riderAvatar: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.round,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    fontSize: 18,
  },
  riderName: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  star: {
    color: colors.warning,
    fontSize: 12,
    marginRight: 2,
  },
  ratingVal: {
    fontSize: typography.fontSize.xs,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  phoneBtn: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.round,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  phoneEmoji: {
    fontSize: 14,
    color: colors.primary,
  },
  riderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
  },
  footerLabel: {
    fontSize: 9,
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  footerVal: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginTop: 2,
  },
  noRiderCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
    marginBottom: spacing.lg,
  },
  noRiderText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.md,
  },
  assignLink: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.xs,
  },
  assignLinkText: {
    color: colors.primary,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
  instructionCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  instructionTitle: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  instructionText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  otpHighlight: {
    fontWeight: 'bold',
    color: colors.primary,
  },
  footer: {
    padding: spacing.layout,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
export default ReadyForPickupScreen;
