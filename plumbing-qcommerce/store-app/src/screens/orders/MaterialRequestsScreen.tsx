import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Alert } from 'react-native';
import { colors, spacing, typography } from '../../theme';
import { ScreenWrapper } from '../../components/common/ScreenWrapper';
import { AppHeader } from '../../components/common/AppHeader';
import { MaterialRequestCard } from '../../components/cards/DispatchCards';
import { materialRequestService } from '../../services/orders/materialRequestService';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { AppStackParamList } from '../../types/navigation';
import { MaterialRequest } from '../../types';

import WarehouseIcon from '../../assets/icons/warehouse.svg';

export const MaterialRequestsScreen = () => {
  const navigation = useNavigation<NavigationProp<AppStackParamList>>();
  
  const [requests, setRequests] = useState<MaterialRequest[]>([]);
  const [activeTab, setActiveTab] = useState<'new' | 'preparing' | 'completed'>('new');
  const [loading, setLoading] = useState(false);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const data = await materialRequestService.getMaterialRequests();
      setRequests(data);
    } catch (e) {
      Alert.alert('Error', 'Failed to retrieve material requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleAdvance = async (req: MaterialRequest) => {
    setLoading(true);
    try {
      let updated: MaterialRequest;
      if (req.status === 'PENDING') {
        updated = await materialRequestService.prepareOrder(req.id);
      } else if (req.status === 'PREPARING') {
        updated = await materialRequestService.completePreparation(req.id);
      } else {
        updated = await materialRequestService.confirmCollection(req.id);
      }

      setRequests(prev => prev.map(r => r.id === req.id ? updated : r));

      if (updated.status === 'PREPARING') {
        Alert.alert('Order Accepted', `Material request for plumber ${req.plumberName} is now being packed.`);
      } else if (updated.status === 'READY') {
        Alert.alert('Packed', `Material request for plumber ${req.plumberName} is ready for pickup.`);
      } else if (updated.status === 'COMPLETED') {
        Alert.alert('Collection Confirmed', `Material collection confirmed for plumber ${req.plumberName}.`);
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredRequests = () => {
    return requests.filter(r => {
      if (activeTab === 'new') return r.status === 'PENDING';
      if (activeTab === 'preparing') return r.status === 'PREPARING' || r.status === 'READY';
      return r.status === 'COMPLETED';
    });
  };

  const getActionTitle = (request: MaterialRequest) => {
    if (request.status === 'PENDING') return 'Accept Request';
    if (request.status === 'PREPARING') return 'Mark Packed';
    if (request.status === 'READY' && request.rawStatus === 'PLUMBER_AT_STORE' && request.plumberCollectedAt) {
      return 'Confirm Collection';
    }
    return undefined;
  };

  return (
    <ScreenWrapper style={styles.container}>
      <AppHeader title="Material Requests" onBackPress={() => navigation.goBack()} />

      <View style={styles.tabBar}>
        {(['new', 'preparing', 'completed'] as const).map(tab => {
          const isActive = activeTab === tab;
          const count = requests.filter(r => {
            if (tab === 'new') return r.status === 'PENDING';
            if (tab === 'preparing') return r.status === 'PREPARING' || r.status === 'READY';
            return r.status === 'COMPLETED';
          }).length;

          return (
            <TouchableOpacity
              key={tab}
              style={[styles.tabBtn, isActive && styles.activeTabBtn]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabLabel, isActive && styles.activeTabLabel]}>
                {tab.toUpperCase()}
              </Text>
              {count > 0 && (
                <View style={[styles.badge, isActive ? styles.activeBadge : styles.inactiveBadge]}>
                  <Text style={[styles.badgeText, isActive && styles.activeBadgeText]}>{count}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <FlatList
        data={getFilteredRequests()}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.list}
        refreshing={loading}
        onRefresh={loadRequests}
        renderItem={({ item }) => (
          <MaterialRequestCard
            request={item}
            onPressAction={getActionTitle(item) ? () => handleAdvance(item) : undefined}
            actionTitle={getActionTitle(item)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <WarehouseIcon width={40} height={40} stroke={colors.textMuted} style={{ marginBottom: spacing.md }} />
            <Text style={styles.emptyText}>No material requests in this state</Text>
          </View>
        }
      />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderBottomWidth: 1.5,
    borderBottomColor: colors.border,
    height: 48,
  },
  tabBtn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  activeTabBtn: {
    borderBottomWidth: 3,
    borderBottomColor: colors.primary,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: typography.fontWeight.bold,
    color: colors.textSecondary,
  },
  activeTabLabel: {
    color: colors.primary,
  },
  badge: {
    paddingHorizontal: 5,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
    minWidth: 16,
  },
  activeBadge: {
    backgroundColor: colors.primary,
  },
  inactiveBadge: {
    backgroundColor: colors.borderDark,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  activeBadgeText: {
    color: colors.card,
  },
  list: {
    padding: spacing.layout,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.giant,
  },
  emptyText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.bold,
  },
});
export default MaterialRequestsScreen;
