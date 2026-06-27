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
import { colors, spacing, typography } from '../theme';
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

  const handleCardPress = async (id: string) => {
    try {
      await NotificationRepository.markAsRead(Number(id));
      dispatch(markAsRead(id));
    } catch (err) {
      console.error('Failed to mark notification read', err);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.left}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Notifications</Text>
        </View>
        {notifications.some((n) => !n.read) && (
          <TouchableOpacity onPress={handleMarkAllRead}>
            <Text style={styles.markReadText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {notifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No notifications found.</Text>
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
              onPress={() => handleCardPress(item.id)}
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
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.layout,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  backButtonText: {
    fontSize: 22,
    color: colors.textPrimary,
    fontWeight: 'bold',
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  markReadText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  scrollContent: {
    padding: spacing.layout,
    paddingBottom: spacing.huge,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.huge,
  },
  emptyText: {
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
  },
});
