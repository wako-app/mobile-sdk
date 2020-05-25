import { concat, from, Observable, of, ReplaySubject, Subject, throwError, timer } from 'rxjs';
import { distinctUntilChanged, map, mapTo, switchMap, takeUntil } from 'rxjs/operators';
import { wakoLog } from '../../../tools/utils.tool';
import { KodiHostStructure } from '../structures/kodi-host.structure';
import { KodiApiService } from './kodi-api.service';
import { KodiPlayerOpenForm } from '../forms/player/kodi-player-open.form';
import { EventCategory, EventName, EventService } from '../../event/event.service';
import { KodiPlayerGetAllActiveForm } from '../forms/player/kodi-player-get-all-active.form';
import { KodiPlayerStopForm } from '../forms/player/kodi-player-stop.form';
import { KodiPingForm } from '../forms/ping/kodi-ping.form';
import { PlaylistVideo } from '../../../entities/playlist-video';
import { PlaylistService } from '../../playlist/playlist.service';
import { KodiSeekToCommand } from '../commands/kodi-seek-to.command';
import { KodiPlayerSetSubtitleForm } from '../forms/player/kodi-player-set-subtitle.form';
import { KodiPlayerSetAudioStreamForm } from '../forms/player/kodi-player-set-audio-stream.form';
import { KodiApplicationGetPropertiesForm } from '../forms/application/kodi-application-get-properties.form';
import { WakoSettingsService } from '../../app/wako-settings.service';
import { BaseIds } from '../../../entities/base-media';

export class KodiAppService {
  private static storageCategoryHosts = 'kodi_hosts';

  private static storageCategoryCurrentHostIndex = 'kodi_current_host';

  static currentHost: KodiHostStructure;

  static appInBackground = false;

  /**
   * If connected via websocket or if the host is reachable via HTTP
   */
  static isConnected = false;

  /**
   * if connected via websocket
   */
  static isWsConnected = false;

  static wsConnection: WebSocket;

  static openMedia$ = new ReplaySubject<OpenMedia>(1);

  static connected$ = new ReplaySubject<KodiConnected>(1);

  private static isInitialized = false;

  static initialize() {
    if (this.isInitialized) {
      return;
    }

    this.isInitialized = true;

    KodiApiService.connected$.pipe(distinctUntilChanged()).subscribe((connected) => {
      if (this.appInBackground) {
        return;
      }

      wakoLog('mobile-sdk.KodiAppService::connected', connected);

      this.isConnected = connected;
      this.isWsConnected = connected;

      this.connected$.next({
        isConnected: this.isConnected,
        isWsConnected: this.isWsConnected,
      });
    });
  }

  static async connectToDefaultHost() {
    const host = await this.getCurrentHost();

    if (!host) {
      this.disconnect();
      return;
    }

    if (JSON.stringify(this.currentHost) !== JSON.stringify(host)) {
      if (this.isConnected) {
        this.disconnect();
      }

      this.currentHost = host;

      KodiApiService.setHost(KodiAppService.currentHost);
    }

    this.connect();
  }

  static connect() {
    this.initialize();

    this.wsConnection = KodiApiService.connect(this.currentHost);

    this.wsConnection.onerror = (error) => {
      wakoLog('mobile-sdk.KodiAppService::onerror', error);

      // Checks if the host is HTTP reachable
      KodiPingForm.submit().subscribe((data) => {
        this.isConnected = data === 'pong';

        this.connected$.next({
          isConnected: this.isConnected,
          isWsConnected: this.isWsConnected,
        });
      });
    };
  }

  static disconnect() {
    if (this.wsConnection) {
      this.wsConnection.onerror = null;
    }

    KodiApiService.disconnect();

    this.isConnected = false;

    this.connected$.next({
      isConnected: this.isConnected,
      isWsConnected: this.isWsConnected,
    });
  }

  static async getCurrentHost() {
    const hosts = await this.getHosts();
    const hostIndex = +(await WakoSettingsService.getByCategory<KodiHostStructure>(
      this.storageCategoryCurrentHostIndex
    ));

    let currentHost = hosts[0];

    if (typeof hosts[hostIndex] !== 'undefined') {
      currentHost = hosts[hostIndex];
    }

    return currentHost;
  }

  static async setCurrentHost(host?: KodiHostStructure) {
    const hosts = await this.getHosts();
    let hostIndex = null;

    if (host) {
      for (const index in hosts) {
        if (typeof hosts[index] !== 'undefined') {
          if (this.areHostEqual(hosts[index], host)) {
            hostIndex = index;
          }
        }
      }

      if (hostIndex === null) {
        await this.addHost(host);
        hostIndex = hosts.length - 1;
      }
    }

    await WakoSettingsService.setByCategory(this.storageCategoryCurrentHostIndex, hostIndex);

    this.connectToDefaultHost();

    return host;
  }

