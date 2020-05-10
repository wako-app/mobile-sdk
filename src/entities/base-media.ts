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

export interface BaseIds {
  trakt?: number;
  simkl?: number;
  imdb?: string;
  tmdb?: number;
  tvdb?: string;
}

export interface BaseCommonMedia {
  type: 'movie' | 'show' | 'anime' | 'season' | 'episode';
  title: string;
  overview: string;
  rating: number;
  votes: number;
  ratings: BaseMediaRatings | { [key: string]: BaseMediaRating };
  imagesUrl: BaseMediaImage;
  ids: BaseIds;
}

export interface BaseMedia extends BaseCommonMedia {
  year: number;
  certification?: string;
  runtime: number;
  genres: string[];
  status: string;
  alternativeTitles: { [key: string]: string };
  originalTitle: string;
  trailer: string;
  language: string;
}
