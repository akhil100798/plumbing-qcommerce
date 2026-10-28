import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { colors, spacing, typography } from '../../theme';
import { SvgActionsCopy, SvgStatusCheckCircle } from '../../assets/svg';

interface OfferCardProps {
  code: string;
  discountText: string;
  description: string;
  expiryText: string;
  onApply?: () => void;
  onCopy?: () => void;
}

export function OfferCard({
  code,
  discountText,
  description,
  expiryText,
  onApply,
  onCopy,
}: OfferCardProps) {
  return (
    <View style={styles.container}>
      {/* Decorative Ticket Perforation Notches */}
      <View style={styles.leftNotch} />
      <View style={styles.rightNotch} />

      <View style={styles.content}>
        <View style={styles.headerRow}>
          <View style={styles.codePill}>
            <Text style={styles.codePillText}>{code}</Text>
          </View>
          <View style={styles.verifiedRow}>
            <SvgStatusCheckCircle width={13} height={13} stroke="#059669" style={{ marginRight: 4 }} />
            <Text style={styles.verifiedLabel}>Verified Deal</Text>
          </View>
        </View>

        <Text style={styles.description}>{description}</Text>

        <View style={styles.footerRow}>
          <Text style={styles.expiry}>{expiryText}</Text>
          {onApply ? (
            <TouchableOpacity style={styles.actionBtn} onPress={onApply} activeOpacity={0.8}>
              <Text style={styles.actionBtnText}>APPLY</Text>
            </TouchableOpacity>
          ) : onCopy ? (
            <TouchableOpacity style={[styles.actionBtn, styles.copyBtn]} onPress={onCopy} activeOpacity={0.8}>
              <SvgActionsCopy width={14} height={14} stroke={colors.primary} style={{ marginRight: 4 }} />
              <Text style={styles.copyBtnText}>COPY</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    position: 'relative',
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  leftNotch: {
    position: 'absolute',
    left: -8,
    top: '46%',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    zIndex: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  rightNotch: {
    position: 'absolute',
    right: -8,
    top: '46%',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    zIndex: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  content: {
    padding: 16,
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  codePill: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  codePillText: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.primary,
    letterSpacing: 0.8,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verifiedCheck: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '900',
  },
  verifiedLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  description: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: 18,
    marginBottom: 12,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  expiry: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  actionBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  copyBtn: {
    backgroundColor: '#EFF6FF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.white,
  },
  copyBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
  },
  copyIcon: {
    fontSize: 11,
  },
});
