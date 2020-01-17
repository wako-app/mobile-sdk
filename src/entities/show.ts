import { Season } from "./season";

export declare type ShowStatus = "ended" | "canceled" | "returning series";

export class Show {
  title: string;
  year: number;
  imdbId: string;
  tmdbId: number;
  tvdbId: number;
  traktId: number;
  slug: string;
  overview: string;
  firstAired: string;
  runtime: number;
  rating: number;
  votes: number;
  trailer: string;
  language: string;
  genres: string[];
  certification: any;
  airedEpisodes: number;
  images_url?: {
    poster?: string;
    backdrop?: string;
    poster_original?: string;
    backdrop_original?: string;
  };
  totalEpisodesWatched?: number;
  seasons?: Season[];
  alternativeTitles?: { [key: string]: string };
  originalTitle: string;
  status: ShowStatus;
  network: string;
}
