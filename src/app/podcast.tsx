import { useMemo, useState } from 'react';
import {
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/api/supabase';
import { EmptyState, LoadingState } from '@/components/States';
import { ScreenColumn } from '@/components/Responsive';
import { colors, radius, shadows, spacing, typography } from '@/theme';

// Mirrors web /podcast (views/Podcast.tsx + components/podcast/*):
// cream page, "Filter by Category" sheet, "Recent Episodes" grid of
// EpisodeCards, then the "Blog & Insights" section with category tabs.

const CREAM = '#FDF5E6';
const CREAM_DARK = '#F5EDD5';
const SITE = 'https://shieldvase.io';
const S3 = 'https://shieldvase-bronze-images.s3.eu-north-1.amazonaws.com/';

const CATEGORIES = [
  { id: 'steel', name: 'Steel Industry', icon: 'business-outline' },
  { id: 'construction', name: 'Construction', icon: 'construct-outline' },
  { id: 'agriculture', name: 'Agriculture', icon: 'leaf-outline' },
  { id: 'energy', name: 'Energy & Petroleum', icon: 'flash-outline' },
  { id: 'market', name: 'Market Analysis', icon: 'trending-up-outline' },
  { id: 'technology', name: 'Technology', icon: 'hardware-chip-outline' },
] as const;

const BLOG_TABS = [
  { id: 'all', label: 'All' },
  { id: 'metals', label: 'Metals' },
  { id: 'construction', label: 'Construction' },
  { id: 'agriculture', label: 'Agriculture' },
  { id: 'b2b guides', label: 'B2B Guides' },
  { id: 'case studies', label: 'Case Studies' },
  { id: 'expert articles', label: 'Expert Articles' },
];

// Web BlogInsights blogPosts — same titles/categories/descriptions/dates,
// images resolved from the shared staticImageRegistry S3 keys.
const BLOG_POSTS = [
  {
    title: 'How Rising Steel Prices Are Impacting the Construction Industry',
    category: 'Metals',
    description:
      'An in-depth analysis of steel price fluctuations and their effects on construction projects worldwide.',
    image: `${S3}static/blog/agriculture-animal-feed-1_optimized.jpg`,
    date: 'Mar 15, 2024',
  },
  {
    title: '5 Key Factors to Consider When Choosing a Bulk Supplier',
    category: 'B2B Guides',
    description:
      'Essential tips for businesses looking to establish long-term relationships with reliable suppliers.',
    image: `${S3}static/blog/blog-insights-3_optimized.jpg`,
    date: 'Mar 14, 2024',
  },
  {
    title: 'Small Construction Firm Cuts Costs by 30% Using Bulk Sourcing',
    category: 'Case Studies',
    description:
      "Learn how strategic procurement transformed this company's bottom line.",
    image: `${S3}static/blog/chemicals-hero_optimized.jpg`,
    date: 'Mar 13, 2024',
  },
  {
    title: 'Future of Smart Construction: AI in Material Procurement',
    category: 'Expert Articles',
    description:
      'Industry experts share insights on how AI is revolutionizing construction material sourcing.',
    image: `${S3}static/blog/energy-carousel-1_optimized.jpg`,
    date: 'Mar 12, 2024',
  },
  {
    title: 'Sustainable Agriculture Practices in Modern Farming',
    category: 'Agriculture',
    description:
      'Exploring eco-friendly farming methods and their impact on productivity.',
    image: `${S3}static/blog/metals-carousel-2_optimized.jpg`,
    date: 'Mar 11, 2024',
  },
  {
    title: 'Construction Technology Trends to Watch in 2024',
    category: 'Construction',
    description:
      'The latest innovations reshaping the construction industry landscape.',
    image: `${S3}static/blog/polymers-carousel-1_optimized.jpg`,
    date: 'Mar 10, 2024',
  },
];

type Episode = {
  id: string;
  number: string;
  title: string;
  host: string;
  duration: string;
  color: string;
  category: string;
};

const useEpisodes = (category: string | null) =>
  useQuery({
    queryKey: ['podcast-episodes', category],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      let q = supabase
        .from('podcast_episodes')
        .select('id, episode_number, title, host, duration, color, category')
        .eq('is_published', true)
        .order('created_at', { ascending: false });
      if (category) q = q.eq('category', category);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []).map((e: any) => ({ ...e, number: e.episode_number })) as Episode[];
    },
  });

const slugify = (t: string) =>
  t.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');

