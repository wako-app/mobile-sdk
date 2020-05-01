import { BaseCommonMedia } from './base-media';

export interface Episode extends BaseCommonMedia {
  seasonNumber: number;
  number: number;
  absoluteNumber: number;
  code: string;
  tvdbId: number;
  firstAired: string;
  runtime: number;
  watched: boolean;

  /**
   * @deprecated use seasonNumber
   */
  traktSeasonNumber: number;

  /**
   * @deprecated use number
   */
  traktNumber: number;
}
