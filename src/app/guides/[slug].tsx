import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/api/supabase';
import { ScreenColumn } from '@/components/Responsive';
import { LoadingState } from '@/components/States';
import { colors, radius, spacing, typography } from '@/theme';

// Mirrors web /guides/[slug] (views/GuideDetail.tsx): breadcrumb, cover image,
// category, title, "By author · date", paragraphs (split on blank lines),
// "Request a Quote" CTA → /rfq.

type GuideDetail = {
  id: string;
  title: string;
  slug: string;
  content: string;
  category: string;
  author: string;
  cover_image_url?: string | null;
  created_at: string;
};

export default function GuideDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();

  const { data: guide, isLoading } = useQuery({
    queryKey: ['guide', slug],
    enabled: !!slug,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('guides')
        .select('id, title, slug, content, category, author, cover_image_url, created_at')
        .eq('slug', slug)
        .eq('is_published', true)
        .maybeSingle();
      if (error) throw error;
      return data as GuideDetail | null;
    },
  });

  if (isLoading) {
    return <View style={styles.screen}><Stack.Screen options={{ title: 'Guide' }} /><LoadingState /></View>;
  }
  if (!guide) {
    return (
      <View style={styles.screen}>
        <Stack.Screen options={{ title: 'Not found' }} />
        <View style={styles.emptyWrap}><Text style={styles.emptyText}>Guide not found.</Text></View>
      </View>
    );
  }

  const paragraphs = guide.content.split(/\n\s*\n/).filter(Boolean);
  const publishedLabel = new Date(guide.created_at).toLocaleDateString('en-NG', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: guide.title }} />
      <ScrollView contentContainerStyle={{ paddingVertical: spacing.lg, paddingBottom: 48 }} showsVerticalScrollIndicator={false}>
        <ScreenColumn>
          <Pressable onPress={() => router.push('/guides' as any)}>
            <Text style={styles.breadcrumb}>Guides / {guide.category}</Text>
          </Pressable>
          {!!guide.cover_image_url && (
            <Image source={{ uri: guide.cover_image_url }} style={styles.cover} contentFit="cover" />
          )}
          <Text style={styles.cat}>{guide.category}</Text>
          <Text style={styles.h1}>{guide.title}</Text>
          <Text style={styles.meta}>By {guide.author} · {publishedLabel}</Text>
          <View style={styles.article}>
            {paragraphs.map((p, i) => (
              <Text key={i} style={styles.paragraph}>{p}</Text>
            ))}
          </View>
          <Pressable style={styles.rfqBtn} onPress={() => router.push('/rfq' as any)}>
            <Text style={styles.rfqBtnText}>Request a Quote</Text>
          </Pressable>
        </ScreenColumn>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FDF5E6' },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { ...typography.body, color: colors.textMuted },
  breadcrumb: { ...typography.caption, color: colors.textMuted, marginBottom: spacing.md },
  cover: { height: 220, borderRadius: radius.lg, marginBottom: spacing.lg, backgroundColor: colors.border },
  cat: { ...typography.micro, color: colors.primary, textTransform: 'uppercase', letterSpacing: 1 },
  h1: { ...typography.h1, color: colors.text, marginTop: spacing.xs },
  meta: { ...typography.caption, color: colors.textMuted, marginTop: spacing.sm, marginBottom: spacing.lg },
  article: { backgroundColor: '#fff', borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md, borderWidth: 1, borderColor: colors.border },
  paragraph: { ...typography.body, color: colors.text, lineHeight: 24 },
  rfqBtn: { marginTop: spacing.xl, backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: spacing.md, alignSelf: 'flex-start', paddingHorizontal: spacing.xl },
  rfqBtnText: { ...typography.bodyStrong, color: colors.textOnPrimary },
});
