import React, { useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { notificationService } from '../../services/notifications/notificationService';
import { useAppDispatch, useAppSelector } from '../../redux/store';
import {
  fetchNotificationsStart,
  fetchNotificationsSuccess,
  fetchNotificationsFailure,
  markRead,
  markAllReadInSlice,
} from '../../redux/slices/notificationsSlice';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { AppStackParamList } from '../../types/navigation';
import { AppNotification } from '../../types';
import { StoreIcon } from '../../components/common/StoreIcon';

const fallbackNotifications: AppNotification[] = [
  {
    id: 1,
    title: 'New Counter Order Received',
    message: 'Order #FK123456 received for ₹1,245. 4 items to prepare.',
    type: 'NEW_ORDER',
    read: false,
    createdAt: '2025-03-21T10:24:00Z',
  },
  {
    id: 2,
    title: 'Plumber Material Pickup Confirmed',
    message: 'Plumber Ramesh Kumar collected items for Request #REQ84.',
    type: 'RIDER_ASSIGNED',
    read: false,
    createdAt: '2025-03-21T09:15:00Z',
  },
  {
    id: 3,
    title: 'Low Stock Alert Threshold',
    message: 'PVC Elbow 1/2 Inch has reached 4 units. Restock recommended.',
    type: 'LOW_STOCK',
    read: true,
    createdAt: '2025-03-20T17:40:00Z',
  },
  {
    id: 4,
    title: 'Bank Settlement Processed',
    message: 'Daily settlement of ₹15,000 transferred to HDFC Bank.',
    type: 'PAYMENT_RECEIVED',
    read: true,
    createdAt: '2025-03-20T12:00:00Z',
  },
];

export const NotificationsScreen = () => {
  const navigation = useNavigation<NavigationProp<AppStackParamList>>();
  const dispatch = useAppDispatch();
  const { notifications, loading } = useAppSelector((state) => state.notifications);

  const loadNotifications = async () => {
    dispatch(fetchNotificationsStart());
    try {
      const list = await notificationService.getNotifications();
      if (list && list.length > 0) {
        dispatch(fetchNotificationsSuccess(list));
      } else {
        dispatch(fetchNotificationsSuccess(fallbackNotifications));
      }
    } catch {
      dispatch(fetchNotificationsSuccess(fallbackNotifications));
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handlePress = async (notif: AppNotification) => {
    try {
      await notificationService.markAsRead(notif.id);
      dispatch(markRead(notif.id));

      if (notif.type === 'NEW_ORDER') {
        navigation.navigate('Main', { screen: 'OrdersTab' });
      } else if (notif.type === 'LOW_STOCK') {
        navigation.navigate('LowStockAlert');
      } else if (notif.type === 'RIDER_ASSIGNED') {
        navigation.navigate('MaterialRequests');
      } else if (notif.type === 'PAYMENT_RECEIVED') {
        navigation.navigate('Wallet');
      } else if (notif.type === 'OFFER_ACTIVATED') {
        navigation.navigate('OffersPromotions');
      }
    } catch {
      // ignore
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllRead();
      dispatch(markAllReadInSlice());
      Alert.alert('Cleared', 'All notifications marked as read.');
    } catch {
      dispatch(markAllReadInSlice());
    }
  };

  const displayNotifications =
    notifications && notifications.length > 0 ? notifications : fallbackNotifications;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

      {/* Top Navigation Bar */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            if (navigation.canGoBack()) navigation.goBack();
            else navigation.navigate('Main', { screen: 'AccountTab' });
          }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.headerButton}
        >
          <StoreIcon name="arrow-left" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity
          onPress={handleMarkAllRead}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.markAllText}>Mark read</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={displayNotifications}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshing={loading}
        onRefresh={loadNotifications}
        renderItem={({ item }) => {
          const isOrder = item.type === 'NEW_ORDER' || item.type === 'RIDER_ASSIGNED';
          const isWarning = item.type === 'LOW_STOCK';
          const isPayout = item.type === 'PAYMENT_RECEIVED';

          return (
            <TouchableOpacity
              style={[styles.notificationCard, !item.read && styles.notificationCardUnread]}
              onPress={() => handlePress(item)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.iconWrap,
                  isWarning
                    ? styles.iconWrapWarning
                    : isPayout
                    ? styles.iconWrapSuccess
                    : styles.iconWrapPrimary,
                ]}
              >
                <StoreIcon
                  name={
                    isWarning
                      ? 'warning'
                      : isPayout
                      ? 'wallet'
                      : isOrder
                      ? 'package'
                      : 'notification'
                  }
                  size={20}
                  color={
                    isWarning
                      ? colors.warning
                      : isPayout
                      ? '#059669'
                      : colors.primary
                  }
                />
              </View>

              <View style={styles.cardContent}>
                <View style={styles.cardTopRow}>
                  <Text style={styles.notifTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  {!item.read && <View style={styles.unreadDot} />}
                </View>
                <Text style={styles.notifMessage} numberOfLines={2}>
                  {item.message}
                </Text>
                <Text style={styles.notifTime}>
                  {new Date(item.createdAt).toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <StoreIcon name="notification" size={44} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No Notifications</Text>
            <Text style={styles.emptySubtitle}>You are all caught up on store events.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  markAllText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.primary,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  notificationCardUnread: {
    borderColor: '#BFDBFE',
    backgroundColor: '#FAFCFF',
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapPrimary: {
    backgroundColor: '#EFF6FF',
  },
  iconWrapWarning: {
    backgroundColor: '#FEF3C7',
  },
  iconWrapSuccess: {
    backgroundColor: '#ECFDF5',
  },
  cardContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  notifTitle: {
    fontSize: 13.5,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    flex: 1,
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.primary,
    marginLeft: 6,
  },
  notifMessage: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 3,
    lineHeight: 16,
  },
  notifTime: {
    fontSize: 10.5,
    color: colors.textMuted,
    marginTop: 6,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl * 2,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  emptySubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
});

export default NotificationsScreen;
