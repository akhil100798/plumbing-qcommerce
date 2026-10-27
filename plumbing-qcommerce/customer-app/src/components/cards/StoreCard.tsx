import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { colors, spacing, typography } from '../../theme';
import { SvgEcommerceStore, SvgNavigationArrowRight, SvgStatusCheckVerified, SvgStatusLightning, SvgStatusStarFilled } from '../../assets/svg';

interface StoreCardProps {
  id: number;
  name: string;
  distance: string;
  duration: string;
  address?: string;
  rating?: number;
  tags?: string[];
  isOpen?: boolean;
  onPress: () => void;
}

export function StoreCard({
  name,
  distance,
  duration,
  address,
  rating = 4.8,
  tags = ['CPVC Pipes', 'Brass Valves', 'Fittings'],
  isOpen = true,
  onPress,
}: StoreCardProps) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.88}
      accessibilityRole="button"
      accessibilityLabel={`View store ${name}`}
    >
      <View style={styles.topRow}>
        <View style={styles.hubIconContainer}>
          <SvgEcommerceStore width={22} height={22} stroke={colors.primary} />
        </View>

        <View style={styles.headerInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>
              {name}
            </Text>
            <View style={styles.verifiedBadge}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}><SvgStatusCheckVerified width={12} height={12} stroke="#059669" style={{ marginRight: 3 }} /><Text style={styles.verifiedText}>Verified</Text></View>
            </View>
          </View>

          {address ? (
            <Text style={styles.addressText} numberOfLines={1}>
              {address}
            </Text>
          ) : null}

          <View style={styles.metaRow}>
            <View style={styles.etaBadge}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}><SvgStatusLightning width={12} height={12} fill="#D97706" style={{ marginRight: 3 }} /><Text style={styles.etaText}>{duration} dispatch</Text></View>
            </View>
            <Text style={styles.distanceDot}>•</Text>
            <Text style={styles.distanceText}>{distance} away</Text>
            <Text style={styles.distanceDot}>•</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}><SvgStatusStarFilled width={12} height={12} fill="#F59E0B" stroke="#F59E0B" style={{ marginRight: 3 }} /><Text style={styles.ratingText}>{rating}</Text></View>
          </View>
        </View>
      </View>

      {/* Spares / Inventory tags */}
      <View style={styles.tagRow}>
        {tags.map((tag, idx) => (
          <View key={idx} style={styles.tagPill}>
            <Text style={styles.tagText}>{tag}</Text>
          </View>
        ))}
      </View>

      {/* Card Footer Bar */}
      <View style={styles.footerRow}>
        <View style={styles.statusIndicator}>
          <View style={[styles.statusDot, isOpen ? styles.dotOpen : styles.dotClosed]} />
          <Text style={styles.statusLabel}>{isOpen ? 'Open Now' : 'Closed'}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}><Text style={styles.ctaText}>Browse Hub Inventory</Text><SvgNavigationArrowRight width={14} height={14} stroke={colors.primary} style={{ marginLeft: 4 }} /></View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  hubIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  hubIconText: {
    fontSize: 24,
  },
  headerInfo: {
    flex: 1,
    minWidth: 0,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
  },
  verifiedBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
  },
  addressText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    flexWrap: 'wrap',
  },
  etaBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  etaText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
  },
  distanceDot: {
    fontSize: 10,
    color: '#94A3B8',
  },
  distanceText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#475569',
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  tagPill: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tagText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '500',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingTop: spacing.xs,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  dotOpen: {
    backgroundColor: '#10B981',
  },
  dotClosed: {
    backgroundColor: '#94A3B8',
  },
  statusLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  ctaText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
  },
});