  static async removeHost(host: KodiHostStructure): Promise<any> {
    const hosts = await this.getHosts();

    const newHosts = [];
    hosts.forEach((_host) => {
      if (!this.areHostEqual(_host, host)) {
        newHosts.push(_host);
      }
    });

    return this.setHosts(newHosts);
  }

  static async addHost(host: KodiHostStructure): Promise<boolean> {
    const hosts = await this.getHosts();

    let exists = false;
    hosts.forEach((_host) => {
      if (this.areHostEqual(_host, host)) {
        exists = true;
      }
    });

    if (!exists) {
      hosts.push(host);
    }

    return await this.setHosts(hosts);
  }

  static async getHosts() {
    const hosts = (await WakoSettingsService.getByCategory<KodiHostStructure[]>(this.storageCategoryHosts)) || [];

    hosts.forEach((host) => {
      if (!host.name || host.name === '') {
        host.name = 'Kodi Host ' + host.host;
      }
    });

    return hosts;
  }

  static async setHosts(hosts: KodiHostStructure[]): Promise<boolean> {
    const currentHost = await this.getCurrentHost();

    let currentHostExists = false;

    if (currentHost) {
      hosts.forEach((host) => {
        if (this.areHostEqual(host, currentHost)) {
          currentHostExists = true;
        }
      });
    }

    await WakoSettingsService.setByCategory(this.storageCategoryHosts, hosts);

    if (!currentHostExists) {
      await this.setCurrentHost(hosts.length ? hosts[0] : null);
    }

    return true;
  }

  static areHostEqual(host1: KodiHostStructure, host2: KodiHostStructure) {
    return host1.host === host2.host && +host1.port === +host2.port;
  }

  static appGoesInBackground() {
    this.appInBackground = true;
  }

  static appGoesOutBackground() {
    this.appInBackground = false;

    if (!this.isConnected) {
      this.connectToDefaultHost();
    } else {
      KodiPingForm.submit().subscribe((data) => {
        if (data === 'pong') {
          this.connect();
        } else {
          this.disconnect();
        }
      });
    }
  }

  /**
   * Will check if a host has been set and try to connect to it
   *
   */
  static checkAndConnectToCurrentHost() {
    return of(this.currentHost).pipe(
      switchMap((currentHost) => {
        if (!currentHost) {
          return throwError('noHost');
        }

        if (!this.isConnected) {
          this.connect();

          return timer(1000).pipe(mapTo(currentHost));
        }

        // Connect anyway
        this.connect();

        return of(currentHost);
      }),
      switchMap(() => {
        if (!this.isConnected) {
          return throwError('hostUnreachable');
        }

        return of(true);
      })
    );
  }

  static prependOpenMediaToUrl(url: string, openMedia?: OpenMedia) {
    if (!openMedia) {
      return url;
    }

    const openMediaInUrl = this.getOpenMediaFromUrl(url);

    if (openMediaInUrl) {
      return url;
    }

    const urlParts = [];
    if (openMedia.movieIds) {
      urlParts.push(`movieIds=${JSON.stringify(openMedia.movieIds)}`);
    }
    if (openMedia.showIds) {
      urlParts.push(`showIds=${JSON.stringify(openMedia.showIds)}`);
    }
    if (openMedia.seasonNumber) {
      urlParts.push(`seasonNumber=${openMedia.seasonNumber}`);
    }

    if (openMedia.episodeNumber) {
      urlParts.push(`episodeNumber=${openMedia.episodeNumber}`);
    }

    return url + '|' + urlParts.join('&');
  }

  static open(item: object, openMedia?: OpenMedia, openKodiRemote = true) {
    return this.stopPlayingIfAny().pipe(
      switchMap(() => KodiPlayerOpenForm.submit(item)),
      map(() => {
        if (openKodiRemote) {
          EventService.emit(EventCategory.kodiRemote, EventName.open);
        }
        if (openMedia) {
          this.openMedia$.next(openMedia);
        }

        EventService.emit(EventCategory.kodi, EventName.open);

        return true;
      })
    );
  }

