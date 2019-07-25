import { of, ReplaySubject, throwError, timer } from 'rxjs';
import { distinctUntilChanged, map, mapTo, switchMap } from 'rxjs/operators';
import { wakoLog } from '../../../tools/utils.tool';
import { KodiHostStructure } from '../structures/kodi-host.structure';
import { KodiApiService } from './kodi-api.service';
import { KodiPlayerOpenForm } from '../forms/player/kodi-player-open.form';
import {
  EventCategory,
  EventName,
  EventService
} from '../../event/event.service';
import { KodiPlayerGetAllActiveForm } from '../forms/player/kodi-player-get-all-active.form';
import { KodiPlayerStopForm } from '../forms/player/kodi-player-stop.form';
import { KodiExecuteAddonForm } from '../forms/addons/kodi-execute-addon.form';
import { KodiPingForm } from '../forms/ping/kodi-ping.form';

export class KodiAppService {
  static currentHost: KodiHostStructure;

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

  private static isInitialized = false;

  static initialize() {
    if (this.isInitialized) {
      return;
    }

    this.isInitialized = true;

    KodiApiService.connected$
      .pipe(distinctUntilChanged())
      .subscribe(connected => {
        wakoLog('mobile-sdk.KodiAppService::connected', connected);

        this.isConnected = connected;
        this.isWsConnected = connected;
      });
  }

  static connect() {
    this.initialize();

    this.wsConnection = KodiApiService.connect(this.currentHost);

    this.wsConnection.onerror = error => {
      wakoLog('mobile-sdk.KodiAppService::onerror', error);

      // Checks if the host is HTTP reachable
      KodiPingForm.submit().subscribe(data => {
        this.isConnected = data === 'pong';
      });
    };
  }

  static disconnect() {
    if (this.wsConnection) {
      this.wsConnection.onerror = null;
    }

    KodiApiService.disconnect();

    this.isConnected = false;
  }

  /**
   * Will check if a host has been set and try to connect to it
   *
   *
   */
  static checkAndConnectToCurrentHost() {
    return of(this.currentHost).pipe(
      switchMap(currentHost => {
        if (!currentHost) {
          return throwError('noHost');
        }

        if (!this.isConnected) {
          this.connect();

          return timer(1000).pipe(mapTo(currentHost));
        }

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

  static openUrl(url: string, openMedia?: OpenMedia, openKodiRemote = true) {
    return this.stopPlayingIfAny().pipe(
      switchMap(() => KodiPlayerOpenForm.submit(url)),
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

  static excuteAddon(
    addonId: string,
    params: string,
    openMedia?: OpenMedia,
    openKodiRemote = true
  ) {
    return this.stopPlayingIfAny().pipe(
      switchMap(() => KodiExecuteAddonForm.submit(addonId, params)),
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

  static stopPlayingIfAny() {
    return KodiPlayerGetAllActiveForm.submit().pipe(
      switchMap(players => {
        this.openMedia$.next(null);

        if (players.length > 0) {
          return KodiPlayerStopForm.submit(players.pop().playerid);
        }

        return of(true);
      })
    );
  }
}

export interface OpenMedia {
  movieTraktId?: number;
  showTraktId?: number;
  seasonNumber?: number;
  episodeNumber?: number;
}
