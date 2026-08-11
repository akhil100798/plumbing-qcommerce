import { StackScreenProps } from '@react-navigation/stack';
import React, { useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useIsFocused } from '@react-navigation/native';

import { NotificationCard } from '../components/cards/NotificationCard';
import { borderRadius, colors, spacing, typography } from '../theme';
import { AppStackParamList } from '../types/navigation';
import { RootState } from '../redux/store';
import { markAsRead, markAllRead, setNotifications } from '../redux/slices/notificationsSlice';
import { NotificationRepository } from '../services/notifications/notificationRepository';

type Props = StackScreenProps<AppStackParamList, 'Notifications'>;

export function NotificationsScreen({ navigation }: Props) {
  const dispatch = useDispatch();
  const isFocused = useIsFocused();
  const notifications = useSelector((state: RootState) => state.notifications.notifications);

  useEffect(() => {
    if (!isFocused) return;
    const fetchNotifications = async () => {
      try {
        const list = await NotificationRepository.getNotifications();
        dispatch(setNotifications(list));
      } catch (err) {
        console.error('Failed to load notifications', err);
      }
    };
    fetchNotifications();
  }, [isFocused, dispatch]);

  const handleMarkAllRead = async () => {
    try {
      await NotificationRepository.markAllAsRead();
      dispatch(markAllRead());
    } catch (err) {
      console.error('Failed to mark all read', err);
    }
  };

  const handleCardPress = async (item: any) => {
    try {
      await NotificationRepository.markAsRead(Number(item.id));
      dispatch(markAsRead(item.id));
    } catch (err) {
      console.error('Failed to mark notification read', err);
    }

    if (item.data?.orderId || item.orderId) {
      const orderId = Number(item.data?.orderId || item.orderId);
      if (item.type === 'SERVICE_STATUS' || item.title?.includes('Plumber')) {
        navigation.navigate('PlumberTracking', {
          orderId,
          plumberId: String(item.data?.plumberId || 'P-101'),
          plumberName: String(item.data?.plumberName || 'Assigned Plumber'),
        });
      } else {
        navigation.navigate('OrderDetails', { orderId, type: 'service' });
      }
    } else {
      navigation.navigate('Main');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.left}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Notification Center</Text>
        </View>
        {notifications.some((n) => !n.read) && (
          <TouchableOpacity onPress={handleMarkAllRead}>
            <Text style={styles.markReadText}>Mark All Read</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {notifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🔔</Text>
            <Text style={styles.emptyTitle}>No Notifications Yet</Text>
            <Text style={styles.emptyText}>
              Updates regarding plumber assignment, job progress, and material requests will appear here.
            </Text>
          </View>
        ) : (
          notifications.map((item) => (
            <NotificationCard
              key={item.id}
              id={item.id}
              title={item.title}
              body={item.body}
              time={item.time}
              unread={!item.read}
              onPress={() => handleCardPress(item)}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background || '#F8F9FF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.layout,
    paddingVertical: spacing.md,
    backgroundColor: colors.surfaceContainerLowest || '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.border || '#C1C6D6',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLowest || '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border || '#C1C6D6',
  },
  backButtonText: {
    fontSize: 20,
    color: colors.textPrimary,
    fontWeight: 'bold',
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.heading,
    color: colors.textPrimary,
  },
  markReadText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.body,
    color: colors.primaryContainer || colors.primary,
  },
  scrollContent: {
    padding: spacing.layout,
    paddingBottom: spacing.huge,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.giant,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.heading,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  emptyText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontFamily: typography.fontFamily.body,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
    lineHeight: 18,
  },
});
