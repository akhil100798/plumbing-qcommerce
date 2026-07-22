import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Alert,
  TouchableOpacity,
  SafeAreaView,
  Platform,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { useDispatch, useSelector } from 'react-redux';

import { AppHeader } from '../../components/common/AppHeader';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { jobService } from '../../services/jobs/jobService';
import { clearJobState } from '../../redux/slices/jobSlice';
import { clearMaterialState } from '../../redux/slices/materialSlice';
import { addCompletedJobEarnings } from '../../redux/slices/earningsSlice';
import { addTransaction } from '../../redux/slices/walletSlice';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme';
import { AppStackParamList } from '../../types/navigation';
import { RootState } from '../../redux/store';
import CheckIcon from '../../assets/icons/success-check.svg';
import StarIcon from '../../assets/icons/star.svg';
import SignatureIcon from '../../assets/icons/signature.svg';

type Props = StackScreenProps<AppStackParamList, 'CompleteService'>;

const CONFETTI_COLORS = [colors.warning, colors.primary, colors.error, colors.success, '#8E5CE8'];

function Confetti() {
  const pieces = Array.from({ length: 14 });
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {pieces.map((_, i) => {
        const left = `${(i * 37) % 100}%` as any;
        const top = `${(i * 23) % 70}%` as any;
        const size = 6 + (i % 3) * 3;
        const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
        const shape = i % 2 === 0 ? size / 2 : 2;
        return (
          <View
            key={i}
            style={{
              position: 'absolute',
              left,
              top,
              width: size,
              height: size,
              borderRadius: shape,
              backgroundColor: color,
              opacity: 0.9,
              transform: [{ rotate: `${i * 25}deg` }],
            }}
          />
        );
      })}
    </View>
  );
}

function StarRating({ rating = 5, max = 5 }: { rating?: number; max?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 4 }}>
      {Array.from({ length: max }).map((_, i) => (
        <StarIcon
          key={i}
          width={22}
          height={22}
          fill={i < rating ? colors.warning : 'none'}
          stroke={colors.warning}
        />
      ))}
    </View>
  );
}

export function CompleteServiceScreen({ route, navigation }: Props) {
  const dispatch = useDispatch();
  const { jobId } = route.params;

  const { activeJob } = useSelector((state: RootState) => state.job);
  const { totalAmount: materialCost } = useSelector((state: RootState) => state.material);

  const [signed, setSigned] = useState(true);
  const [loading, setLoading] = useState(false);

  const serviceCharge = activeJob?.estimatedEarnings || 299;
  const partsCharge = materialCost || 0;
  const totalAmount = serviceCharge + partsCharge;
  const customerFeedback = 'Excellent work, very professional!';

  const handleCompleteJob = async () => {
    if (!signed) {
      Alert.alert('Signature Required', 'Please ask customer to sign to approve completion.');
      return;
    }

    setLoading(true);
    try {
      await jobService.completeJob(jobId, partsCharge);
    } catch (error) {
      console.warn('Staging backend completeJob failed, falling back to local dispatch:', error);
    }

    const serviceCom = Math.round(serviceCharge * 0.85);
    const materialCom = Math.round(partsCharge * 0.10);
    const tip = 50;
    
    dispatch(
      addCompletedJobEarnings({
        service: serviceCom,
        material: materialCom,
        tip: tip,
      })
    );

    dispatch(
      addTransaction({
        id: `TXN${Math.floor(Math.random() * 100000)}`,
        type: 'CREDIT',
        amount: serviceCom + materialCom + tip,
        description: `Job Payment for #${jobId}`,
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        referenceId: jobId,
      })
    );

    dispatch(clearJobState());
    dispatch(clearMaterialState());

    setLoading(false);

    Alert.alert(
      'Job Completed!',
      `Service completed successfully. Total amount of ₹${totalAmount} collected.`,
      [
        {
          text: 'View Earnings',
          onPress: () => {
            navigation.replace('Earnings');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.hero}>
        <Confetti />
        <AppHeader
          title="Job Completed"
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.checkCircle}>
          <CheckIcon width={40} height={40} stroke="#FFFFFF" />
        </View>
        <Text style={styles.greatJob}>Great Job!</Text>
        <Text style={styles.heroSubtitle}>Service completed successfully.</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollBody}>
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Customer Feedback</Text>
          <StarRating rating={5} />
          <Text style={styles.feedbackText}>{customerFeedback}</Text>

          <View style={styles.divider} />

          <View style={styles.billingRow}>
            <Text style={styles.billingLabel}>Service Charge</Text>
            <Text style={styles.billingVal}>₹{serviceCharge}</Text>
          </View>
          <View style={styles.billingRow}>
            <Text style={styles.billingLabel}>Material Charge</Text>
            <Text style={styles.billingVal}>₹{partsCharge}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.amountRow}>
            <Text style={styles.totalLabel}>Amount Collected</Text>
            <Text style={styles.amountValue}>₹{totalAmount}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Customer Signature</Text>
          <TouchableOpacity
            style={styles.signatureCard}
            onPress={() => setSigned(true)}
          >
            {signed ? (
              <View style={styles.signedContainer}>
                <Text style={styles.signatureText}>Akhil Verma</Text>
                <Text style={styles.signatureSub}>Signed on phone screen</Text>
              </View>
            ) : (
              <View style={styles.unsignedContainer}>
                <SignatureIcon width={24} height={24} stroke={colors.primary} />
                <Text style={styles.signPrompt}>Tap to sign</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton
          title="Complete & Finish"
          onPress={handleCompleteJob}
          loading={loading}
          style={styles.completeButton}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  hero: {
    backgroundColor: colors.success,
    paddingBottom: spacing.xl,
    alignItems: 'center',
    borderBottomLeftRadius: borderRadius.lg,
    borderBottomRightRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  checkCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  greatJob: { fontSize: 22, fontWeight: typography.fontWeight.black, color: '#FFFFFF', marginTop: spacing.sm },
  heroSubtitle: { fontSize: typography.fontSize.sm, color: 'rgba(255,255,255,0.9)', marginTop: 2 },
  scrollBody: { padding: spacing.md, paddingBottom: spacing.xl },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  sectionLabel: { fontSize: typography.fontSize.xs, color: colors.textSecondary, marginBottom: spacing.xs, fontWeight: typography.fontWeight.bold, textTransform: 'uppercase' },
  feedbackText: { fontSize: typography.fontSize.sm, color: colors.textPrimary, marginTop: spacing.xs },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.md },
  billingRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 2 },
  billingLabel: { fontSize: typography.fontSize.xs, color: colors.textSecondary },
  billingVal: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
  amountRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
  amountValue: { fontSize: 24, fontWeight: typography.fontWeight.black, color: colors.textPrimary },
  signatureCard: {
    height: 100,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.borderDark,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  signedContainer: { alignItems: 'center' },
  signatureText: { fontSize: 26, fontStyle: 'italic', fontWeight: 'bold', color: colors.textPrimary },
  signatureSub: { fontSize: 10, color: colors.textMuted, marginTop: 2 },
  unsignedContainer: { alignItems: 'center', gap: 4 },
  signPrompt: { fontSize: typography.fontSize.xs, color: colors.primary, fontWeight: typography.fontWeight.bold },
  footer: { padding: spacing.md, marginTop: 'auto' },
  completeButton: {
    backgroundColor: colors.success,
  },
});
