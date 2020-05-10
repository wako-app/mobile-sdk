import { BaseMedia } from './base-media';

export interface Movie extends BaseMedia {
  tagline?: string;
  released?: string;
  relatedImdbIds: string[];
}
