import { Episode } from './episode';

export class Season {
  traktNumber: number;
  code: string;
  isSpecial: boolean;
  title: string;
  imdbId: string;
  tmdbId: number;
  tvdbId: number;
  overview: string;
  firstAired: Date;
  network: string;
  rating: number;
  votes: number;
  airedEpisodes: number;
  episodeCount: number;
  episodes: Episode[];
  totalEpisodesWatched: number;
  status: 'completed' | 'waiting for new episode' | 'in progress';
}
