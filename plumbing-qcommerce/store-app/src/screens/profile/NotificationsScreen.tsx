import { NavigationProp, useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import ArrowLeftIcon from '../../assets/icons/arrow-left.svg';
import NotificationIcon from '../../assets/icons/notification.svg';
import { notificationService } from '../../services/notifications/notificationService';
import { borderRadius, colors, shadows, spacing, typography } from '../../theme';
import { AppNotification } from '../../types';
import { AppStackParamList } from '../../types/navigation';

export function NotificationsScreen() {
  const navigation = useNavigation<NavigationProp<AppStackParamList>>();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifs = useCallback(async () => {
    try {
      const data = await notificationService.getNotifications();
      setNotifications(data || []);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifs();
  }, [fetchNotifs]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifs();
  };

  const handleNotificationPress = (notif: AppNotification) => {
    notificationService.markAsRead(notif.id).catch(() => {});

    const targetId = (notif as any).targetId || (notif as any).requestId || 1;

    if (notif.type === 'MATERIAL_REQUEST_APPROVED' || notif.type === 'NEW_ORDER') {
      navigation.navigate('MaterialRequestDetail', { requestId: Number(targetId) });
    } else if (notif.type === 'PLUMBER_COLLECTION') {
      navigation.navigate('CollectionConfirmation', { requestId: Number(targetId) });
    } else if (notif.type === 'LOW_STOCK') {
      navigation.navigate('ProductDetails', { productId: Number(targetId) });
    } else {
      navigation.navigate('Main', { screen: 'MaterialsTab' } as any);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            if (navigation.canGoBack()) navigation.goBack();
            else navigation.navigate('Main', { screen: 'HomeTab' } as any);
          }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <ArrowLeftIcon width={24} height={24} stroke={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Operational Notifications</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.loadingText}>Fetching Store Notifications...</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => String(item.id)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.card, !item.read && styles.unreadCard]}
              onPress={() => handleNotificationPress(item)}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                {!item.read && <View style={styles.unreadDot} />}
              </View>
              <Text style={styles.cardBody}>{item.message}</Text>
              <Text style={styles.cardTime}>
                {new Date(item.timestamp || Date.now()).toLocaleTimeString('en-IN', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.center}>
              <NotificationIcon width={36} height={36} stroke={colors.textMuted} />
              <Text style={styles.emptyText}>No notifications in your store feed.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background || '#F9F9F9' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.layout,
    paddingVertical: spacing.md,
    backgroundColor: colors.surfaceContainerLowest || '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.border || '#C6C5D4',
  },
  headerTitle: { fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.xs, paddingTop: spacing.giant },
  loadingText: { fontSize: typography.fontSize.xs, color: colors.textSecondary },
  emptyText: { fontSize: typography.fontSize.xs, color: colors.textMuted, marginTop: spacing.xs },
  listContainer: { padding: spacing.layout, paddingBottom: spacing.giant },
  card: {
    backgroundColor: colors.surfaceContainerLowest || '#FFFFFF',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border || '#C6C5D4',
    ...shadows.sm,
  },
  unreadCard: {
    borderColor: colors.primaryContainer || colors.primary,
    backgroundColor: colors.surfaceContainerLow || '#F4F3F7',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  cardTitle: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primaryContainer || colors.primary },
  cardBody: { fontSize: typography.fontSize.xs, color: colors.textSecondary, lineHeight: 16 },
  cardTime: { fontSize: 10, color: colors.textMuted, marginTop: 6 },
});

export default NotificationsScreen;
