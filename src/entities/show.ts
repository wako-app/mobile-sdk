import { Season } from './season';
import { BaseMedia } from './base-media';

export declare type ShowStatus = 'ended' | 'canceled' | 'returning series';

export interface Show extends BaseMedia {
  imdbId: string;
  tmdbId: number;
  tvdbId: number;
  traktId: number;
  firstAired: string;
  status: ShowStatus;
  airedEpisodes: number;
  totalEpisodesWatched?: number;
  seasons?: Season[];
  network: string;
}
