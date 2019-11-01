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
import { KodiPingForm } from '../forms/ping/kodi-ping.form';
import { Storage } from '@ionic/storage';
import { kodiConfig } from '../../../config';

export class KodiAppService {
  private static storageHostsKey = 'kodi_hosts';
  private static storageCurrentHostKey = 'kodi_current_host';

  protected static storageEngine = new Storage(kodiConfig.storage);

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

    KodiApiService.connected$
      .pipe(distinctUntilChanged())
      .subscribe(connected => {
        if (this.appInBackground) {
          return;
        }

        wakoLog('mobile-sdk.KodiAppService::connected', connected);

        this.isConnected = connected;
        this.isWsConnected = connected;

        this.connected$.next({
          isConnected: this.isConnected,
          isWsConnected: this.isWsConnected
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

    this.wsConnection.onerror = error => {
      wakoLog('mobile-sdk.KodiAppService::onerror', error);

      // Checks if the host is HTTP reachable
      KodiPingForm.submit().subscribe(data => {
        this.isConnected = data === 'pong';

        this.connected$.next({
          isConnected: this.isConnected,
          isWsConnected: this.isWsConnected
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
      isWsConnected: this.isWsConnected
    });
  }

  static async getCurrentHost(): Promise<KodiHostStructure> {
    const host = await this.storageEngine.get(this.storageCurrentHostKey);
    if (host && (!host.name || host.name === '')) {
      host.name = 'Kodi Host ' + host.host;
    }
    return host;
  }

  static async setCurrentHost(
    host: KodiHostStructure
  ): Promise<KodiHostStructure> {
    const d = await this.storageEngine.set(this.storageCurrentHostKey, host);

    this.connectToDefaultHost();

    return d;
  }

  static async removeHost(host: KodiHostStructure): Promise<any> {
    const hosts = await this.getHosts();

    const newHosts = [];
    hosts.forEach(_host => {
      if (!this.areHostEqual(_host, host)) {
        newHosts.push(_host);
      }
    });

    return this.setHosts(newHosts);
  }

  static async addHost(host: KodiHostStructure): Promise<boolean> {
    const hosts = await this.getHosts();

    let exists = false;
    hosts.forEach(_host => {
      if (_host.host === host.host && _host.port === host.port) {
        exists = true;
      }
    });

    if (!exists) {
      hosts.push(host);
    }

    return await this.setHosts(hosts);
  }

  static async getHosts(): Promise<KodiHostStructure[]> {
    const hosts = (await this.storageEngine.get(this.storageHostsKey)) || [];

    hosts.forEach(host => {
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
      hosts.forEach(host => {
        if (this.areHostEqual(host, currentHost)) {
          currentHostExists = true;
        }
      });
    }

    await this.storageEngine.set(this.storageHostsKey, hosts);

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
      KodiPingForm.submit().subscribe(data => {
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
      switchMap(currentHost => {
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

  static openUrl(url: string, openMedia?: OpenMedia, openKodiRemote = true) {
    return this.open(
      {
        file: url
      },
      openMedia,
      openKodiRemote
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
  videoUrl?: string;
  nextVideoUrls?: string[];
}

export interface KodiConnected {
  isConnected: boolean;
  isWsConnected: boolean;
}
