import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/features/auth/AuthContext';
import { useDeleteAddress, useUserAddresses } from '@/features/addresses/queries';
import { EmptyState, ErrorState, LoadingState } from '@/components/States';
import { colors, radius, spacing, typography } from '@/theme';
import { ScreenColumn } from '@/components/Responsive';

export default function AddressesScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const q = useUserAddresses(session?.user.id);
  const del = useDeleteAddress(session?.user.id);

  const confirmDelete = (id: string) =>
    Alert.alert('Delete address', 'Remove this delivery address?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => del.mutate(id) },
    ]);

  return (
    <View style={styles.screen}>
      <Stack.Screen
        options={{
          title: 'Delivery addresses',
          headerRight: () => (
            <Pressable onPress={() => router.push('/address-form')} hitSlop={8}>
              <Ionicons name="add-circle" size={24} color={colors.primary} />
            </Pressable>
          ),
        }}
      />
      {!session ? (
        <EmptyState title="Sign in to manage addresses" />
      ) : q.isLoading ? (
        <LoadingState label="Loading addresses…" />
      ) : q.isError ? (
        <ErrorState onRetry={() => q.refetch()} />
      ) : !q.data?.length ? (
        <View style={styles.emptyWrap}>
          <EmptyState title="No saved addresses" hint="Add one to check out faster." />
          <Pressable style={styles.addBtn} onPress={() => router.push('/address-form')}>
            <Text style={styles.addBtnText}>Add address</Text>
          </Pressable>
        </View>
      ) : (
                  <ScreenColumn pad={false} style={{ flex: 1 }}>
                    <FlatList
            data={q.data}
            keyExtractor={(a) => a.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <Pressable
                style={styles.card}
                onPress={() => router.push(`/address-form?id=${item.id}` as any)}
              >
                <View style={styles.cardHead}>
                  <Text style={styles.label}>{item.label || 'Address'}</Text>
                  {item.is_primary && (
                    <View style={styles.primaryBadge}>
                      <Text style={styles.primaryText}>PRIMARY</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.name}>{item.full_name}</Text>
                <Text style={styles.line}>{item.street_address}</Text>
                <Text style={styles.line}>
                  {item.city}, {item.state}
                  {item.postal_code ? ` ${item.postal_code}` : ''}
                </Text>
                {!!item.phone && <Text style={styles.line}>{item.phone}</Text>}
                <Pressable style={styles.delete} onPress={() => confirmDelete(item.id)} hitSlop={8}>
                  <Ionicons name="trash-outline" size={16} color={colors.destructive} />
                </Pressable>
              </Pressable>
            )}
          />
                  </ScreenColumn>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.lg, gap: spacing.md },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  addBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing['3xl'],
    height: 48,
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  addBtnText: { ...typography.bodyStrong, color: colors.textOnPrimary },
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.md,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
  label: { ...typography.caption, color: colors.textMuted, fontFamily: 'Inter_700Bold', textTransform: 'uppercase' },
  primaryBadge: {
    backgroundColor: colors.secondary,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  primaryText: { ...typography.micro, color: colors.textOnPrimary, fontFamily: 'Inter_700Bold' },
  name: { ...typography.bodyStrong, color: colors.text },
  line: { ...typography.body, color: colors.textMuted, marginTop: 2 },
  delete: { position: 'absolute', top: spacing.md, right: spacing.md },
});
