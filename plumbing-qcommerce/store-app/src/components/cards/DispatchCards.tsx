import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, borderRadius, spacing, typography, shadows } from '../../theme';
import { Rider, MaterialRequest } from '../../types';
import RiderIcon from '../../assets/icons/rider.svg';
import StarIcon from '../../assets/icons/star.svg';

// ==========================================
// RIDER CARD
// ==========================================
interface RiderCardProps {
  rider: Rider;
  selected: boolean;
  onSelect: () => void;
}

export const RiderCard: React.FC<RiderCardProps> = ({
  rider,
  selected,
  onSelect,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      style={[styles.riderCard, selected && styles.selectedRiderCard]}
      onPress={onSelect}
    >
      <View style={styles.riderLeft}>
        <View style={styles.riderAvatar}>
          <RiderIcon width={18} height={18} stroke={colors.primary} />
        </View>
        <View style={styles.riderDetails}>
          <Text style={styles.riderName}>{rider.fullName}</Text>
          <View style={styles.ratingRow}>
            <StarIcon width={10} height={10} fill={colors.warning} stroke={colors.warning} style={{ marginRight: 2 }} />
            <Text style={styles.ratingVal}>{rider.rating}</Text>
            <Text style={styles.vehicleNum}> • {rider.vehicleNumber}</Text>
          </View>
          <Text style={styles.riderEta}>{rider.eta || 'Nearby'}</Text>
        </View>
      </View>
      <View style={[styles.radioButton, selected && styles.checkedRadio]}>
        {selected && <View style={styles.radioInner} />}
      </View>
    </TouchableOpacity>
  );
};

// ==========================================
// MATERIAL REQUEST CARD
// ==========================================
interface MaterialRequestCardProps {
  request: MaterialRequest;
  onPressAction: () => void;
  actionTitle: string;
}

export const MaterialRequestCard: React.FC<MaterialRequestCardProps> = ({
  request,
  onPressAction,
  actionTitle,
}) => {
  const itemsText = request.items.map(i => `${i.productName} (x${i.quantity})`).join(', ');

  const getPlumberInitials = (name?: string) => {
    if (!name) return 'P';
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <View style={styles.requestCard}>
      <View style={styles.requestHeader}>
        <View style={styles.plumberInfo}>
          <View style={styles.plumberAvatar}>
            <Text style={styles.plumberAvatarText}>{getPlumberInitials(request.plumberName)}</Text>
          </View>
          <View>
            <Text style={styles.plumberName}>{request.plumberName}</Text>
            <Text style={styles.plumberSub}>Mid-Job Request</Text>
          </View>
        </View>
        <Text style={styles.requestAmount}>₹{request.totalAmount}</Text>
      </View>

      <Text numberOfLines={2} style={styles.requestItems}>
        {itemsText}
      </Text>

      <View style={styles.requestFooter}>
        <Text style={styles.requestStatus}>Status: {request.status}</Text>
        {request.status === 'PENDING' && (
          <TouchableOpacity
            style={styles.requestAction}
            onPress={onPressAction}
          >
            <Text style={styles.requestActionText}>{actionTitle}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  riderCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  selectedRiderCard: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(37, 99, 235, 0.03)',
  },
  riderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  riderAvatar: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.round,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    fontSize: 20,
  },
  riderDetails: {
    flex: 1,
  },
  riderName: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  ratingStar: {
    color: colors.warning,
    fontSize: 12,
    marginRight: 2,
  },
  ratingVal: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  vehicleNum: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  riderEta: {
    fontSize: typography.fontSize.xs,
    color: colors.primary,
    fontWeight: typography.fontWeight.medium,
    marginTop: 2,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: borderRadius.round,
    borderWidth: 2,
    borderColor: colors.textMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkedRadio: {
    borderColor: colors.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: borderRadius.round,
    backgroundColor: colors.primary,
  },

  // MaterialRequestCard
  requestCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.sm,
  },
  plumberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  plumberAvatar: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.round,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  plumberAvatarText: {
    fontSize: 16,
  },
  plumberName: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  plumberSub: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 1,
  },
  requestAmount: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.black,
    color: colors.textPrimary,
  },
  requestItems: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginVertical: spacing.md,
  },
  requestFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  requestStatus: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },
  requestAction: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    height: 32,
    borderRadius: borderRadius.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  requestActionText: {
    color: colors.card,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
});
