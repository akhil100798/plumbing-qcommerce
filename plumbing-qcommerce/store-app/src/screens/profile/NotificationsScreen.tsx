import React, { useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Alert } from 'react-native';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { ScreenWrapper } from '../../components/common/ScreenWrapper';
import { AppHeader } from '../../components/common/AppHeader';
import { NotificationCard } from '../../components/cards/WalletReviewsPromoCards';
import { notificationService } from '../../services/notifications/notificationService';
import { useAppDispatch, useAppSelector } from '../../redux/store';
import { fetchNotificationsStart, fetchNotificationsSuccess, fetchNotificationsFailure, markRead, markAllReadInSlice } from '../../redux/slices/notificationsSlice';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { AppStackParamList } from '../../types/navigation';
import { AppNotification } from '../../types';

import NotificationIcon from '../../assets/icons/notification.svg';

export const NotificationsScreen = () => {
  const navigation = useNavigation<NavigationProp<AppStackParamList>>();
  const dispatch = useAppDispatch();

  const { notifications, loading } = useAppSelector(state => state.notifications);

  const loadNotifications = async () => {
    dispatch(fetchNotificationsStart());
    try {
      const list = await notificationService.getNotifications();
      dispatch(fetchNotificationsSuccess(list));
    } catch (e: any) {
      dispatch(fetchNotificationsFailure(e.message || 'Failed to sync notifications'));
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handlePress = async (notif: AppNotification) => {
    try {
      await notificationService.markAsRead(notif.id);
      dispatch(markRead(notif.id));
      
      // Route appropriately based on notification payload type
      if (notif.type === 'NEW_ORDER') {
        navigation.navigate('Main', { screen: 'OrdersTab' });
      } else if (notif.type === 'LOW_STOCK') {
        navigation.navigate('LowStockAlert');
      } else if (notif.type === 'OFFER_ACTIVATED') {
        navigation.navigate('OffersPromotions');
      }
    } catch (e) {
      // ignore
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllRead();
      dispatch(markAllReadInSlice());
      Alert.alert('Cleared', 'All notifications marked as read.');
    } catch (e) {
      // ignore
    }
  };

  return (
    <ScreenWrapper style={styles.container}>
      <AppHeader
        title="Notifications"
        onBackPress={() => navigation.goBack()}
        rightAction={
          notifications.some(n => !n.read) ? (
            <TouchableOpacity onPress={handleMarkAllRead} style={styles.markAllBtn}>
              <Text style={styles.markAllText}>Mark all read</Text>
            </TouchableOpacity>
          ) : undefined
        }
      />

      <FlatList
        data={notifications}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.list}
        refreshing={loading}
        onRefresh={loadNotifications}
        renderItem={({ item }) => (
          <NotificationCard
            notification={item}
            onPress={() => handlePress(item)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <NotificationIcon width={40} height={40} stroke={colors.textMuted} style={{ marginBottom: spacing.sm }} />
            <Text style={styles.emptyText}>No notifications found</Text>
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
  markAllBtn: {
    paddingHorizontal: spacing.sm,
  },
  markAllText: {
    color: colors.primary,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
  list: {
    padding: spacing.layout,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.giant,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.bold,
  },
});
export default NotificationsScreen;
