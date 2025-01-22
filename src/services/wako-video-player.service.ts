import { CapacitorVideoPlayer, capExitListener, capVideoListener } from 'capacitor-video-player';
import { Observable, Subject } from 'rxjs';
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
    const playerId = Math.random().toString(36).substring(2, 15);

    await CapacitorVideoPlayer.initPlayer({
      mode: 'fullscreen',
      playerId,
      url: videoUrl,
      displayMode: 'landscape',
      pipEnabled: false,
      chromecast: false,
      title,
      artwork: poster,
    });

    const listeners: any[] = [];

    // Setup keyboard controls
    const keyupHandler = async (e: KeyboardEvent) => {
      let handled = false;

      switch (e.key) {
        case 'MediaFastForward':
        case 'ArrowRight': {
          handled = true;
          const currentTime = await CapacitorVideoPlayer.getCurrentTime({ playerId });
          CapacitorVideoPlayer.setCurrentTime({ seektime: currentTime.value + 10, playerId });
          break;
        }
        case 'MediaRewind':
        case 'ArrowLeft': {
          handled = true;
          const currentTime = await CapacitorVideoPlayer.getCurrentTime({ playerId });
          CapacitorVideoPlayer.setCurrentTime({ seektime: Math.max(0, currentTime.value - 10), playerId });
          break;
        }
        case 'ArrowUp':
        case 'ArrowDown':
        case 'Enter':
          handled = true;
          CapacitorVideoPlayer.showController();
          break;

        case 'MediaPlay':
          handled = true;
          CapacitorVideoPlayer.play({ playerId });
          break;

        case 'MediaPause':
          handled = true;
          CapacitorVideoPlayer.pause({ playerId });
          break;

        case 'MediaStop':
          handled = true;
          CapacitorVideoPlayer.exitPlayer();
          break;

        case 'MediaPlayPause':
          handled = true;
          const isPlaying = await CapacitorVideoPlayer.isPlaying({ playerId });
          if (isPlaying.value) {
            CapacitorVideoPlayer.pause({ playerId });
          } else {
            CapacitorVideoPlayer.play({ playerId });
          }
          break;
      }

      if (handled) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    let backPressTimer: ReturnType<typeof setTimeout>;
    const keydownHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        backPressTimer = setTimeout(async () => {
          await CapacitorVideoPlayer.exitPlayer();
        }, 800);
      }
    };

    document.addEventListener('keyup', keyupHandler);
    document.addEventListener('keydown', keydownHandler);

    let duration: number;
    // Create subject for time updates
    const timeSubject = new Subject<{ currentTime: number; totalDuration: number }>();

    // Setup interval for time updates
    const timeInterval = setInterval(async () => {
      try {
        const currentTime = await CapacitorVideoPlayer.getCurrentTime({ playerId });
        timeSubject.next({ currentTime: currentTime.value, totalDuration: duration });
      } catch (error) {
        timeSubject.error(error);
      }
    }, 2000);

    // Modify cleanup to include timeInterval and subject
    const cleanup = () => {
      document.removeEventListener('keyup', keyupHandler);
      document.removeEventListener('keydown', keydownHandler);
      listeners.forEach((listener) => listener.remove());
      clearInterval(timeInterval);
      timeSubject.complete();
    };

    // Play video and return events object
    CapacitorVideoPlayer.play({ playerId });

    const l = await CapacitorVideoPlayer.addListener('jeepCapVideoPlayerReady', async () => {
      duration = (await CapacitorVideoPlayer.getDuration({ playerId })).value;

      if (startAt) {
        CapacitorVideoPlayer.setCurrentTime({ seektime: startAt, playerId });
        l.remove();
      }
    });

    return {
      onExit: new Promise((resolve) => {
        const exitListener = CapacitorVideoPlayer.addListener('jeepCapVideoPlayerExit', (e: capExitListener) => {
          cleanup();
          resolve({ currentTime: e.currentTime, percent: Math.round((e.currentTime / duration) * 100), openMedia });
        });

        const endedListener = CapacitorVideoPlayer.addListener('jeepCapVideoPlayerEnded', (e: capVideoListener) => {
          cleanup();
          resolve({ currentTime: e.currentTime, percent: Math.round((e.currentTime / duration) * 100), openMedia });
        });

        listeners.push(exitListener, endedListener);
      }),
      onCurrentTime: timeSubject.asObservable(),
      playerId,
    } as VideoPlayerEvents;
  }
}