  static openUrl(
    url: string,
    openMedia?: OpenMedia,
    openKodiRemote = true,
    params?: KodiOpenParams,
    prependOpenMediaToUrl = true
  ) {
    return this.open(
      {
        file: prependOpenMediaToUrl ? this.prependOpenMediaToUrl(url, openMedia) : url,
      },
      openMedia,
      openKodiRemote
    ).pipe(
      switchMap((res) => {
        if (typeof params === 'undefined') {
          return of(res);
        }
        return KodiApplicationGetPropertiesForm.submit().pipe(
          switchMap((properties) => {
            return this.getPlayerIdOnStart(properties.version.major).pipe(
              switchMap((playerId) => {
                const obss = [];

                if (params.seekTo) {
                  obss.push(KodiSeekToCommand.handle(playerId, params.seekTo));
                }

                obss.push(
                  KodiPlayerSetSubtitleForm.submit(
                    playerId,
                    params.enableSubtitle || false,
                    params.subtitleIndex || null
                  )
                );

                if (params.audioStreamIndex) {
                  obss.push(KodiPlayerSetAudioStreamForm.submit(playerId, params.audioStreamIndex));
                }

                return obss.length > 0 ? concat(...obss) : of(true);
              })
            );
          })
        );
      })
    );
  }

  static getOpenMediaFromUrl(url: string) {
    if (url && url.match(/\|/) !== null) {
      const urlSearchParams = new URLSearchParams(url.split('|').pop());
      const openMedia: OpenMedia = {};

      /**
       * @deprecated
       */
      if (urlSearchParams.has('movieTraktId') && Number.isInteger(+urlSearchParams.get('movieTraktId'))) {
        openMedia.movieIds = {
          trakt: +urlSearchParams.get('movieTraktId'),
        };
      }

      if (urlSearchParams.has('movieIds')) {
        openMedia.movieIds = JSON.parse(urlSearchParams.get('movieIds'));
      }

      /**
       * @deprecated
       */
      if (urlSearchParams.has('showTraktId') && Number.isInteger(+urlSearchParams.get('showTraktId'))) {
        openMedia.showIds = {
          trakt: +urlSearchParams.get('showTraktId'),
        };
      }

      if (urlSearchParams.has('showIds')) {
        openMedia.showIds = JSON.parse(urlSearchParams.get('showIds'));
      }

      if (urlSearchParams.has('seasonNumber') && Number.isInteger(+urlSearchParams.get('seasonNumber'))) {
        openMedia.seasonNumber = +urlSearchParams.get('seasonNumber');
      }

      if (urlSearchParams.has('episodeNumber') && Number.isInteger(+urlSearchParams.get('episodeNumber'))) {
        openMedia.episodeNumber = +urlSearchParams.get('episodeNumber');
      }

      return openMedia;
    }

    return null;
  }

  static stopPlayingIfAny() {
    return KodiPlayerGetAllActiveForm.submit().pipe(
      switchMap((players) => {
        this.openMedia$.next(null);

        if (players.length > 0) {
          return KodiPlayerStopForm.submit(players.pop().playerid);
        }

        return of(true);
      })
    );
  }

  static getPlayerIdOnStart(kodiMajorVersion: number) {
    return new Observable<number>((observer) => {
      const playerIdSet$ = new Subject<boolean>();
      let timer = null;

      KodiApiService.wsMessage$.pipe(takeUntil(playerIdSet$)).subscribe((data) => {
        if (data.method === 'Player.OnAVStart') {
          if (timer) {
            clearTimeout(timer);
          }
          observer.next(data.params.data.player.playerid);
          observer.complete();
        }

        if (kodiMajorVersion && kodiMajorVersion < 18 && data.method === 'Player.OnPlay') {
          // < kodi 18
          timer = setTimeout(() => {
            observer.next(data.params.data.player.playerid);
            observer.complete();
          }, 3000);
        }
      });
    });
  }

  static resumePlaylistVideo(item: PlaylistVideo) {
    const playlistService = PlaylistService.getInstance();

    return from(playlistService.getPlaylistFromItem(item)).pipe(
      switchMap((playlist) => {
        const seek = Math.round(((item.currentSeconds - 5) / item.totalSeconds) * 100);

        const params: KodiOpenParams = {
          seekTo: seek,
        };

        if (playlist && playlist.customData && playlist.customData.kodi) {
          params.enableSubtitle = playlist.customData.kodi.subtitleEnabled;
          params.subtitleIndex = playlist.customData.kodi.currentSubtitleIndex;
          params.audioStreamIndex = playlist.customData.kodi.currentAudioStream;
        }

        return this.openUrl(item.url, item.openMedia, true, params);
      })
    );
  }
}

export interface KodiOpenParams {
  seekTo?: number;
  enableSubtitle?: boolean;
  subtitleIndex?: number;
  audioStreamIndex?: number;
}

export interface OpenMedia {
  movieIds?: BaseIds;
  showIds?: BaseIds;
  seasonNumber?: number;
  episodeNumber?: number;
  videoUrl?: string;
  nextVideoUrls?: string[];
}

export interface KodiConnected {
  isConnected: boolean;
  isWsConnected: boolean;
}
