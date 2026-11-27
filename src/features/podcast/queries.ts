import { useQuery } from '@tanstack/react-query';
import { fetchPodcastEpisode, fetchPodcastEpisodes } from './api';

// Same query keys + 5-min staleTime as the web hooks.
export const usePodcastEpisodes = (category: string | null) =>
  useQuery({
    queryKey: ['podcast-episodes', category],
    staleTime: 5 * 60 * 1000,
    queryFn: () => fetchPodcastEpisodes(category),
  });

export const usePodcastEpisode = (slug: string | undefined) =>
  useQuery({
    queryKey: ['podcast-episode', slug],
    staleTime: 5 * 60 * 1000,
    enabled: !!slug,
    queryFn: () => fetchPodcastEpisode(slug as string),
  });
