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
import { NavigationProp, useNavigation, RouteProp, useRoute } from '@react-navigation/native';
import { AppStackParamList } from '../../types/navigation';
import { colors, borderRadius, spacing, typography, shadows } from '../../theme';
import StoreIcon from '../../components/common/StoreIcon';
import { PrimaryButton } from '../../components/common/PrimaryButton';

interface ChecklistItem {
  key: string;
  title: string;
  subtitle: string;
  done: boolean;
}

const initialChecklist: ChecklistItem[] = [
  {
    key: 'verify',
    title: 'Verify Items (5/5)',
    subtitle: 'All ordered items matched with shelf inventory',
    done: true,
  },
  {
    key: 'quality',
    title: 'Quality & Seal Check',
    subtitle: 'Zero leaks, crack inspection and threads checked',
    done: true,
  },
  {
    key: 'packaging',
    title: 'Secure Store Bag / Box',
    subtitle: 'Items grouped and packed in FixKart safety container',
    done: false,
  },
  {
    key: 'invoice',
    title: 'Attach Material Invoice',
    subtitle: 'Generate and place printed invoice in package',
    done: false,
  },
];

export function PackingScreen() {
  const navigation = useNavigation<NavigationProp<AppStackParamList>>();
  const route = useRoute<RouteProp<AppStackParamList, 'Packing'>>();
  const orderId = (route.params as any)?.orderId || '#FK123456';

  const [checklist, setChecklist] = useState<ChecklistItem[]>(initialChecklist);

  const toggleItem = (key: string) => {
    setChecklist((prev) =>
      prev.map((item) => (item.key === key ? { ...item, done: !item.done } : item))
    );
  };

  const completedCount = checklist.filter((i) => i.done).length;
  const isAllComplete = completedCount === checklist.length;
  const progressPercent = Math.round((completedCount / checklist.length) * 100);

  const handleMarkPacked = () => {
    if (!isAllComplete) {
      Alert.alert(
        'Incomplete Checklist',
        'Please verify all 4 packing checklist requirements before marking the order as ready.'
      );
      return;
    }

    Alert.alert(
      'Confirm Packing Complete',
      `Mark ${orderId} as packed and ready for plumber counter pickup?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm & Notify Plumber',
          onPress: () => {
            navigation.navigate('ReadyForPickup' as any, { orderId });
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel="Go Back"
        >
          <StoreIcon name="arrow-left" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleCol}>
          <Text style={styles.headerTitle}>Packing Checklist</Text>
          <Text style={styles.headerSubtitle}>{orderId}</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Progress Card */}
        <View style={styles.progressCard}>
          <View style={styles.progressTopRow}>
            <Text style={styles.progressTitle}>Packing Progress</Text>
            <Text style={styles.progressFraction}>
              {completedCount} of {checklist.length} Completed ({progressPercent}%)
            </Text>
          </View>
          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
          </View>
        </View>

        {/* Checklist Rows */}
        <View style={styles.checklistSection}>
          {checklist.map((item, idx) => (
            <TouchableOpacity
              key={item.key}
              style={[styles.checklistCard, item.done && styles.checklistCardDone]}
              onPress={() => toggleItem(item.key)}
              activeOpacity={0.8}
            >
              <View style={[styles.checkboxCircle, item.done && styles.checkboxCircleDone]}>
                {item.done ? (
                  <StoreIcon name="check" size={14} color="#FFFFFF" />
                ) : (
                  <Text style={styles.stepNumText}>{idx + 1}</Text>
                )}
              </View>

              <View style={styles.checkTextCol}>
                <Text style={[styles.itemTitle, item.done && styles.itemTitleDone]}>
                  {item.title}
                </Text>
                <Text style={styles.itemSubtitle}>{item.subtitle}</Text>
              </View>

              <View style={styles.stateTag}>
                <Text style={[styles.stateTagText, item.done && styles.stateTagTextDone]}>
                  {item.done ? 'COMPLETED' : 'PENDING'}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Safe Handling Operational Tip */}
        <View style={styles.tipCard}>
          <View style={styles.tipIconWrap}>
            <StoreIcon name="store" size={20} color="#1EA34A" />
          </View>
          <View style={styles.tipTextCol}>
            <Text style={styles.tipTitle}>Store Pickup Standards</Text>
            <Text style={styles.tipText}>
              Group heavy pipes and small brass fittings into separate sealed bags. Plumber will verify items at pickup desk.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Action */}
      <View style={styles.bottomBar}>
        <PrimaryButton
          title={isAllComplete ? 'Mark as Packed & Ready' : `Complete ${checklist.length - completedCount} More Checks`}
          onPress={handleMarkPacked}
          disabled={!isAllComplete}
          style={styles.submitBtn}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  header: {
    height: 56,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EAECEF',
  },
  headerTitleCol: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.giant,
  },
  progressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: '#EAECEF',
    ...shadows.sm,
  },
  progressTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  progressTitle: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  progressFraction: {
    fontSize: 11,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#1EA34A',
    borderRadius: 3,
  },
  checklistSection: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  checklistCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EAECEF',
    ...shadows.sm,
  },
  checklistCardDone: {
    borderColor: '#BBF7D0',
    backgroundColor: '#FAFDFB',
  },
  checkboxCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    marginRight: spacing.md,
  },
  checkboxCircleDone: {
    backgroundColor: '#16A34A',
    borderColor: '#16A34A',
  },
  stepNumText: {
    fontSize: 12,
    fontWeight: typography.fontWeight.bold,
    color: colors.textSecondary,
  },
  checkTextCol: {
    flex: 1,
  },
  itemTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  itemTitleDone: {
    color: '#15803D',
  },
  itemSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  stateTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    marginLeft: spacing.sm,
  },
  stateTagText: {
    fontSize: 9,
    fontWeight: typography.fontWeight.bold,
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  stateTagTextDone: {
    color: '#16A34A',
    backgroundColor: '#EAF8ED',
  },
  tipCard: {
    backgroundColor: '#EAF8ED',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  tipIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipTextCol: {
    flex: 1,
  },
  tipTitle: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: '#166534',
    marginBottom: 2,
  },
  tipText: {
    fontSize: 11,
    color: '#15803D',
    lineHeight: 16,
  },
  bottomBar: {
    padding: spacing.md,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EAECEF',
    ...shadows.sm,
  },
  submitBtn: {
    height: 48,
    borderRadius: borderRadius.sm,
  },
});

export default PackingScreen;
