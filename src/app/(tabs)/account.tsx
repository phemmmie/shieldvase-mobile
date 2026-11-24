import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Updates from 'expo-updates';
import Constants from 'expo-constants';
import { useAuth } from '@/features/auth/AuthContext';
import { LoadingState } from '@/components/States';
import { colors, radius, shadows, spacing, typography } from '@/theme';

function Row({
  icon,
  label,
  onPress,
  destructive,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  destructive?: boolean;
}) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <Ionicons
        name={icon}
        size={20}
        color={destructive ? colors.destructive : colors.textMuted}
      />
      <Text style={[styles.rowLabel, destructive && { color: colors.destructive }]}>
        {label}
      </Text>
      <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
    </Pressable>
  );
}

function UpdateRow() {
  const [checking, setChecking] = useState(false);
  const [status, setStatus] = useState('');

  const check = async () => {
    if (!Updates.isEnabled) {
      setStatus('Updates are only available in release builds');
      return;
    }
    try {
      setChecking(true);
      setStatus('Checking for updates…');
      const res = await Updates.checkForUpdateAsync();
      if (!res.isAvailable) {
        setStatus('You are on the latest version');
      } else {
        setStatus('Downloading update…');
        await Updates.fetchUpdateAsync();
        setStatus('Update downloaded');
        Alert.alert('Update ready', 'Restart now to apply the update?', [
          { text: 'Later', style: 'cancel' },
          { text: 'Restart', onPress: () => void Updates.reloadAsync() },
        ]);
      }
    } catch {
      setStatus('Could not check for updates — check your connection');
    } finally {
      setChecking(false);
    }
  };

  return (
    <Pressable style={styles.row} onPress={check} disabled={checking}>
      <Ionicons name="cloud-download-outline" size={20} color={colors.textMuted} />
      <View style={styles.rowBody}>
        <Text style={styles.rowLabel}>Check for updates</Text>
        <Text style={styles.rowSub}>
          {status || `Version ${Constants.expoConfig?.version ?? '1.0.0'}`}
        </Text>
      </View>
      {checking ? (
        <ActivityIndicator size="small" color={colors.primary} />
      ) : (
        <Ionicons name="refresh" size={16} color={colors.textMuted} />
      )}
    </Pressable>
  );
}

export default function AccountScreen() {
  const router = useRouter();
  const { user, userType, loading, signOut } = useAuth();

  if (loading) return <LoadingState />;

  if (!user) {
    return (
      <View style={styles.guest}>
        <Ionicons name="person-circle-outline" size={72} color={colors.textMuted} />
        <Text style={styles.guestTitle}>You’re browsing as a guest</Text>
        <Text style={styles.guestHint}>
          Sign in to track orders, save your cart across devices, and check out faster.
        </Text>
        <Pressable
          style={styles.signInBtn}
          onPress={() => router.push('/(auth)/sign-in')}
        >
          <Text style={styles.signInText}>Sign in</Text>
        </Pressable>
        <Pressable onPress={() => router.push('/(auth)/sign-up')}>
          <Text style={styles.createText}>Create an account</Text>
        </Pressable>
        <View style={styles.guestUpdateCard}>
          <UpdateRow />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(user.user_metadata?.full_name?.[0] ?? user.email?.[0] ?? '?').toUpperCase()}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>
            {user.user_metadata?.full_name || 'ShieldVase customer'}
          </Text>
          <Text style={styles.email}>{user.email}</Text>
          {!!userType && <Text style={styles.role}>{userType.toUpperCase()}</Text>}
        </View>
      </View>

      <View style={styles.card}>
        <Row icon="receipt-outline" label="Orders" onPress={() => router.push('/(tabs)/orders')} />
        <Row icon="cart-outline" label="Cart" onPress={() => router.push('/(tabs)/cart')} />
        <Row icon="pricetags-outline" label="My deals" onPress={() => router.push('/deals' as any)} />
        <Row icon="heart-outline" label="Saved products" onPress={() => router.push('/saved')} />
      </View>

      <View style={styles.card}>
        <Row icon="notifications-outline" label="Notifications" onPress={() => router.push('/notifications')} />
        <Row icon="location-outline" label="Delivery addresses" onPress={() => router.push('/addresses')} />
        <Row icon="gift-outline" label="Refer & Earn" onPress={() => router.push('/rewards')} />
      </View>

      <View style={styles.card}>
        <UpdateRow />
      </View>

      <View style={styles.card}>
        <Row
          icon="log-out-outline"
          label="Sign out"
          destructive
          onPress={() =>
            Alert.alert('Sign out', 'Are you sure?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Sign out', style: 'destructive', onPress: () => signOut() },
            ])
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
  guest: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing['2xl'],
    backgroundColor: colors.background,
  },
  guestTitle: { ...typography.h2, color: colors.text, marginTop: spacing.md },
  guestHint: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing['2xl'],
  },
  signInBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing['3xl'],
    height: 48,
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  signInText: { ...typography.bodyStrong, color: colors.textOnPrimary },
  createText: { ...typography.bodyStrong, color: colors.primary },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing['2xl'],
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { ...typography.h2, color: colors.textOnPrimary },
  name: { ...typography.h3, color: colors.text },
  email: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  role: {
    ...typography.micro,
    color: colors.secondary,
    fontFamily: 'Inter_700Bold',
    marginTop: spacing.xs,
  },
  card: {
    ...shadows.card,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceRaised,
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowLabel: { ...typography.body, color: colors.text, flex: 1 },
  rowBody: { flex: 1 },
  rowSub: { ...typography.micro, color: colors.textMuted, marginTop: 2 },
  guestUpdateCard: {
    ...shadows.card,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceRaised,
    overflow: 'hidden',
    alignSelf: 'stretch',
    marginTop: spacing['2xl'],
  },
});
