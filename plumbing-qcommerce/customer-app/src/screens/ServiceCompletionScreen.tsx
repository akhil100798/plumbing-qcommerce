import { StackScreenProps } from '@react-navigation/stack';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { RatingCard } from '../components/cards/RatingCard';
import { PrimaryButton } from '../components/common/PrimaryButton';
import { OrderRepository } from '../services/orders/orderRepository';
import { borderRadius, colors, spacing, typography } from '../theme';
import { AppStackParamList } from '../types/navigation';

type Props = StackScreenProps<AppStackParamList, 'ServiceCompletion'>;

export function ServiceCompletionScreen({ route, navigation }: Props) {
  const { orderId, plumberName } = route.params;
  const [rating, setRating] = useState(5);
  const [tip, setTip] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [alreadyCompleted, setAlreadyCompleted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const displayPlumberName = plumberName || 'your plumber';

  useEffect(() => {
    let cancelled = false;
    if (orderId && Number.isSafeInteger(orderId)) {
      OrderRepository.getServiceRating(orderId)
        .then((existingRating) => {
          if (!cancelled && existingRating && existingRating.rating) {
            setRating(existingRating.rating);
            if (existingRating.comment) {
              setComment(existingRating.comment);
            }
            setAlreadyCompleted(true);
          }
        })
        .catch(() => {
          // No rating exists yet; proceed with normal submission flow
        });
    }
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  const handleDone = async () => {
    if (alreadyCompleted) {
      navigation.navigate('Main');
      return;
    }

    if (!orderId || !Number.isSafeInteger(orderId)) {
      Alert.alert('Error', 'Missing valid service order identifier.');
      return;
    }

    if (rating < 1 || rating > 5) {
      Alert.alert('Validation Error', 'Please select a rating between 1 and 5 stars.');
      return;
    }

    if (comment.length > 1000) {
      Alert.alert('Validation Error', 'Comments cannot exceed 1000 characters.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      await OrderRepository.submitServiceRating(orderId, rating, comment);
      setAlreadyCompleted(true);
      Alert.alert(
        'Thank You!',
        'Your service completion and feedback have been successfully submitted.',
        [
          {
            text: 'Done',
            onPress: () => navigation.navigate('Main'),
          },
        ]
      );
    } catch (err: any) {
      const status = err?.response?.status;
      const message =
        err?.response?.data?.message || err?.message || 'Failed to submit service completion';

      if (status === 409) {
        setAlreadyCompleted(true);
        Alert.alert(
          'Already Submitted',
          'This service order has already been rated and confirmed.',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('Main'),
            },
          ]
        );
      } else {
        setErrorMessage(message);
        Alert.alert('Submission Error', message);
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
              <Text style={styles.checkEmoji}>✓</Text>
            </View>
            <Text style={styles.successTitle}>Service Completed!</Text>
            <Text style={styles.successSub}>
              Your plumbing issue has been successfully resolved by {displayPlumberName}.
            </Text>
          </View>

          {alreadyCompleted && (
            <View style={styles.completedNotice}>
              <Text style={styles.completedTitle}>Service Confirmed</Text>
              <Text style={styles.completedText}>
                This service order has already been confirmed and rated. Thank you for your feedback!
              </Text>
            </View>
          )}

          {errorMessage && (
            <View style={styles.errorNotice}>
              <Text style={styles.errorTitle}>Submission Issue</Text>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          <RatingCard
            rating={rating}
            onRatingChange={alreadyCompleted ? () => {} : setRating}
            selectedTip={tip}
            onTipChange={alreadyCompleted ? () => {} : setTip}
          />

          <View style={styles.feedbackSection}>
            <Text style={styles.feedbackTitle}>Any additional comments?</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Tell us what went well or how we can improve..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={4}
              maxLength={1000}
              editable={!alreadyCompleted && !loading}
              value={comment}
              onChangeText={setComment}
            />
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <PrimaryButton
            title={alreadyCompleted ? 'Done' : 'Submit & Finish'}
            onPress={handleDone}
            loading={loading}
            style={styles.submitBtn}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  keyboardView: { flex: 1 },
  scrollContent: { padding: spacing.layout, paddingBottom: spacing.huge },
  successHeader: { alignItems: 'center', marginVertical: spacing.huge },
  successBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.successLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  checkEmoji: { fontSize: 36, color: colors.success },
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
    lineHeight: 20,
    paddingHorizontal: spacing.sm,
  },
  completedNotice: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.success,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  completedTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.success,
    marginBottom: spacing.xs,
  },
  completedText: { fontSize: typography.fontSize.xs, color: colors.textSecondary },
  errorNotice: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: colors.error,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.error,
    marginBottom: spacing.xs,
  },
  errorText: { fontSize: typography.fontSize.xs, color: colors.error },
  feedbackSection: { marginTop: spacing.lg },
  feedbackTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  textInput: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
    textAlignVertical: 'top',
    minHeight: 100,
  },
  footer: {
    padding: spacing.layout,
    borderTopWidth: 1.5,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  submitBtn: { width: '100%' },
});
