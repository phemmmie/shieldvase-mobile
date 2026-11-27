// Port of web hooks/usePodcastEpisodes.ts data layer — podcast_episodes table,
// snake_case -> camelCase transform kept identical.

import { supabase } from '@/api/supabase';
import type { Episode } from './types';

interface DatabaseEpisode {
  id: string;
  episode_number: string;
  title: string;
  slug: string;
  host: string;
  duration: string;
  color: string;
  category: string;
  description: string;
  full_description: string;
  guests: string[];
  release_date: string;
  key_topics: string[];
  streaming_links: { platform: string; url: string }[];
  is_published: boolean;
  created_at: string;
}

const transformEpisode = (db: DatabaseEpisode): Episode => ({
  id: db.id,
  number: db.episode_number,
  title: db.title,
  slug: db.slug,
  host: db.host,
  duration: db.duration,
  color: db.color,
  category: db.category,
  description: db.description || undefined,
  fullDescription: db.full_description || undefined,
  guests: db.guests || undefined,
  releaseDate: db.release_date || undefined,
  keyTopics: db.key_topics || undefined,
  streamingLinks: db.streaming_links || undefined,
});

export const fetchPodcastEpisodes = async (
  category: string | null,
): Promise<Episode[]> => {
  let q = supabase
    .from('podcast_episodes')
    .select('*')
    .eq('is_published', true)
    .order('created_at', { ascending: false });
  if (category) q = q.eq('category', category);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map(transformEpisode);
};

export const fetchPodcastEpisode = async (slug: string): Promise<Episode> => {
  const { data, error } = await supabase
    .from('podcast_episodes')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single();
  if (error) throw error;
  return transformEpisode(data as DatabaseEpisode);
};
