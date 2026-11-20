import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/features/auth/AuthContext';
import { useWishlistToggle } from '@/features/wishlist/queries';
import { EmptyState, LoadingState } from '@/components/States';
import { colors, radius, spacing, typography } from '@/theme';
import { formatNaira } from '@/utils/money';
import { buildProductParam } from '@/utils/productUrl';
import { ScreenColumn } from '@/components/Responsive';

export default function SavedProductsScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const { items, remove, isLoading } = useWishlistToggle(session?.user.id);

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: 'Saved products' }} />
      {!session ? (
        <EmptyState title="Sign in to see saved products" />
      ) : isLoading ? (
        <LoadingState label="Loading saved products…" />
      ) : !items.length ? (
        <EmptyState
          title="Nothing saved yet"
          hint="Tap the heart on a product to save it for later."
        />
      ) : (
                  <ScreenColumn pad={false} style={{ flex: 1 }}>
                    <FlatList
            data={items}
            keyExtractor={(i) => i.id}
            numColumns={2}
            columnWrapperStyle={{ gap: spacing.sm }}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <Pressable
                style={styles.card}
                onPress={() =>
                  item.slug &&
                  router.push(
                    `/product/${buildProductParam({ id: item.product_id, slug: item.slug })}` as any,
                  )
                }
              >
                <Image source={{ uri: item.image ?? undefined }} style={styles.image} contentFit="cover" />
                <View style={styles.body}>
                  <Text style={styles.name} numberOfLines={2}>
                    {item.name}
                  </Text>
                  {item.price != null && <Text style={styles.price}>{formatNaira(item.price)}</Text>}
                </View>
                <Pressable style={styles.remove} onPress={() => remove.mutate(item.id)} hitSlop={8}>
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
  list: { padding: spacing.lg },
  card: {
    flex: 1,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  image: { width: '100%', aspectRatio: 4 / 3, backgroundColor: colors.border },
  body: { padding: spacing.sm },
  name: { ...typography.body, color: colors.text, minHeight: 40 },
  price: { ...typography.bodyStrong, color: colors.primary, marginTop: spacing.xs },
  remove: { position: 'absolute', top: spacing.sm, right: spacing.sm, backgroundColor: colors.surfaceRaised, borderRadius: 14, padding: 6 },
});
