import React from 'react';
import { StyleSheet, Text, Switch, TouchableOpacity, View } from 'react-native';
import { colors, borderRadius, spacing, typography, shadows } from '../../theme';
import { Transaction, Review, Offer, AppNotification } from '../../types';

// ==========================================
// TRANSACTION CARD
// ==========================================
interface TransactionCardProps {
  transaction: Transaction;
}

export const TransactionCard: React.FC<TransactionCardProps> = ({ transaction }) => {
  const isCredit = transaction.type === 'CREDIT';
  
  return (
    <View style={styles.transCard}>
      <View style={styles.transLeft}>
        <View style={[styles.transIconBox, { backgroundColor: isCredit ? colors.successLight : colors.dangerLight }]}>
          <Text style={styles.transIconEmoji}>{isCredit ? '➕' : '➖'}</Text>
        </View>
        <View style={styles.transDetails}>
          <Text numberOfLines={1} style={styles.transDesc}>{transaction.description}</Text>
          <Text style={styles.transTime}>
            {new Date(transaction.createdAt).toLocaleDateString()} at {new Date(transaction.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
      <Text style={[styles.transAmount, { color: isCredit ? colors.success : colors.danger }]}>
        {isCredit ? '+' : '-'} ₹{transaction.amount}
      </Text>
    </View>
  );
};

// ==========================================
// REVIEW CARD
// ==========================================
interface ReviewCardProps {
  review: Review;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({ review }) => {
  return (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <Text style={styles.revUser}>{review.customerName}</Text>
        <View style={styles.starsRow}>
          {[...Array(5)].map((_, i) => (
            <Text
              key={i}
              style={[styles.starEmoji, { color: i < review.rating ? colors.warning : colors.borderDark }]}
            >
              ★
            </Text>
          ))}
        </View>
      </View>
      <Text style={styles.revComment}>{review.comment}</Text>
      <Text style={styles.revTime}>{new Date(review.createdAt).toLocaleDateString()}</Text>
    </View>
  );
};

// ==========================================
// OFFER CARD
// ==========================================
interface OfferCardProps {
  offer: Offer;
  onToggleActive: (val: boolean) => void;
}

export const OfferCard: React.FC<OfferCardProps> = ({ offer, onToggleActive }) => {
  return (
    <View style={styles.offerCard}>
      <View style={styles.offerLeft}>
        <View style={styles.codeBadge}>
          <Text style={styles.codeText}>{offer.code}</Text>
        </View>
        <Text style={styles.offerDesc}>{offer.description}</Text>
      </View>
      <Switch
        value={offer.active}
        onValueChange={onToggleActive}
        trackColor={{ false: colors.borderDark, true: colors.primaryLight }}
        thumbColor={offer.active ? colors.primary : colors.textMuted}
      />
    </View>
  );
};

// ==========================================
// NOTIFICATION CARD
// ==========================================
interface NotificationCardProps {
  notification: AppNotification;
  onPress: () => void;
}

export const NotificationCard: React.FC<NotificationCardProps> = ({
  notification,
  onPress,
}) => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'NEW_ORDER': return '📥';
      case 'RIDER_ASSIGNED': return '🚴';
      case 'PAYMENT_RECEIVED': return '💵';
      case 'LOW_STOCK': return '⚠️';
      case 'OFFER_ACTIVATED': return '🎁';
      default: return '🔔';
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      style={[styles.notifCard, !notification.read && styles.unreadNotif]}
      onPress={onPress}
    >
      <View style={styles.notifIconBox}>
        <Text style={styles.notifEmoji}>{getIcon(notification.type)}</Text>
      </View>
      <View style={styles.notifText}>
        <Text style={styles.notifTitle}>{notification.title}</Text>
        <Text style={styles.notifMsg}>{notification.message}</Text>
        <Text style={styles.notifTime}>
          {new Date(notification.createdAt).toLocaleDateString()}
        </Text>
      </View>
      {!notification.read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );
};

// ==========================================
// PROFILE MENU ITEM
// ==========================================
interface ProfileMenuItemProps {
  emoji: string;
  label: string;
  onPress: () => void;
}

export const ProfileMenuItem: React.FC<ProfileMenuItemProps> = ({
  emoji,
  label,
  onPress,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      style={styles.profileItem}
      onPress={onPress}
    >
      <View style={styles.profileItemLeft}>
        <Text style={styles.itemEmoji}>{emoji}</Text>
        <Text style={styles.itemLabel}>{label}</Text>
      </View>
      <Text style={styles.itemArrow}>▶</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  transCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  transLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transIconBox: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  transIconEmoji: {
    fontSize: 14,
  },
  transDetails: {
    flex: 1,
  },
  transDesc: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  transTime: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
  },
  transAmount: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.black,
    marginLeft: spacing.md,
  },

  // ReviewCard
  reviewCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  revUser: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  starsRow: {
    flexDirection: 'row',
  },
  starEmoji: {
    fontSize: 14,
    marginHorizontal: 1,
  },
  revComment: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    lineHeight: 18,
  },
  revTime: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },

  // OfferCard
  offerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  offerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.md,
  },
  codeBadge: {
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    borderRadius: borderRadius.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    marginRight: spacing.md,
  },
  codeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.black,
    color: colors.primary,
  },
  offerDesc: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
    flex: 1,
  },

  // NotificationCard
  notifCard: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    ...shadows.sm,
    position: 'relative',
  },
  unreadNotif: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(37, 99, 235, 0.02)',
  },
  notifIconBox: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  notifEmoji: {
    fontSize: 18,
  },
  notifText: {
    flex: 1,
  },
  notifTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  notifMsg: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  notifTime: {
    fontSize: 9,
    color: colors.textMuted,
    marginTop: 4,
  },
  unreadDot: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 8,
    height: 8,
    borderRadius: borderRadius.round,
    backgroundColor: colors.primary,
  },

  // ProfileMenuItem
  profileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  profileItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemEmoji: {
    fontSize: 18,
    marginRight: spacing.md,
  },
  itemLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  itemArrow: {
    fontSize: 10,
    color: colors.textMuted,
  },
});
