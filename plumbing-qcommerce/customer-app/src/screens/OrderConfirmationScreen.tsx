import { StackScreenProps } from '@react-navigation/stack';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { PrimaryButton } from '../components/common/PrimaryButton';
import { SecondaryButton } from '../components/common/SecondaryButton';
import { borderRadius, colors, spacing, typography } from '../theme';
import { AppStackParamList } from '../types/navigation';

type Props = StackScreenProps<AppStackParamList, 'OrderConfirmation'>;

export function OrderConfirmationScreen({ route, navigation }: Props) {
  const { orderId, totalAmount, address, eta } = route.params;

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 40,
        friction: 6,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleTrackOrder = () => {
    navigation.replace('OrderTracking', { orderId, type: 'product' });
  };

  const handleContinueShopping = () => {
    navigation.popToTop();
    navigation.navigate('Main');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.animationSection}>
          <Animated.View style={[styles.checkmarkCircle, { transform: [{ scale: scaleAnim }] }]}>
            <Text style={styles.checkmarkEmoji}>✓</Text>
          </Animated.View>
          <Animated.View style={{ opacity: fadeAnim, alignItems: 'center' }}>
            <Text style={styles.successTitle}>Order Placed!</Text>
            <Text style={styles.successSub}>
              Thank you for your purchase. Your order is confirmed.
            </Text>
          </Animated.View>
        </View>

        <View style={styles.detailsCard}>
          <Text style={styles.cardHeader}>Order Summary</Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Order ID</Text>
            <Text style={styles.detailValue}>#{orderId}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Total Paid</Text>
            <Text style={styles.detailValue}>₹{totalAmount}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.addressBlock}>
            <Text style={styles.addressTitle}>📍 Shipping Address</Text>
            <Text style={styles.addressText}>{address}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.etaRow}>
            <Text style={styles.etaEmoji}>⚡</Text>
            <View>
              <Text style={styles.etaTitle}>Estimated Delivery</Text>
              <Text style={styles.etaValueText}>{eta}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton
          title="Track Delivery Order"
          onPress={handleTrackOrder}
          style={styles.actionBtn}
        />
        <SecondaryButton
          title="Continue Shopping"
          onPress={handleContinueShopping}
          textColor={colors.primary}
          outlineColor={colors.borderDark}
          style={styles.actionBtn}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.layout,
    paddingBottom: spacing.huge,
    alignItems: 'center',
  },
  animationSection: {
    alignItems: 'center',
    marginVertical: spacing.huge,
  },
  checkmarkCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  checkmarkEmoji: {
    fontSize: 42,
    color: colors.surface,
    fontWeight: 'bold',
  },
  successTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.black,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  successSub: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    fontWeight: typography.fontWeight.medium,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.md,
    lineHeight: 20,
  },
  detailsCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  cardHeader: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  detailLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },
  detailValue: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.bold,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  addressBlock: {
    gap: spacing.xs,
  },
  addressTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  addressText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
    lineHeight: 18,
  },
  etaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  etaEmoji: {
    fontSize: 24,
  },
  etaTitle: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
    fontWeight: typography.fontWeight.bold,
  },
  etaValueText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: typography.fontWeight.black,
    marginTop: 2,
  },
  footer: {
    padding: spacing.layout,
    borderTopWidth: 1.5,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    gap: spacing.sm,
  },
  actionBtn: {
    width: '100%',
  },
});
