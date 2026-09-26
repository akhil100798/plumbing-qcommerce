import { StackScreenProps } from '@react-navigation/stack';
import * as Clipboard from 'expo-clipboard';
import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { OfferCard } from '../components/cards/OfferCard';
import { Toast } from '../components/common/Toast';
import { colors, spacing, typography } from '../theme';
import { AppStackParamList } from '../types/navigation';

type Props = StackScreenProps<AppStackParamList, 'Offers'>;

interface CouponItem {
  id: string;
  code: string;
  discountText: string;
  description: string;
  expiryText: string;
}

export function OffersScreen({ navigation }: Props) {
  const [coupons, setCoupons] = useState<CouponItem[]>([
    {
      id: 'o1',
      code: 'PLUMB50',
      discountText: '50%\nOFF',
      description: '50% off base inspection fee on your first plumber booking',
      expiryText: 'Valid till June 30, 2026',
    },
    {
      id: 'o2',
      code: 'RAINPIPE',
      discountText: '₹100\nOFF',
      description: 'Flat ₹100 off on CPVC Pipes & joints of orders above ₹499',
      expiryText: 'Valid till July 15, 2026',
    },
    {
      id: 'o3',
      code: 'FREEFLOW',
      discountText: 'FREE\nDEL',
      description: 'Free delivery on buying premium tools and sanitaryware products',
      expiryText: 'Valid till June 28, 2026',
    },
    {
      id: 'o4',
      code: 'WALLETSAVE',
      discountText: '10%\nCB',
      description: 'Get 10% cashback directly into your PlumbCommerce wallet on using UPI',
      expiryText: 'Valid till Dec 31, 2026',
    },
  ]);

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const handleCopy = async (code: string) => {
    await Clipboard.setStringAsync(code);
    setToastMessage(`Code "${code}" copied to clipboard!`);
    setToastVisible(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Toast
        visible={toastVisible}
        message={toastMessage}
        onHide={() => setToastVisible(false)}
      />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Offers & Coupons</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>Available Promo Codes</Text>
        {coupons.map((coupon) => (
          <OfferCard
            key={coupon.id}
            code={coupon.code}
            discountText={coupon.discountText}
            description={coupon.description}
            expiryText={coupon.expiryText}
            onCopy={() => handleCopy(coupon.code)}
          />
        ))}
      </ScrollView>
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
  scrollContent: {
    padding: spacing.layout,
    paddingBottom: spacing.huge,
  },
  sectionTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
