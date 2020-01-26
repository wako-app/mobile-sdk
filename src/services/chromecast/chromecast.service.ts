import { Observable, of, ReplaySubject, Subject, throwError } from 'rxjs';
import { first, switchMap } from 'rxjs/operators';
import { OpenMedia } from '../kodi/services/kodi-app.service';

declare const chrome: any;

export interface ChromecastMedia {
  addUpdateListener: (isAlive) => void;
  currentItemId: number;
  currentTime: number;
  media: ChromecastMediaInfo;
  mediaSessionId: number;
  playbackRate: number;
  playerState: 'PLAYING' | 'BUFFERING' | 'PAUSED' | 'IDLE';
  preloadedItemId: number;
  sessionId: string;
  volume: ChromecastVolume;
  play: () => void;
  pause: () => void;
  stop: () => void;
  seek: ({ currentTime: number }) => void;
  setVolume: ({ volume: ChromecastVolume }) => void;
}

export interface ChromecastVolume {
  level: number;
  muted: false;
}

export interface ChromecastMediaInfo {
  customData: any;
  contentId: string;
  streamType: string;
  contentType: string;
  metadata: any;
  duration: number;
}

export class ChromecastService {
  static connected$ = new ReplaySubject<boolean>(1);

  static isPlaying$ = new ReplaySubject<boolean>(1);

  static media$ = new ReplaySubject<ChromecastMedia>(1);

  static receiverStatus$ = new ReplaySubject<'unavailable' | 'available'>(1);

  static media: ChromecastMedia;

  private static initialized$ = new ReplaySubject<boolean>(1);

  private static receiverStatus: 'unavailable' | 'available';

  private static session;

  private static sessionChanged$ = new Subject();

  private static refreshMediaInterval: any;

  static initialize() {
    console.log('CAST', 'initialize');

    const apiConfig = new chrome.cast.ApiConfig(
      new chrome.cast.SessionRequest(
        chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID
      ),
      session => {
        // The session listener is only called under the following conditions:
        // * will be called shortly chrome.cast.initialize is run
        // * if the device is already connected to a cast session
        // Basically, this is what allows you to re-use the same cast session
        // across different pages and after app restarts

        setTimeout(() => {
          this.onExistingSessionJoined(session);
        }, 1000);
      },
      receiverStatus => {
        // receiverAvailable is a boolean.
        // True = at least one chromecast device is available
        // False = No chromecast devices available
        // You can use this to determine if you want to show your chromecast icon
        this.onReceiverStatusChanged(receiverStatus);
      },
      chrome.cast.AutoJoinPolicy.TAB_AND_ORIGIN_SCOPED,
      chrome.cast.DefaultActionPolicy.CREATE_SESSION
    );

    chrome.cast.initialize(
      apiConfig,
      () => {
        console.log('CAST', 'chrome.cast.initialize success');
        this.initialized$.next(true);
      },
      err => {
        console.log('CAST', 'chrome.cast.initialize success', err);
      }
    );

    // TEST

    // setTimeout(() => {
    //   this.openUrl('test', 'https://ia801302.us.archive.org/1/items/TheWater_201510/TheWater.mp4').subscribe(open => {
    //     console.log('OPEN', open);
    //   });
    // }, 2000);
  }

  private static onExistingSessionJoined(session) {
    console.log('CAST', 'onExistingSessionJoined', session);

    this.session = session;

    this.session.addUpdateListener(isAlive => {
      console.log('CAST', 'addUpdateListener - isAlive', isAlive);
      if (!isAlive) {
        this.session = null;

        this.connected$.next(false);
      }

      this.sessionChanged$.next(true);
    });

    this.connected$.next(true);

    this.sessionChanged$.next(true);

    if (session.media.length > 0) {
      this.handleMedia(session.media[0]);
    }
  }

  private static onReceiverStatusChanged(status) {
    console.log('CAST', 'onReceiverStatusChanged', status);
    this.receiverStatus = status;
    this.receiverStatus$.next(status);
  }

