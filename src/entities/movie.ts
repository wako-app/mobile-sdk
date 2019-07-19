import { MovieItem } from './movie-item';

export class Movie extends MovieItem {
  tagline?: string;
  overview: string;
  released?: string;
  runtime: number;
  trailer: string;
  language: string;
  genres: string[];
  relatedIds: string[] = [];
  alternativeTitles?: { [key: string]: string };
  originalTitle: string;
}
