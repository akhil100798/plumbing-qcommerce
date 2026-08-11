import { NavigationProp, useNavigation } from '@react-navigation/native';
import React from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import ArrowLeftIcon from '../../assets/icons/arrow-left.svg';
import WarehouseIcon from '../../assets/icons/warehouse.svg';
import { borderRadius, colors, spacing, typography } from '../../theme';
import { AppStackParamList } from '../../types/navigation';

export function OffersPromotionsScreen() {
  const navigation = useNavigation<NavigationProp<AppStackParamList>>();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            if (navigation.canGoBack()) navigation.goBack();
            else navigation.navigate('Main', { screen: 'AccountTab' } as any);
          }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <ArrowLeftIcon width={24} height={24} stroke={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Offers & Promotions</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.centerContent}>
        <View style={styles.iconCircle}>
          <WarehouseIcon width={40} height={40} stroke={colors.primaryContainer || colors.primary} />
        </View>
        <Text style={styles.title}>Marketing Campaigns Deferred</Text>
        <Text style={styles.description}>
          Store marketing campaigns, promotional coupons, and discount management features are deferred across all FixKart apps.
        </Text>
        <View style={styles.pill}>
          <Text style={styles.pillText}>FEATURE_MARKETING_ENABLED = false</Text>
        </View>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate('Main', { screen: 'HomeTab' } as any)}
        >
          <Text style={styles.actionBtnText}>Return to Dashboard</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background || '#F9F9F9' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.layout,
    paddingVertical: spacing.md,
    backgroundColor: colors.surfaceContainerLowest || '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.border || '#C6C5D4',
  },
  headerTitle: { fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
  centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.layout, gap: spacing.sm },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.surfaceContainerLow || '#F4F3F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
  description: { fontSize: typography.fontSize.xs, color: colors.textSecondary, textAlign: 'center', lineHeight: 18 },
  pill: {
    backgroundColor: colors.surfaceContainerLow || '#F4F3F7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border || '#C6C5D4',
  },
  pillText: { fontSize: 10, fontWeight: '700', color: colors.textMuted },
  actionBtn: {
    backgroundColor: colors.primaryContainer || colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    marginTop: spacing.md,
  },
  actionBtnText: { color: '#FFFFFF', fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.bold },
});

export default OffersPromotionsScreen;