  private static requestSession() {
    // This will open a native dialog that will let
    // the user choose a chromecast to connect to
    // (Or will let you disconnect if you are already connected)

    if (this.receiverStatus === 'unavailable') {
      console.log('CAST', 'receiver is unavailable');
      return throwError('No receiver available');
    }

    if (this.session) {
      return of(true);
    }

    console.log('CAST', 'Called requestSession');

    return new Observable(observer => {
      const timer = setTimeout(() => {
        observer.error('Failed to request session timeout');
      }, 100000);

      chrome.cast.requestSession(
        session => {
          console.log('CAST', 'chrome.cast.requestSession success');
          this.sessionChanged$.subscribe(() => {
            if (timer) {
              clearTimeout(timer);
            }

            console.log('CAST', 'sessionChanged$');
            observer.next(true);
            observer.complete();
          });

          this.onExistingSessionJoined(session);
        },
        err => {
          console.log(
            'CAST',
            'chrome.cast.requestSession error',
            err && err.description ? err.description : err
          );
          observer.error(err && err.description ? err.description : err);
        }
      );
    });
  }

  static leave() {
    if (this.session) {
      console.log('CAST', 'session leave');
      this.session.leave();

      this.session = null;
      this.media = null;

      this.isPlaying$.next(false);
      this.connected$.next(false);
      this.media$.next(null);
    }
  }

  private static getContentType(url: string) {
    if (url) {
      return `video/${url.split('.').pop()}`;
    }
    return 'video/mp4';
  }

  private static loadMedia(
    title: string,
    url: string,
    poster = null,
    openMedia: OpenMedia = null,
    contentType = null,
    customData = {},
    metadata = {} as any
  ) {
    if (!this.session) {
      console.log('CAST', 'loadMedia no session');
      return throwError('Not connected to a cast device');
    }

    if (typeof contentType !== 'string') {
      contentType = this.getContentType(url);
    }

    console.log(
      'CAST',
      'Called - loadMedia',
      title,
      url,
      contentType,
      customData,
      metadata
    );

    const mediaInfo: ChromecastMediaInfo = new chrome.cast.media.MediaInfo(
      url,
      contentType
    );

    mediaInfo.customData = customData || {};

    if (openMedia) {
      mediaInfo.customData['openMedia'] = openMedia;
    }

    const defaultMetadata = {
      title: title
    };

    if (poster) {
      defaultMetadata['images'] = [new chrome.cast.Image(poster)];
    }

    mediaInfo.metadata = Object.assign(defaultMetadata, metadata);

    return new Observable(observer => {
      this.session.loadMedia(
        new chrome.cast.media.LoadRequest(mediaInfo),
        (media: ChromecastMedia) => {
          this.handleMedia(media);

          observer.next(true);
          observer.complete();
        },
        err => {
          console.log('CAST', 'sessionRequest.loadMedia error', err);
          observer.error(err);
        }
      );
    });
  }

  private static handleMedia(media: ChromecastMedia) {
    console.log('CAST', 'sessionRequest.loadMedia success', media);

    this.media = media;

    // This may not works if is playing before starting the app
    this.media.addUpdateListener(isAlive => {
      console.log('CAST', 'addUpdateListener');
      this.refreshMedia(isAlive);

      clearInterval(this.refreshMediaInterval);
    });

    this.isPlaying$.next(true);

    this.media$.next(JSON.parse(JSON.stringify(this.media)));
  }

  private static refreshMedia(isAlive: boolean) {
    console.log('CAST', 'media.addUpdateListener', isAlive, this.media);

    if (!isAlive || this.media.playerState === 'IDLE') {
      this.isPlaying$.next(false);
      this.media$.next(null);
    } else {
      this.media$.next(JSON.parse(JSON.stringify(this.media)));
    }
  }

  static openUrl(
    title: string,
    url: string,
    poster = null,
    openMedia: OpenMedia = null,
    contentType = null,
    customData = {},
    metadata = {} as any
  ) {
    console.log('CAST', 'Called - openUrl', url);

    return this.initialized$.pipe(
      first(),
      switchMap(() => {
        return this.requestSession().pipe(
          switchMap(() => {
            return this.loadMedia(
              title,
              url,
              poster,
              openMedia,
              contentType,
              customData,
              metadata
            );
          })
        );
      })
    );
  }

  static play() {
    console.log('CAST', 'play');
    this.media.play();
  }

  static pause() {
    console.log('CAST', 'pause');
    this.media.pause();
  }

  static stop() {
    console.log('CAST', 'stop');
    this.media.stop();
  }

  static seek(currentTime: number) {
    this.media.seek({ currentTime: currentTime });
  }

  static setVolume(volume: number) {
    this.media.setVolume({ volume: volume });
  }
}
