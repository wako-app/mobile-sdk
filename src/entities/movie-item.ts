export class MovieItem {
  title: string;
  year: number;
  imdbId: string;
  traktId: number;
  tmdbId?: number;
  rating: number;
  votes: number;
  images_url?: {
    poster?: string;
    backdrop?: string;
    poster_original?: string;
    backdrop_original?: string;
  };
  certification: string;
  genres: string[];
}
