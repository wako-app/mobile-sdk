import { BaseIds } from '../base-media';

export interface ExplorerFile {
  id: string;
  size: number;
  type?: 'movie' | 'show';
  ids?: BaseIds;
  seasonNumber?: number;
  episodeNumber?: number;
  /**
   * RAW Video URL without any transformation
   */
  link?: string;
  /**
   * Transcoded URL in a format that play on most device like Chrome cast
   */
  streamLink?: string;
  customData?: any; // Keep in mind that this object may be json encoded to be saved into storage, don't store any methods
}
