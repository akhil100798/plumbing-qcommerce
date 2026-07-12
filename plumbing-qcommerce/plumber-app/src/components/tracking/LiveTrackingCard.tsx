import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { borderRadius, colors, shadows, spacing, typography } from '../../theme';
import { AppIcon } from '../common/AppIcon';
import PhoneIcon from '../../assets/icons/phone.svg';
import ChatIcon from '../../assets/icons/chat.svg';
import StarIcon from '../../assets/icons/star.svg';
import { AnimatedIconButton } from '../common/AnimatedIconButton';
import { EtaBadge } from './EtaBadge';

interface LiveTrackingCardProps {
  eta: string;
  name: string;
  role: string;
  rating?: string;
  statusText: string;
  onCallPress: () => void;
  onChatPress: () => void;
  style?: any;
}

export function LiveTrackingCard({
  eta,
  name,
  role,
  rating = '4.8',
  statusText,
  onCallPress,
  onChatPress,
  style,
}: LiveTrackingCardProps) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <EtaBadge timeText={eta} />
        <Text style={styles.status}>{statusText}</Text>
      </View>

      <View style={styles.profileRow}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>{name.charAt(0)}</Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.role}>{role}</Text>
        </View>
        {rating && (
          <View style={styles.ratingBadge}>
            <AppIcon icon={StarIcon} size={10} color="#F59E0B" />
            <Text style={styles.ratingText}>{rating}</Text>
          </View>
        )}
      </View>

      <View style={styles.actionRow}>
        <AnimatedIconButton
          onPress={onChatPress}
          style={styles.chatBtn}
          accessibilityLabel="Chat with partner"
        >
          <View style={styles.btnContent}>
            <AppIcon icon={ChatIcon} size={16} color={colors.primary} />
            <Text style={styles.chatText}>Chat</Text>
          </View>
        </AnimatedIconButton>

        <AnimatedIconButton
          onPress={onCallPress}
          style={styles.callBtn}
          accessibilityLabel="Call partner"
        >
          <View style={styles.btnContent}>
            <AppIcon icon={PhoneIcon} size={16} color="#FFFFFF" />
            <Text style={styles.callText}>Call</Text>
          </View>
        </AnimatedIconButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.md,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  status: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  role: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warningLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.sm,
  },
  ratingText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.warning,
    marginLeft: 3,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  chatBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: borderRadius.md,
    height: 44,
    padding: 0,
    backgroundColor: '#FFFFFF',
  },
  callBtn: {
    flex: 1,
    borderRadius: borderRadius.md,
    height: 44,
    padding: 0,
    backgroundColor: colors.primary,
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatText: {
    color: colors.primary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    marginLeft: spacing.xs,
  },
  callText: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    marginLeft: spacing.xs,
  },
});
