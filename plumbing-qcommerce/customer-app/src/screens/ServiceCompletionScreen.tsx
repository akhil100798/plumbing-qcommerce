import { StackScreenProps } from '@react-navigation/stack';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { RatingCard } from '../components/cards/RatingCard';
import { PrimaryButton } from '../components/common/PrimaryButton';
import { canUseDevMockFallbacks } from '../services/mockPolicy';
import { borderRadius, colors, spacing, typography } from '../theme';
import { AppStackParamList } from '../types/navigation';

type Props = StackScreenProps<AppStackParamList, 'ServiceCompletion'>;

export function ServiceCompletionScreen({ route, navigation }: Props) {
  const { plumberName } = route.params;
  const [rating, setRating] = useState(5);
  const [tip, setTip] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const devMode = canUseDevMockFallbacks();

  const handleDone = () => {
    if (!devMode) {
      Alert.alert('Feature unavailable', 'Service completion submission is not available in staging.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigation.navigate('Main');
    }, 1000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.successHeader}>
            <View style={styles.successBadge}><Text style={styles.checkEmoji}>??</Text></View>
            <Text style={styles.successTitle}>Service Completed!</Text>
            <Text style={styles.successSub}>Your plumbing issue has been successfully resolved by {plumberName}.</Text>
          </View>

          {!devMode && (
            <View style={styles.noticeCard}><Text style={styles.noticeTitle}>Staging limitation</Text><Text style={styles.noticeText}>Ratings, tips, and service completion submission stay disabled until the live completion API is available.</Text></View>
          )}

          <RatingCard rating={rating} onRatingChange={setRating} selectedTip={tip} onTipChange={setTip} />

          <View style={styles.feedbackSection}>
            <Text style={styles.feedbackTitle}>Any additional comments?</Text>
            <TextInput style={styles.textInput} placeholder="Tell us what went well or how we can improve..." placeholderTextColor={colors.textMuted} multiline numberOfLines={4} value={comment} onChangeText={setComment} />
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <PrimaryButton title={devMode ? 'Submit & Finish' : 'Submission unavailable in staging'} onPress={handleDone} loading={loading} style={styles.submitBtn} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background }, keyboardView: { flex: 1 }, scrollContent: { padding: spacing.layout, paddingBottom: spacing.huge },
  successHeader: { alignItems: 'center', marginVertical: spacing.huge }, successBadge: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.successLight, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.md },
  checkEmoji: { fontSize: 36 }, successTitle: { fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.black, color: colors.textPrimary, textAlign: 'center' },
  successSub: { fontSize: typography.fontSize.sm, color: colors.textSecondary, textAlign: 'center', fontWeight: typography.fontWeight.medium, marginTop: spacing.xs, lineHeight: 20, paddingHorizontal: spacing.sm },
  noticeCard: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.md },
  noticeTitle: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.bold, color: colors.textPrimary, marginBottom: spacing.xs },
  noticeText: { fontSize: typography.fontSize.xs, color: colors.textSecondary },
  feedbackSection: { marginTop: spacing.lg }, feedbackTitle: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.bold, color: colors.textPrimary, marginBottom: spacing.sm },
  textInput: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border, borderRadius: borderRadius.md, padding: spacing.md, fontSize: typography.fontSize.sm, color: colors.textPrimary, textAlignVertical: 'top', minHeight: 100 },
  footer: { padding: spacing.layout, borderTopWidth: 1.5, borderTopColor: colors.border, backgroundColor: colors.surface }, submitBtn: { width: '100%' },
});
