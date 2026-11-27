// Mirrors web src/types/podcast.ts Episode, plus `slug` (DB column used for
// routing — web matches it directly in fetchPodcastEpisode).

export type StreamingPlatform = {
  platform: string;
  url: string;
};

export type Episode = {
  id: string;
  number: string;
  title: string;
  slug: string;
  host: string;
  duration: string;
  color: string;
  category: string;
  description?: string;
  fullDescription?: string;
  guests?: string[];
  releaseDate?: string;
  keyTopics?: string[];
  streamingLinks?: StreamingPlatform[];
};
