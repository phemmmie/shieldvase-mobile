import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/features/auth/AuthContext';
import { useCart } from '@/features/cart/CartContext';
import { useNotifications } from '@/features/notifications/queries';
import { colors, radius, spacing, typography } from '@/theme';
import { ScreenColumn } from '@/components/Responsive';

function IconBtn({
  icon,
  badge,
  onPress,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  badge?: number;
  onPress: () => void;
  label: string;
}) {
  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync();
        onPress();
      }}
      style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.7 }]}
      accessibilityLabel={label}
    >
      <Ionicons name={icon} size={22} color={colors.textOnPrimary} />
      {!!badge && badge > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge > 9 ? '9+' : badge}</Text>
        </View>
      )}
    </Pressable>
  );
}

export function AppHeader({ title, brand }: { title: string; brand?: boolean }) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { totalItems } = useCart();
  const { unreadCount } = useNotifications(user?.id);

  return (
    <LinearGradient
      // Mirrors the web TopNavbar: african-red → black → green
      colors={['#E42D40', '#000000', '#007749']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={[styles.wrap, { paddingTop: insets.top + spacing.sm }]}
    >
      <ScreenColumn pad={false}>
      <View style={styles.row}>
        {brand ? (
          <View style={styles.brandRow}>
            <Image
              source={require('../../assets/brand/shieldvase-logo.png')}
              style={styles.logo}
              contentFit="cover"
            />
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
          </View>
        ) : (
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
        )}
        <View style={styles.actions}>
          <IconBtn icon="cart-outline" badge={totalItems} label="Cart" onPress={() => router.push('/cart' as any)} />
          <IconBtn
            icon="notifications-outline"
            badge={unreadCount}
            label="Notifications"
            onPress={() => router.push('/notifications' as any)}
          />
        </View>
      </View>
      <Pressable
        onPress={() => {
          Haptics.selectionAsync();
          router.push('/search' as any);
        }}
        style={({ pressed }) => [styles.search, pressed && { opacity: 0.85 }]}
        accessibilityLabel="Search products"
      >
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <Text style={styles.searchText}>Search products, suppliers, categories…</Text>
      </Pressable>
      </ScreenColumn>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  logo: { width: 30, height: 30, borderRadius: radius.sm },
  title: { ...typography.h3, color: colors.textOnPrimary, flexShrink: 1 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  badge: {
    position: 'absolute',
    right: -1,
    top: -1,
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.35)',
  },
  badgeText: { ...typography.micro, fontSize: 9, color: colors.textOnAccent },
  search: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    height: 42,
  },
  searchText: { ...typography.body, color: colors.textMuted, flex: 1 },
});
