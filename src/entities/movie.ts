import { BaseMedia } from './base-media';

export interface Movie extends BaseMedia {
  traktId: number;
  imdbId: string;
  tmdbId?: number;
  tagline?: string;
  released?: string;
  relatedImdbIds: string[];
}
