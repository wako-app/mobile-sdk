import { Episode } from './episode';
import { BaseCommonMedia } from './base-media';

export interface Season extends BaseCommonMedia {
  number: number;
  code: string;
  isSpecial: boolean;
  tvdbId: number;
  firstAired: string;
  network: string;
  airedEpisodes: number;
  episodeCount: number;
  episodes: Episode[];
  totalEpisodesWatched: number;
  status: 'completed' | 'waiting for new episode' | 'in progress';
  /**
   * @deprecated use number
   */
  traktNumber: number;
}
