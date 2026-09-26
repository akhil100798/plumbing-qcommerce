import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { AppStackParamList } from '../../types/navigation';
import ArrowLeftIcon from '../../assets/icons/arrow-left.svg';
import SuccessCheckIcon from '../../assets/icons/success-check.svg';
import WarehouseIcon from '../../assets/icons/warehouse.svg';
import { colors, borderRadius, spacing, typography } from '../../theme';

const initialChecklist = [
  {
    key: 'verify',
    title: 'Verify Items (5/5)',
    subtitle: 'All items matched',
    state: 'done',
  },
  {
    key: 'quality',
    title: 'Quality Check',
    subtitle: 'Items are in good condition',
    state: 'done',
  },
  {
    key: 'packaging',
    title: 'Secure Packaging',
    subtitle: 'Pack items safely',
    state: 'active',
  },
  {
    key: 'invoice',
    title: 'Add Invoice',
    subtitle: 'Generate & attach invoice',
    state: 'pending',
  },
];

export function PackingScreen() {
  const navigation = useNavigation<NavigationProp<AppStackParamList>>();
  const [checklist, setChecklist] = useState(initialChecklist);

  const toggleItem = (key: string) => {
    setChecklist((prev) =>
      prev.map((item) => {
        if (item.key === key) {
          const nextState = item.state === 'done' ? 'pending' : 'done';
          return { ...item, state: nextState };
        }
        return item;
      })
    );
  };

  const handleMarkPacked = () => {
    Alert.alert('Order Marked Packed', 'Order #FK123456 has been marked as packed.', [
      { text: 'View Pickup Status', onPress: () => navigation.navigate('ReadyForPickup', { orderId: '123456' } as any) },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <ArrowLeftIcon width={24} height={24} stroke={colors.textPrimary} />
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text style={styles.headerTitle}>Packing Checklist</Text>
          <Text style={styles.headerSubtitle}>#FK123456</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.stepLabel}>Step 3 of 3</Text>

          {checklist.map((item, idx) => (
            <TouchableOpacity key={item.key} style={styles.checklistRow} onPress={() => toggleItem(item.key)}>
              <View style={styles.checklistLeft}>
                <View
                  style={[
                    styles.statusCircle,
                    item.state === 'done' && styles.statusCircleDone,
                    item.state === 'active' && styles.statusCircleActive,
                  ]}
                >
                  {item.state === 'done' && (
                    <SuccessCheckIcon width={12} height={12} stroke={colors.surface} />
                  )}
                </View>
                {idx !== checklist.length - 1 && <View style={styles.connector} />}
              </View>

              <View
                style={[
                  styles.checklistCard,
                  item.state === 'active' && styles.checklistCardActive,
                ]}
              >
                <Text
                  style={[
                    styles.checklistTitle,
                    item.state === 'active' && { color: colors.primary },
                    item.state === 'pending' && { color: colors.textMuted },
                  ]}
                >
                  {item.title}
                </Text>
                <Text style={styles.checklistSubtitle}>{item.subtitle}</Text>
              </View>
            </TouchableOpacity>
          ))}

          <TouchableOpacity style={styles.primaryButton} onPress={handleMarkPacked}>
            <Text style={styles.primaryButtonText}>Mark as Packed</Text>
          </TouchableOpacity>

          <View style={styles.tipCard}>
            <WarehouseIcon width={22} height={22} stroke={colors.accentGreen} />
            <Text style={styles.tipText}>
              Tip: Use strong packaging to avoid{'\n'}damage during transit.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
  },
  headerTitle: { fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.bold, color: colors.textPrimary, textAlign: 'center' },
  headerSubtitle: { fontSize: typography.fontSize.xs, color: colors.textMuted, textAlign: 'center', marginTop: 2 },
  content: { paddingHorizontal: spacing.xl, paddingTop: spacing.md },
  stepLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
    textAlign: 'right',
    marginBottom: spacing.lg,
  },
  checklistRow: { flexDirection: 'row' },
  checklistLeft: { alignItems: 'center', width: 28 },
  statusCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusCircleDone: { backgroundColor: colors.accentGreen, borderColor: colors.accentGreen },
  statusCircleActive: { borderColor: colors.primary, backgroundColor: colors.surface },
  connector: { flex: 1, width: 2, backgroundColor: colors.border, marginVertical: 2, minHeight: 24 },
  checklistCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginLeft: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  checklistCardActive: {
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  checklistTitle: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
  checklistSubtitle: { fontSize: typography.fontSize.xs, color: colors.textMuted, marginTop: 2 },
  primaryButton: {
    backgroundColor: colors.primary,
    height: 52,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  primaryButtonText: { color: colors.surface, fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.bold },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accentGreenLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  tipText: {
    flex: 1,
    marginLeft: spacing.md,
    fontSize: typography.fontSize.xs,
    color: colors.textPrimary,
    lineHeight: 17,
  },
});

export default PackingScreen;