function EpisodeCard({ episode }: { episode: Episode }) {
  const open = () => Linking.openURL(`${SITE}/podcast/${slugify(episode.title)}`);
  return (
    <Pressable onPress={open} style={styles.epCard}>
      <View style={[styles.epTile, { backgroundColor: episode.color || colors.navy }]}>
        <Text style={styles.epNumber}>{episode.number}</Text>
        <View style={styles.epPodLabel}>
          <Ionicons name="mic-outline" size={12} color="rgba(255,255,255,0.9)" />
          <Text style={styles.epPodText}>Podcast</Text>
        </View>
      </View>
      <View style={styles.epBody}>
        <Text style={styles.epLabel}>Episode {episode.number.split('-')[1]}</Text>
        <Text style={styles.epTitle} numberOfLines={2}>{episode.title}</Text>
        <View style={styles.epHost}>
          <Ionicons name="mic-outline" size={13} color={colors.textMuted} />
          <Text style={styles.epHostText} numberOfLines={1}>{episode.host}</Text>
        </View>
        <View style={styles.epFoot}>
          <View style={styles.playBtn}>
            <Ionicons name="play" size={12} color={colors.textOnPrimary} />
            <Text style={styles.playBtnText}>Play</Text>
          </View>
          <View style={styles.epDuration}>
            <Ionicons name="time-outline" size={13} color={colors.textMuted} />
            <Text style={styles.epDurationText}>{episode.duration}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

export default function PodcastScreen() {
  const [category, setCategory] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [blogTab, setBlogTab] = useState('all');
  const episodes = useEpisodes(category);

  const filteredPosts = useMemo(
    () =>
      blogTab === 'all'
        ? BLOG_POSTS
        : BLOG_POSTS.filter((p) => p.category.toLowerCase() === blogTab),
    [blogTab],
  );

  const activeCat = CATEGORIES.find((c) => c.id === category);

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: 'Podcast' }} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <ScreenColumn pad={false}>
          <View style={{ padding: spacing.lg }}>
            {/* Filter by Category — web mobile sheet trigger */}
            <Pressable style={styles.filterBtn} onPress={() => setFilterOpen(true)}>
              <Ionicons name="filter-outline" size={15} color={colors.text} />
              <Text style={styles.filterBtnText}>
                {activeCat ? activeCat.name : 'Filter by Category'}
              </Text>
              <Ionicons name="chevron-down" size={14} color={colors.textMuted} />
            </Pressable>

            {/* Recent Episodes */}
            <Text style={styles.h1}>Recent Episodes</Text>
            <Text style={styles.sub}>
              Stay updated with the latest insights and trends in the manufacturing industry
            </Text>

            {episodes.isLoading ? (
              <LoadingState label="Loading episodes…" />
            ) : !episodes.data?.length ? (
              <EmptyState title="No episodes in this category yet" />
            ) : (
              episodes.data.map((ep) => <EpisodeCard key={ep.id} episode={ep} />)
            )}
          </View>
        </ScreenColumn>

        {/* Blog & Insights — web section bg #F5EDD5 */}
        <View style={styles.blogSection}>
          <ScreenColumn pad={false}>
            <View style={{ padding: spacing.lg }}>
              <Text style={styles.blogTitle}>Blog &amp; Insights</Text>
              <Text style={styles.blogSub}>
                Stay informed with the latest trends, expert analysis, and success stories
                from the industry.
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsRow}>
                {BLOG_TABS.map((t) => (
                  <Pressable
                    key={t.id}
                    onPress={() => setBlogTab(t.id)}
                    style={[styles.tab, blogTab === t.id && styles.tabActive]}
                  >
                    <Text style={[styles.tabText, blogTab === t.id && styles.tabTextActive]}>
                      {t.label}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
              {filteredPosts.map((p) => (
                <View key={p.title} style={styles.blogCard}>
                  <Image source={{ uri: p.image }} style={styles.blogImg} contentFit="cover" transition={150} />
                  <View style={styles.blogBody}>
                    <Text style={styles.blogCat}>{p.category}</Text>
                    <Text style={styles.blogCardTitle}>{p.title}</Text>
                    <Text style={styles.blogDesc}>{p.description}</Text>
                    <Text style={styles.blogDate}>{p.date}</Text>
                  </View>
                </View>
              ))}
              <Pressable
                style={styles.loadMore}
                onPress={() => Linking.openURL(`${SITE}/guides`)}
              >
                <Text style={styles.loadMoreText}>Load More Articles</Text>
              </Pressable>
            </View>
          </ScreenColumn>
        </View>
      </ScrollView>

      {/* Category filter sheet — web Sheet side="left" adapted to bottom sheet */}
      <Modal visible={filterOpen} transparent animationType="slide" onRequestClose={() => setFilterOpen(false)}>
        <Pressable style={styles.sheetBackdrop} onPress={() => setFilterOpen(false)} />
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>Categories</Text>
          <ScrollView>
            <Pressable
              onPress={() => {
                setCategory(null);
                setFilterOpen(false);
              }}
              style={[styles.sheetOption, category === null && styles.sheetOptionActive]}
            >
              <Text style={[styles.sheetOptionText, category === null && styles.sheetOptionTextActive]}>
                All Episodes
              </Text>
            </Pressable>
            {CATEGORIES.map((c) => (
              <Pressable
                key={c.id}
                onPress={() => {
                  setCategory(c.id);
                  setFilterOpen(false);
                }}
                style={[styles.sheetOption, category === c.id && styles.sheetOptionActive]}
              >
                <Ionicons
                  name={c.icon as any}
                  size={15}
                  color={category === c.id ? colors.textOnPrimary : colors.textMuted}
                />
                <Text
                  style={[styles.sheetOptionText, category === c.id && styles.sheetOptionTextActive]}
                >
                  {c.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: CREAM },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surfaceRaised,
    marginBottom: spacing.lg,
  },
  filterBtnText: { ...typography.bodyStrong, color: colors.text, fontSize: 13 },
  h1: { ...typography.h1, color: colors.text, fontSize: 26, marginBottom: spacing.xs },
  sub: { ...typography.body, color: colors.textMuted, fontSize: 14, marginBottom: spacing.lg },
  epCard: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginBottom: spacing.lg,
    ...shadows.card,
  },
  epTile: { height: 140, padding: spacing.lg, justifyContent: 'flex-start' },
  epNumber: { ...typography.h1, color: '#FFFFFF', fontSize: 24 },
  epPodLabel: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  epPodText: { ...typography.caption, color: 'rgba(255,255,255,0.9)' },
  epBody: { padding: spacing.lg },
  epLabel: { ...typography.captionStrong, color: '#F97316', fontSize: 12, marginBottom: 4 },
  epTitle: { ...typography.h3, color: colors.text, fontSize: 16, marginBottom: spacing.sm },
  epHost: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.md },
  epHostText: { ...typography.caption, color: colors.textMuted, flex: 1 },
  epFoot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  playBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#000000',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  playBtnText: { ...typography.captionStrong, color: colors.textOnPrimary, fontSize: 12 },
  epDuration: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  epDurationText: { ...typography.caption, color: colors.textMuted },
  blogSection: { backgroundColor: CREAM_DARK, paddingVertical: spacing.sm },
  blogTitle: { ...typography.h1, color: colors.text, fontSize: 26, textAlign: 'center', marginBottom: spacing.sm },
  blogSub: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.lg,
    fontSize: 14,
  },
  tabsRow: { flexGrow: 0, marginBottom: spacing.lg },
  tab: {
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
  },
  tabActive: { backgroundColor: colors.primary },
  tabText: { ...typography.bodyStrong, color: colors.text, fontSize: 13 },
  tabTextActive: { color: colors.textOnPrimary },
  blogCard: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginBottom: spacing.lg,
    ...shadows.card,
  },
  blogImg: { height: 160, width: '100%' },
  blogBody: { padding: spacing.lg },
  blogCat: { ...typography.captionStrong, color: colors.primary, fontSize: 11, marginBottom: 4 },
  blogCardTitle: { ...typography.h3, color: colors.text, fontSize: 15, marginBottom: spacing.xs },
  blogDesc: { ...typography.body, color: colors.textMuted, fontSize: 13, marginBottom: spacing.sm },
  blogDate: { ...typography.micro, color: colors.textFaint },
  loadMore: {
    alignSelf: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing['2xl'],
    paddingVertical: spacing.md,
    marginBottom: spacing.lg,
  },
  loadMoreText: { ...typography.bodyStrong, color: colors.textOnPrimary },
  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    backgroundColor: colors.surfaceRaised,
    borderTopLeftRadius: radius['2xl'],
    borderTopRightRadius: radius['2xl'],
    padding: spacing.lg,
    paddingBottom: spacing['3xl'],
    maxHeight: '70%',
  },
  sheetTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.md },
  sheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  sheetOptionActive: { backgroundColor: colors.primary },
  sheetOptionText: { ...typography.body, color: colors.text },
  sheetOptionTextActive: { color: colors.textOnPrimary, fontFamily: 'Inter_600SemiBold' },
});
