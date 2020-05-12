import { BaseIds } from './base-media';

export interface MovieItem {
  ids: BaseIds;
  title: string;
  year: number;
  rating: number;
  poster: string;
  certification: string;
  genres: string[];
}
