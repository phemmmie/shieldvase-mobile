import { useState } from 'react';
import { Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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

const SITE = 'https://shieldvase.io';

// Mirrors the web TopNavbar mobile menu (isMenuOpen dropdown): the same six
// links — native routes where the page exists, site links otherwise.
const MENU_LINKS: { icon: keyof typeof Ionicons.glyphMap; label: string; route?: string; url?: string }[] = [
  { icon: 'cash-outline', label: 'Prices', route: '/prices' },
  { icon: 'headset-outline', label: 'Podcast', url: `${SITE}/podcast` },
  { icon: 'book-outline', label: 'About Us', url: `${SITE}/about` },
  { icon: 'chatbox-outline', label: 'Contact', url: `${SITE}/contact` },
  { icon: 'car-outline', label: 'Logistics Hub', url: `${SITE}/logistics-hub` },
  { icon: 'document-text-outline', label: 'RFQ', route: '/rfq/new' },
];

export function AppHeader({ title, brand }: { title: string; brand?: boolean }) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { totalItems } = useCart();
  const { unreadCount } = useNotifications(user?.id);
  const [menuOpen, setMenuOpen] = useState(false);

  const go = (l: (typeof MENU_LINKS)[number]) => {
    setMenuOpen(false);
    if (l.route) router.push(l.route as any);
    else if (l.url) Linking.openURL(l.url);
  };

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
        <Pressable
          onPress={() => {
            Haptics.selectionAsync();
            setMenuOpen(true);
          }}
          style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.7 }]}
          accessibilityLabel={menuOpen ? 'Close menu' : 'Open menu'}
        >
          <Ionicons name={menuOpen ? 'close' : 'menu'} size={22} color={colors.textOnPrimary} />
        </Pressable>
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

      {/* Mobile menu — mirrors web TopNavbar's isMenuOpen dropdown */}
      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <Pressable style={styles.menuBackdrop} onPress={() => setMenuOpen(false)} />
        <View style={[styles.menu, { marginTop: insets.top + spacing.sm + 50 }]}>
          <LinearGradient
            colors={['#E42D40', '#000000', '#007749']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.menuInner}
          >
            <ScrollView style={{ maxHeight: 420 }}>
              {MENU_LINKS.map((l) => (
                <Pressable key={l.label} onPress={() => go(l)} style={styles.menuItem}>
                  <Ionicons name={l.icon} size={18} color={colors.textOnPrimary} />
                  <Text style={styles.menuItemText}>{l.label}</Text>
                </Pressable>
              ))}
              {user ? (
                <View style={styles.menuAuth}>
                  <View style={styles.menuItem}>
                    <Ionicons name="person-circle-outline" size={18} color={colors.textOnPrimary} />
                    <Text style={styles.menuItemText} numberOfLines={1}>
                      {user.email}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => {
                      setMenuOpen(false);
                      router.push('/(tabs)/account' as any);
                    }}
                    style={styles.menuItem}
                  >
                    <Ionicons name="grid-outline" size={18} color={colors.textOnPrimary} />
                    <Text style={styles.menuItemText}>Dashboard</Text>
                  </Pressable>
                  <Pressable
                    onPress={async () => {
                      setMenuOpen(false);
                      await signOut();
                    }}
                    style={styles.menuItem}
                  >
                    <Ionicons name="log-in-outline" size={18} color={colors.textOnPrimary} />
                    <Text style={styles.menuItemText}>Logout</Text>
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  onPress={() => {
                    setMenuOpen(false);
                    router.push('/(auth)/sign-in' as any);
                  }}
                  style={styles.loginBtn}
                >
                  <Ionicons name="log-in-outline" size={18} color={colors.textOnAccent} />
                  <Text style={styles.loginBtnText}>Login Now</Text>
                </Pressable>
              )}
            </ScrollView>
          </LinearGradient>
        </View>
      </Modal>
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
  menuBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
  menu: {
    position: 'absolute',
    top: 42,
    left: 0,
    right: 0,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  menuInner: { padding: spacing.md },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.sm,
  },
  menuItemText: { ...typography.body, color: colors.textOnPrimary },
  menuAuth: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,0.2)', marginTop: spacing.sm, paddingTop: spacing.sm },
  loginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  loginBtnText: { ...typography.bodyStrong, color: colors.textOnAccent },
});
