import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/api/supabase';
import { ScreenColumn } from '@/components/Responsive';
import { LoadingState } from '@/components/States';
import { colors, radius, spacing, typography } from '@/theme';

// Mirrors web /guides (views/Guides.tsx): "Guides & Resources" header +
// card grid from the guides table (published, newest first) → /guides/[slug].

type Guide = {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  category: string;
  cover_image_url?: string | null;
};

export default function GuidesScreen() {
  const router = useRouter();
  const { data: guides = [], isLoading } = useQuery({
    queryKey: ['guides'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('guides')
        .select('id, title, slug, excerpt, category, cover_image_url')
        .eq('is_published', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Guide[];
    },
  });

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: 'Guides' }} />
      <ScrollView contentContainerStyle={{ paddingVertical: spacing.lg, paddingBottom: 48 }} showsVerticalScrollIndicator={false}>
        <ScreenColumn>
          <Text style={styles.h1}>Guides &amp; Resources</Text>
          <Text style={styles.sub}>Practical guides for buying construction and industrial materials in Nigeria.</Text>

          {isLoading ? (
            <LoadingState />
          ) : guides.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No guides published yet. Check back soon.</Text>
            </View>
          ) : (
            <View style={styles.grid}>
              {guides.map(g => (
                <Pressable key={g.id} style={styles.card} onPress={() => router.push(`/guides/${g.slug}` as any)}>
                  <View style={styles.cardImage}>
                    {g.cover_image_url ? (
                      <Image source={{ uri: g.cover_image_url }} style={StyleSheet.absoluteFill} contentFit="cover" />
                    ) : (
                      <Ionicons name="book-outline" size={34} color={colors.primary} />
                    )}
                  </View>
                  <View style={styles.cardBody}>
                    <Text style={styles.cardCat}>{g.category}</Text>
                    <Text style={styles.cardTitle}>{g.title}</Text>
                    {!!g.excerpt && <Text style={styles.cardExcerpt} numberOfLines={3}>{g.excerpt}</Text>}
                  </View>
                </Pressable>
              ))}
            </View>
          )}
        </ScreenColumn>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FDF5E6' },
  h1: { ...typography.h1, color: colors.text },
  sub: { ...typography.body, color: colors.textMuted, marginTop: 6, marginBottom: spacing.lg },
  emptyCard: { backgroundColor: colors.surfaceRaised, borderRadius: radius.lg, padding: spacing.xl, alignItems: 'center' },
  emptyText: { ...typography.body, color: colors.textMuted },
  grid: { gap: spacing.md },
  card: { backgroundColor: '#fff', borderRadius: radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
  cardImage: { height: 130, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  cardBody: { padding: spacing.md },
  cardCat: { ...typography.micro, color: colors.primary, textTransform: 'uppercase', letterSpacing: 1 },
  cardTitle: { ...typography.bodyStrong, color: colors.text, marginTop: 4 },
  cardExcerpt: { ...typography.caption, color: colors.textMuted, marginTop: 6, lineHeight: 19 },
});
