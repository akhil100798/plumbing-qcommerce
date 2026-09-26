import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { borderRadius, colors, shadows, spacing, typography } from '../../theme';

interface TrackingCardProps {
  eta: string;
  statusText: string;
  partnerName: string;
  onCall: () => void;
  onChat: () => void;
}

export function TrackingCard({
  eta,
  statusText,
  partnerName,
  onCall,
  onChat,
}: TrackingCardProps) {
  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <View style={styles.etaCircle}>
          <Text style={styles.etaVal}>{eta}</Text>
          <Text style={styles.etaUnit}>ETA</Text>
        </View>
        <View style={styles.copy}>
          <Text style={styles.status}>{statusText}</Text>
          <Text style={styles.partner}>{partnerName} • Partner</Text>
        </View>
      </View>

      <View style={styles.right}>
        <TouchableOpacity style={styles.actionBtn} onPress={onCall}>
          <Text style={styles.actionEmoji}>📞</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={onChat}>
          <Text style={styles.actionEmoji}>💬</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    justifyContent: 'space-between',
    alignItems: 'center',
    ...shadows.sm,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  etaCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  etaVal: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.black,
    color: colors.primary,
  },
  etaUnit: {
    fontSize: 8,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
    textTransform: 'uppercase',
  },
  copy: {
    flex: 1,
  },
  status: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  partner: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
    marginTop: 2,
  },
  right: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background,
    borderWidth: 1.5,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionEmoji: {
    fontSize: 16,
  },
});
