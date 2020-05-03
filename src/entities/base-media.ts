export interface BaseMediaImage {
  poster?: string;
  backdrop?: string;
  posterOriginal?: string;
  backdropOriginal?: string;
}

export interface BaseMediaRating {
  name: string;
  url?: string;
  imageUrl?: string;
  rating: number;
  votes: number;
}

export interface BaseMediaRatings {
  imdb?: BaseMediaRating;
  trakt?: BaseMediaRating;
}

export interface BaseCommonMedia {
  type: 'movie' | 'show' | 'season' | 'episode';
  title: string;
  overview: string;
  rating: number;
  votes: number;
  ratings: BaseMediaRatings | { [key: string]: BaseMediaRating };
  imagesUrl: BaseMediaImage;
  traktId: number;
  imdbId?: string;
  tmdbId?: number;
}

export interface BaseMedia extends BaseCommonMedia {
  year: number;
  certification: string;
  runtime: number;
  genres: string[];
  status: string;
  alternativeTitles: { [key: string]: string };
  originalTitle: string;
  trailer: string;
  language: string;
}
