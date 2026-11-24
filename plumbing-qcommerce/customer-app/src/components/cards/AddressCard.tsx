import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { colors, spacing, typography } from '../../theme';
import { SvgProfileAddressHome, SvgProfileAddressOffice, SvgProfileLocationPin, SvgStatusCheckCircle } from '../../assets/svg';

interface AddressCardProps {
  id: number;
  label: string;
  name: string;
  addressLine: string;
  phone: string;
  selected: boolean;
  onSelect: () => void;
}

export function AddressCard({
  label,
  name,
  addressLine,
  phone,
  selected,
  onSelect,
}: AddressCardProps) {
  const isHome = label.toLowerCase() === 'home';
  const isOffice = label.toLowerCase() === 'office';

  return (
    <TouchableOpacity
      style={[styles.container, selected && styles.containerSelected]}
      onPress={onSelect}
      activeOpacity={0.85}
      accessibilityRole="button"
    >
      <View style={styles.header}>
        <View style={styles.labelSection}>
          <View style={[styles.iconCircle, selected && styles.iconCircleSelected]}>
            {isHome ? <SvgProfileAddressHome width={18} height={18} stroke={selected ? colors.primary : colors.textSecondary} /> : isOffice ? <SvgProfileAddressOffice width={18} height={18} stroke={selected ? colors.primary : colors.textSecondary} /> : <SvgProfileLocationPin width={18} height={18} stroke={selected ? colors.primary : colors.textSecondary} />}
          </View>
          <View>
            <View style={styles.labelTitleRow}>
              <Text style={styles.labelText}>{label}</Text>
              {selected && (
                <View style={styles.defaultBadge}>
                  <Text style={styles.defaultBadgeText}>Selected</Text>
                </View>
              )}
            </View>
            <Text style={styles.contactText}>{name} • {phone}</Text>
          </View>
        </View>

        {/* Radio Indicator */}
        <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
          {selected && <View style={styles.radioInner} />}
        </View>
      </View>

      <Text style={styles.addressLine}>{addressLine}</Text>

      <View style={styles.footerRow}>
        <View style={styles.serviceableBadge}>
          <SvgStatusCheckCircle width={14} height={14} stroke="#059669" style={{ marginRight: 4 }} />
          <Text style={styles.serviceableText}>Serviceable Zone (Express 45m)</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  containerSelected: {
    borderColor: colors.primary,
    backgroundColor: '#FAF8FF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  labelSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircleSelected: {
    backgroundColor: '#DBEAFE',
  },
  labelEmoji: {
    fontSize: 18,
  },
  labelTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  labelText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  defaultBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  defaultBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  contactText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: colors.primary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  addressLine: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginTop: 2,
    marginBottom: 8,
    paddingLeft: 48,
  },
  footerRow: {
    paddingLeft: 48,
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceableBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  checkmarkIcon: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
  },
  serviceableText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#059669',
  },
});
