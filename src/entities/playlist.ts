import { PlaylistVideo } from './playlist-video';

export interface Playlist {
  id: string;
  label: string;
  currentItem: number;
  updatedAt?: string;
  poster: string;
  items: PlaylistVideo[];
  customData?: {
    kodi?: {
      subtitleEnabled: boolean;
      currentSubtitleIndex: number;
      currentAudioStream: number;
    };
  };
}
