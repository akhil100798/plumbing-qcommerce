import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { AppStackParamList } from '../../types/navigation';
import ArrowLeftIcon from '../../assets/icons/arrow-left.svg';
import ProfileIcon from '../../assets/icons/profile.svg';
import StarIcon from '../../assets/icons/star.svg';
import { colors, borderRadius, spacing, typography } from '../../theme';

const mockRiders = [
  { id: '1', name: 'Amit Yadav', rating: '4.8', orders: '320 Orders', distance: '2.1 km away' },
  { id: '2', name: 'Suresh Powar', rating: '4.6', orders: '210 Orders', distance: '3.4 km away' },
  { id: '3', name: 'Imran Khan', rating: '4.7', orders: '180 Orders', distance: '4.8 km away' },
];

export function DispatchAssignmentScreen() {
  const navigation = useNavigation<NavigationProp<AppStackParamList>>();
  const [selectedRider, setSelectedRider] = useState('1');

  const handleAssign = () => {
    const rider = mockRiders.find(r => r.id === selectedRider);
    Alert.alert('Order Dispatched', `Rider ${rider?.name || 'Partner'} assigned to order #FK123456.`, [
      { text: 'OK', onPress: () => navigation.navigate('ReadyForPickup', { orderId: '123456' } as any) },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <ArrowLeftIcon width={24} height={24} stroke={colors.textPrimary} />
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text style={styles.headerTitle}>Dispatch Order</Text>
          <Text style={styles.headerSubtitle}>#FK123456</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Assign Delivery Partner</Text>

          {mockRiders.map((rider) => {
            const isSelected = rider.id === selectedRider;
            return (
              <TouchableOpacity
                key={rider.id}
                style={[styles.riderCard, isSelected && styles.riderCardSelected]}
                onPress={() => setSelectedRider(rider.id)}
              >
                <View style={styles.avatar}>
                  <ProfileIcon width={18} height={18} stroke={colors.textMuted} />
                </View>
                <View style={{ flex: 1, marginLeft: spacing.md }}>
                  <Text style={styles.riderName}>{rider.name}</Text>
                  <View style={styles.riderMetaRow}>
                    <StarIcon width={12} height={12} fill={colors.warning} stroke={colors.warning} />
                    <Text style={styles.riderMeta}> {rider.rating} · {rider.orders}</Text>
                  </View>
                  <Text style={styles.riderDistance}>{rider.distance}</Text>
                </View>
                <View style={[styles.radio, isSelected && styles.radioSelected]}>
                  {isSelected && <View style={styles.radioDot} />}
                </View>
              </TouchableOpacity>
            );
          })}

          <Text style={styles.sectionTitle}>Pickup Details</Text>
          <View style={styles.pickupCard}>
            <View style={styles.pickupRow}>
              <View style={styles.pickupDotWrap}>
                <View style={[styles.pickupDot, { backgroundColor: colors.primary }]} />
                <View style={styles.pickupLine} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.pickupLabel}>Sharma Hardware Store</Text>
                <Text style={styles.pickupAddress}>Kandivali West, Mumbai</Text>
              </View>
            </View>
            <View style={styles.pickupRow}>
              <View style={styles.pickupDotWrap}>
                <View style={[styles.pickupDot, { backgroundColor: colors.accentGreen }]} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.pickupLabel}>Deliver To</Text>
                <Text style={styles.pickupSubLabel}>Rahul Sharma</Text>
                <Text style={styles.pickupAddress}>Kandivali West, Mumbai</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.assignButton} onPress={handleAssign}>
          <Text style={styles.assignButtonText}>Assign & Dispatch</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
  },
  headerTitle: { fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.bold, color: colors.textPrimary, textAlign: 'center' },
  headerSubtitle: { fontSize: typography.fontSize.xs, color: colors.textMuted, textAlign: 'center', marginTop: 2 },
  content: { paddingHorizontal: spacing.xl, paddingTop: spacing.md },
  sectionTitle: { fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.bold, color: colors.textPrimary, marginBottom: spacing.md, marginTop: spacing.sm },
  riderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  riderCardSelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  riderName: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
  riderMetaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 3 },
  riderMeta: { fontSize: typography.fontSize.xs, color: colors.textSecondary },
  riderDistance: { fontSize: typography.fontSize.xs, color: colors.textMuted, marginTop: 2 },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: { borderColor: colors.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  pickupCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pickupRow: { flexDirection: 'row' },
  pickupDotWrap: { alignItems: 'center', width: 20, marginRight: spacing.md },
  pickupDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  pickupLine: { flex: 1, width: 2, backgroundColor: colors.border, marginVertical: 4, minHeight: 30 },
  pickupLabel: { fontSize: 13, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
  pickupSubLabel: { fontSize: typography.fontSize.xs, color: colors.textSecondary, marginTop: 2 },
  pickupAddress: { fontSize: typography.fontSize.xs, color: colors.textMuted, marginTop: 2, marginBottom: spacing.md },
  bottomBar: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  assignButton: {
    backgroundColor: colors.primary,
    height: 52,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  assignButtonText: { color: colors.surface, fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.bold },
});

export default DispatchAssignmentScreen;
