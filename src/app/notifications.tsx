import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/features/auth/AuthContext';
import { useNotifications, type AppNotification } from '@/features/notifications/queries';
import { EmptyState, ErrorState } from '@/components/States';
import { ListSkeleton } from '@/components/Skeleton';
import { colors, radius, shadows, spacing, typography } from '@/theme';
import { productParamFromWebUrl } from '@/utils/productUrl';
import { ScreenColumn } from '@/components/Responsive';

const TYPE_ICON: Record<AppNotification['type'], { name: any; color: string }> = {
  info: { name: 'information-circle', color: colors.primary },
  success: { name: 'checkmark-circle', color: colors.secondary },
  warning: { name: 'warning', color: colors.accent },
  error: { name: 'alert-circle', color: colors.destructive },
};

/** Map web action_url paths to the nearest mobile route. */
const resolveActionRoute = (url: string): string | null => {
  if (!url.startsWith('/')) return null;
  if (url.startsWith('/orders')) return '/(tabs)/orders';
  if (url.startsWith('/order/')) return url.replace('/order/', '/order/');
  if (url.startsWith('/deals/')) return url;
  if (url.startsWith('/rfq')) return url.replace(/^\/rfqs?/, '/rfq');
  if (url.startsWith('/product/')) return url;
  if (url.startsWith('/store/')) return url;
  if (url === '/' || url.startsWith('/marketplace')) return '/(tabs)';
  // Web product URLs: /{categorySlug}/{slug}-p-{shortId} → /product/{tail}
  const productTail = productParamFromWebUrl(url);
  if (productTail) return `/product/${productTail}`;
  return url;
};

export default function NotificationsScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const { notifications, isLoading, isError, refetch, unreadCount, markAsRead, markAllRead } =
    useNotifications(session?.user.id);

  const onPress = async (n: AppNotification) => {
    if (!n.isRead) markAsRead.mutate(n.id);
    const route = n.actionUrl ? resolveActionRoute(n.actionUrl) : null;
    if (route) router.push(route as any);
  };

  return (
    <View style={styles.screen}>
      <Stack.Screen
        options={{
          title: 'Notifications',
          headerRight: () =>
            unreadCount > 0 ? (
              <Pressable onPress={() => markAllRead.mutate()} hitSlop={8}>
                <Text style={styles.markAll}>Mark all read</Text>
              </Pressable>
            ) : null,
        }}
      />
      {!session ? (
        <EmptyState title="Sign in to see notifications" />
      ) : isLoading ? (
        <View style={{ padding: spacing.lg }}><ListSkeleton count={6} /></View>
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !notifications.length ? (
        <EmptyState title="No notifications yet" hint="Order and deal updates will appear here." />
      ) : (
                  <ScreenColumn pad={false} style={{ flex: 1 }}>
                    <FlatList
            data={notifications}
            keyExtractor={(n) => n.id}
            contentContainerStyle={styles.list}
            refreshing={isLoading}
            onRefresh={() => refetch()}
            renderItem={({ item, index }) => {
              const icon = TYPE_ICON[item.type] ?? TYPE_ICON.info;
              return (
                <Animated.View entering={FadeInDown.delay(Math.min(index, 10) * 30).duration(200)}>
                <Pressable
                  style={[styles.card, !item.isRead && styles.cardUnread]}
                  onPress={() => onPress(item)}
                >
                  <Ionicons name={icon.name} size={22} color={icon.color} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.title} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={styles.message} numberOfLines={3}>
                      {item.message}
                    </Text>
                    <Text style={styles.time}>
                      {new Date(item.createdAt).toLocaleString()}
                      {item.actionText ? ` · ${item.actionText}` : ''}
                    </Text>
                  </View>
                  {!item.isRead && <View style={styles.dot} />}
                </Pressable>
                </Animated.View>
              );
            }}
          />
                  </ScreenColumn>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.lg, gap: spacing.sm },
  markAll: { ...typography.bodyStrong, color: colors.primary },
  card: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    ...shadows.card,
    backgroundColor: colors.surfaceRaised,
    alignItems: 'flex-start',
  },
  cardUnread: { borderColor: colors.primary + '55', backgroundColor: colors.primarySoft },
  title: { ...typography.bodyStrong, color: colors.text },
  message: { ...typography.body, color: colors.textMuted, marginTop: 2 },
  time: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginTop: 6,
  },
});
