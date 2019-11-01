import { WakoPlaylistVideo } from '../../entities/wako-playlist-video';
import { Subject } from 'rxjs';

export class WakoPlaylistService {
  private static playlistVideos: WakoPlaylistVideo[] = [];

  static playlistVideosChange$ = new Subject<WakoPlaylistVideo[]>();

  static set(videos: WakoPlaylistVideo[]) {
    this.playlistVideos = videos;

    this.playlistVideosChange$.next(this.playlistVideos);
  }

  static get() {
    return this.playlistVideos;
  }

  static add(videos: WakoPlaylistVideo[]) {
    this.playlistVideos.push(...videos);

    this.playlistVideosChange$.next(this.playlistVideos);
  }

  static setCurrent(url: string) {
    let currentFound = false;
    this.playlistVideos.forEach(playlistVideo => {
      if (playlistVideo.url === url) {
        currentFound = true;
      }

      playlistVideo.isCurrent = playlistVideo.url === url;
    });

    if (currentFound) {
      this.playlistVideosChange$.next(this.playlistVideos);
    }
  }

  static getCurrent() {
    return this.playlistVideos.find(playlistVideo => playlistVideo.isCurrent);
  }

  static next() {
    let nextIndex = null;
    this.playlistVideos.forEach((playlistVideo, index) => {
      if (playlistVideo.isCurrent) {
        nextIndex = index + 1;
      }
    });

    if (this.playlistVideos[nextIndex]) {
      this.setCurrent(this.playlistVideos[nextIndex].url);
    }
  }

  static previous() {
    let previousIndex = null;
    this.playlistVideos.forEach((playlistVideo, index) => {
      if (playlistVideo.isCurrent) {
        previousIndex = index - 1;
      }
    });

    if (this.playlistVideos[previousIndex]) {
      this.setCurrent(this.playlistVideos[previousIndex].url);
    }
  }
}
