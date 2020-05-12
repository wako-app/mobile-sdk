import { Season } from './season';
import { BaseMedia } from './base-media';

export declare type ShowStatus = 'ended' | 'canceled' | 'returning series';
export declare type ShowAnimeType = 'tv' | 'special' | 'ova' | 'movie' | 'music video' | 'ona';

export interface Show extends BaseMedia {
  firstAired: string;
  status: ShowStatus;
  airedEpisodes: number;
  totalEpisodesWatched?: number;
  seasons?: Season[];
  network: string;
  animeType?: ShowAnimeType;
}
