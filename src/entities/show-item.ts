import { BaseIds } from './base-media';

export interface ShowItem {
  type: 'shows' | 'anime';
  ids: BaseIds;
  title: string;
  year: number;
  rating: number;
  genres: string[];
  poster: string;
  certification: string;
  totalEpisodesWatched: number;
  airedEpisodes: number;
}
