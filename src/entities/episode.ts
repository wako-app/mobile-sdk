import { BaseCommonMedia } from './base-media';

export interface Episode extends BaseCommonMedia {
  seasonNumber: number;
  number: number;
  absoluteNumber: number;
  code: string;
  firstAired: string;
  runtime: number;
  watched: boolean;
}
