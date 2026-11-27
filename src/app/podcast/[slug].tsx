import { useEffect } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { EmptyState, LoadingState } from '@/components/States';
import { ScreenColumn } from '@/components/Responsive';
import { colors, radius, shadows, spacing, typography } from '@/theme';
import { usePodcastEpisode } from '@/features/podcast/queries';
import type { Episode } from '@/features/podcast/types';

// Mirrors web /podcast/[slug] (views/PodcastEpisodeView + components/podcast/episode/*):
// colored header card → description → static AudioPlayer → KeyTopics →
// HostAndGuests → StreamingPlatforms (external links). Unknown slug → /podcast.

const AFRICAN = ['#E42D40', '#007749', '#FDB347', '#0067A5', '#000000'];
const CREAM = '#FDF5E6';

const formatDate = (iso?: string) => {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? null
    : d.toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' });
};

function HeaderCard({ episode }: { episode: Episode }) {
  const accent = episode.color || AFRICAN[1];
  const date = formatDate(episode.releaseDate);
  return (
    <View style={[styles.headerCard, { backgroundColor: accent }]}>
      <Text style={styles.epLabel}>Episode {episode.number}</Text>
      <Text style={styles.epTitle}>{episode.title}</Text>
      <View style={styles.metaRow}>
        {date && (
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={14} color="rgba(255,255,255,0.85)" />
            <Text style={styles.metaText}>{date}</Text>
          </View>
        )}
        <View style={styles.metaItem}>
          <Ionicons name="time-outline" size={14} color="rgba(255,255,255,0.85)" />
          <Text style={styles.metaText}>{episode.duration}</Text>
        </View>
      </View>
    </View>
  );
}

// Visual-only port of the web AudioPlayer (no playback — streaming links below).
function AudioPlayer() {
  return (
    <View style={styles.player}>
      <View style={styles.playBtn}>
        <Ionicons name="play" size={22} color="#fff" />
      </View>
      <View style={styles.playerBody}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { flex: 1 }]} />
          <View style={{ flex: 2 }} />
        </View>
        <View style={styles.playerMeta}>
          <Text style={styles.playerTime}>0:00</Text>
          <View style={styles.volumeRow}>
            <Ionicons name="volume-high" size={14} color="rgba(255,255,255,0.7)" />
            <View style={styles.volumeTrack}>
              <View style={[styles.progressFill, { flex: 2 }]} />
              <View style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

function KeyTopics({ topics }: { topics: string[] }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Key Topics</Text>
      <View style={styles.topicsWrap}>
        {topics.map((t) => (
          <View key={t} style={styles.topicChip}>
            <Ionicons name="checkmark-circle" size={14} color={colors.secondary} />
            <Text style={styles.topicText}>{t}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function HostAndGuests({ episode }: { episode: Episode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Host &amp; Guests</Text>
      <View style={styles.personRow}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={16} color={colors.textOnPrimary} />
        </View>
        <View>
          <Text style={styles.personName}>{episode.host}</Text>
          <Text style={styles.personRole}>Host</Text>
        </View>
      </View>
      {(episode.guests ?? []).map((g) => (
        <View key={g} style={styles.personRow}>
          <View style={[styles.avatar, styles.guestAvatar]}>
            <Ionicons name="person" size={16} color={colors.textOnPrimary} />
          </View>
          <View>
            <Text style={styles.personName}>{g}</Text>
            <Text style={styles.personRole}>Guest</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function StreamingPlatforms({ episode }: { episode: Episode }) {
  const links = episode.streamingLinks ?? [];
  if (!links.length) return null;
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Listen On</Text>
      {links.map((l) => (
        <Pressable
          key={l.platform}
          style={styles.platformRow}
          onPress={() => Linking.openURL(l.url)}
        >
          <Ionicons name="headset" size={18} color={colors.secondary} />
          <Text style={styles.platformName}>{l.platform}</Text>
          <Ionicons name="open-outline" size={16} color={colors.textMuted} />
        </Pressable>
      ))}
    </View>
  );
}

export default function PodcastEpisodeScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const episode = usePodcastEpisode(slug);

  useEffect(() => {
    if (episode.isError) router.replace('/podcast');
  }, [episode.isError, router]);

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: episode.data?.title ?? 'Episode' }} />
      {episode.isPending && <LoadingState label="Loading episode…" />}
      {episode.isError && (
        <EmptyState title="Episode not found" hint="This episode may have been removed." />
      )}
      {episode.data && (
        <ScrollView contentContainerStyle={styles.scroll}>
          <ScreenColumn>
            <HeaderCard episode={episode.data} />
            <AudioPlayer />
            {!!episode.data.fullDescription && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>About This Episode</Text>
                <Text style={styles.body}>{episode.data.fullDescription}</Text>
              </View>
            )}
            {!!episode.data.keyTopics?.length && (
              <KeyTopics topics={episode.data.keyTopics} />
            )}
            <HostAndGuests episode={episode.data} />
            <StreamingPlatforms episode={episode.data} />
          </ScreenColumn>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: CREAM },
  scroll: { padding: spacing.lg, paddingBottom: spacing['2xl'] },
  headerCard: {
    borderRadius: radius.lg,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    ...shadows.card,
  },
  epLabel: { ...typography.caption, color: 'rgba(255,255,255,0.85)', textTransform: 'uppercase' },
  epTitle: { ...typography.h2, color: '#fff', marginTop: spacing.xs },
  metaRow: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.md },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  metaText: { ...typography.caption, color: 'rgba(255,255,255,0.85)' },
  player: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: '#111827',
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  playBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerBody: { flex: 1, gap: spacing.sm },
  progressTrack: {
    flexDirection: 'row',
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
  },
  progressFill: { backgroundColor: colors.secondary },
  playerMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  playerTime: { ...typography.caption, color: 'rgba(255,255,255,0.7)' },
  volumeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, width: 90 },
  volumeTrack: {
    flex: 1,
    flexDirection: 'row',
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
  },
  section: { marginBottom: spacing.lg },
  sectionTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.sm },
  body: { ...typography.body, color: colors.text, lineHeight: 22 },
  topicsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  topicChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: '#fff',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    ...shadows.card,
  },
  topicText: { ...typography.caption, color: colors.text },
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: '#fff',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.card,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestAvatar: { backgroundColor: colors.navy },
  personName: { ...typography.body, color: colors.text, fontWeight: '600' },
  personRole: { ...typography.caption, color: colors.textMuted },
  platformRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: '#fff',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.card,
  },
  platformName: { flex: 1, ...typography.body, color: colors.text, fontWeight: '600' },
});
