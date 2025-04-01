import { Observable } from 'rxjs';
import { OpenMedia } from './kodi/services/kodi-app.service';

export interface VideoPlayerExitEvent {
  currentTime: number;
  percent: number;
  openMedia?: OpenMedia;
}

export interface VideoPlayerTrackInfo {
  id: string;
  language: string;
  label: string;
  codecs?: string;
  bitrate?: number;
  channelCount?: number;
  sampleRate?: number;
  containerMimeType?: string;
  sampleMimeType?: string;
}
export interface VideoPlayerTracksChangedInfo {
  fromPlayerId: string;
  audioTrack?: VideoPlayerTrackInfo;
  subtitleTrack?: VideoPlayerTrackInfo;
}

export interface VideoPlayerEvents {
  onExit: Promise<VideoPlayerExitEvent>;
  onCurrentTime: Observable<{ currentTime: number; totalDuration: number }>;
  onTracksChanged: Observable<VideoPlayerTracksChangedInfo>;
  playerId: string;
}

export class WakoVideoPlayerService {
  static async openVideoUrl({
    videoUrl,
    startAt = 0,
    openMedia,
    title,
    poster,
  }: {
    videoUrl: string;
    startAt?: number;
    openMedia?: OpenMedia;
    title?: string;
    poster?: string;
  }): Promise<VideoPlayerEvents> {
    // TODO: Implement
    return {
      onExit: new Promise((resolve) => resolve({ currentTime: 0, percent: 0 })),
      onCurrentTime: new Observable((observer) => observer.next({ currentTime: 0, totalDuration: 0 })),
      onTracksChanged: new Observable((observer) =>
        observer.next({ fromPlayerId: '', audioTrack: undefined, subtitleTrack: undefined }),
      ),
      playerId: '',
    };
  }
}
