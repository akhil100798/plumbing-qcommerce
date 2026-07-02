import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Alert,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { useDispatch, useSelector } from 'react-redux';

import { AppHeader } from '../../components/common/AppHeader';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { ScreenWrapper } from '../../components/common/ScreenWrapper';
import { jobService } from '../../services/jobs/jobService';
import { clearJobState } from '../../redux/slices/jobSlice';
import { clearMaterialState } from '../../redux/slices/materialSlice';
import { addCompletedJobEarnings } from '../../redux/slices/earningsSlice';
import { addTransaction } from '../../redux/slices/walletSlice';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme';
import { AppStackParamList } from '../../types/navigation';
import { RootState } from '../../redux/store';

type Props = StackScreenProps<AppStackParamList, 'CompleteService'>;

export function CompleteServiceScreen({ route, navigation }: Props) {
  const dispatch = useDispatch();
  const { jobId } = route.params;

  // Redux state selectors
  const { activeJob } = useSelector((state: RootState) => state.job);
  const { totalAmount: materialCost } = useSelector((state: RootState) => state.material);

  const [signed, setSigned] = useState(false);
  const [loading, setLoading] = useState(false);

  const serviceCharge = activeJob?.estimatedEarnings || 299;
  const partsCharge = materialCost || 0;
  const totalAmount = serviceCharge + partsCharge;

  const handleSign = () => {
    setSigned(true);
  };

  const handleClearSignature = () => {
    setSigned(false);
  };

  const handleCompleteJob = async () => {
    if (!signed) {
      Alert.alert('Signature Required', 'Please ask the customer to sign to approve completion.');
      return;
    }

    setLoading(true);
    try {
      // 1. Post completion status to backend API
      await jobService.completeJob(jobId, partsCharge);

      // 2. Dispatch earnings update to Redux
      const serviceCom = Math.round(serviceCharge * 0.85); // 85% plumber share
      const materialCom = Math.round(partsCharge * 0.10); // 10% parts commission
      const tip = 50; // Mocked customer tip
      
      dispatch(
        addCompletedJobEarnings({
          service: serviceCom,
          material: materialCom,
          tip: tip,
        })
      );

      // 3. Dispatch wallet transaction credit
      dispatch(
        addTransaction({
          id: `TXN${Math.floor(Math.random() * 100000)}`,
          type: 'CREDIT',
          amount: serviceCom + materialCom + tip,
          description: `Payout for Job #${jobId} Completion`,
          createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          referenceId: jobId,
        })
      );

      // 4. Clear job flow memory state
      dispatch(clearJobState());
      dispatch(clearMaterialState());

      setLoading(false);

      Alert.alert(
        'Job Completed!',
        `Service has been finalized. Earnings of ₹${serviceCom + materialCom + tip} credited to your wallet.`,
        [
          {
            text: 'Return to Dashboard',
            onPress: () => {
              navigation.replace('Main');
            },
          },
        ]
      );
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', 'Failed to complete job request. Please try again.');
    }
  };

  return (
    <ScreenWrapper>
      <AppHeader title="Complete Service" onBackPress={() => navigation.goBack()} />
      
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Service Summary</Text>
          
          <View style={styles.billingRow}>
            <Text style={styles.billingLabel}>Service Charge</Text>
            <Text style={styles.billingValue}>₹{serviceCharge}</Text>
          </View>
          
          <View style={styles.billingRow}>
            <Text style={styles.billingLabel}>Material Cost</Text>
            <Text style={styles.billingValue}>₹{partsCharge}</Text>
          </View>

          <View style={styles.divider} />

          <View style={[styles.billingRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>₹{totalAmount}</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Customer Signature / Approval</Text>
        
        <View style={styles.signatureCard}>
          {signed ? (
            <View style={styles.signatureContainer}>
              {/* Premium signature representation */}
              <Text style={styles.signatureText}>Akhil Verma</Text>
              <Text style={styles.signatureMeta}>Signed via Phone screen</Text>
              
              <TouchableOpacity style={styles.clearBtn} onPress={handleClearSignature}>
                <Text style={styles.clearText}>Clear Signature ✕</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.signaturePlaceholder} onPress={handleSign}>
              <Text style={styles.signIcon}>✍️</Text>
              <Text style={styles.signPromptText}>Tap here to sign customer name</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.spacer} />

        <PrimaryButton
          title="Complete Job"
          onPress={handleCompleteJob}
          loading={loading}
          style={styles.completeBtn}
        />
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.layout,
    paddingBottom: spacing.huge,
    flexGrow: 1,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  sectionLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  billingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  billingLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },
  billingValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  totalRow: {
    paddingVertical: 0,
  },
  totalLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  totalValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.black,
    color: colors.primary,
  },
  signatureCard: {
    height: 160,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.borderDark,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: spacing.xl,
    ...shadows.sm,
  },
  signaturePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  signIcon: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  signPromptText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.semibold,
  },
  signatureContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    position: 'relative',
  },
  signatureText: {
    fontFamily: Platform.OS === 'ios' ? 'Snell Roundhand' : 'System',
    fontStyle: 'italic',
    fontSize: 36,
    color: '#0F172A',
    fontWeight: 'bold',
  },
  signatureMeta: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 6,
  },
  clearBtn: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
  },
  clearText: {
    fontSize: 11,
    color: colors.error,
    fontWeight: 'bold',
  },
  spacer: {
    flex: 1,
  },
  completeBtn: {
    backgroundColor: colors.success,
  },
});
