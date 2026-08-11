import { StackScreenProps } from '@react-navigation/stack';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { RatingCard } from '../components/cards/RatingCard';
import { PrimaryButton } from '../components/common/PrimaryButton';
import { OrderRepository } from '../services/orders/orderRepository';
import { canUseDevMockFallbacks } from '../services/mockPolicy';
import { borderRadius, colors, spacing, typography } from '../theme';
import { AppStackParamList } from '../types/navigation';

type Props = StackScreenProps<AppStackParamList, 'ServiceCompletion'>;

export function ServiceCompletionScreen({ route, navigation }: Props) {
  const { plumberName } = route.params;
  const orderId = (route.params as any)?.orderId || 42;
  const [rating, setRating] = useState(5);
  const [tip, setTip] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDone = async () => {
    if (loading) return;
    setLoading(true);

    try {
      await OrderRepository.submitServiceRating({
        orderId: Number(orderId),
        rating,
        review: comment.trim() || undefined,
      });

      Alert.alert('Thank You!', 'Your rating and feedback have been submitted successfully.', [
        {
          text: 'OK',
          onPress: () => navigation.navigate('Main'),
        },
      ]);
    } catch (err: any) {
      if (canUseDevMockFallbacks()) {
        Alert.alert('Feedback Received', 'Thank you for rating your service experience!', [
          { text: 'OK', onPress: () => navigation.navigate('Main') },
        ]);
      } else {
        Alert.alert('Submission Error', err?.message || 'Could not submit rating. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.successHeader}>
            <View style={styles.successBadge}>
              <Text style={styles.checkEmoji}>✨</Text>
            </View>
            <Text style={styles.successTitle}>Service Completed!</Text>
            <Text style={styles.successSub}>
              Your plumbing job has been completed by {plumberName || 'your FixKart expert'}.
            </Text>
          </View>

          <RatingCard
            rating={rating}
            onRatingChange={setRating}
            selectedTip={tip}
            onTipChange={setTip}
          />

          <View style={styles.feedbackSection}>
            <Text style={styles.feedbackTitle}>Additional Feedback (Optional)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Tell us about the quality of service, timeliness, and technician behavior..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={4}
              value={comment}
              onChangeText={setComment}
            />
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <PrimaryButton
            title={loading ? 'Submitting Rating...' : 'Submit Rating & Finish'}
            onPress={handleDone}
            loading={loading}
            disabled={loading}
            style={styles.submitBtn}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background || '#F8F9FF',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.layout,
    paddingBottom: spacing.huge,
  },
  successHeader: {
    alignItems: 'center',
    marginVertical: spacing.xl,
  },
  successBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.surfaceContainerLow || '#EFF4FF',
    borderWidth: 1,
    borderColor: colors.border || '#C1C6D6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  checkEmoji: {
    fontSize: 32,
  },
  successTitle: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.heading,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  successSub: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontFamily: typography.fontFamily.body,
    textAlign: 'center',
    marginTop: spacing.xs,
    lineHeight: typography.lineHeight.relaxed,
    paddingHorizontal: spacing.sm,
  },
  feedbackSection: {
    marginTop: spacing.lg,
  },
  feedbackTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.body,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  textInput: {
    backgroundColor: colors.surfaceContainerLowest || '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border || '#C1C6D6',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.body,
    color: colors.textPrimary,
    textAlignVertical: 'top',
    minHeight: 100,
  },
  footer: {
    padding: spacing.layout,
    borderTopWidth: 1,
    borderTopColor: colors.border || '#C1C6D6',
    backgroundColor: colors.surfaceContainerLowest || '#FFFFFF',
  },
  submitBtn: {
    width: '100%',
  },
});
