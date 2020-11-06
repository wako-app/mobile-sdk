import { KodiHostStructure } from '../structures/kodi-host.structure';
import { ReplaySubject, Subject, throwError, of } from 'rxjs';
import { KodiAction } from './kodi-http.service';
import { first, switchMap } from 'rxjs/operators';
import { wakoLog } from '../../../tools/utils.tool';

export class KodiWsService {
  static currentWebSocket: WebSocket;

  static wsMessage$ = new Subject<KodiWsMessageResult>();

  static connected$ = new ReplaySubject<boolean>(1);

  static onError$ = new Subject<any>();

  static isConnected = false;

  static connect(config: KodiHostStructure) {
    const apiBaseUrl = `ws://${config.host}:${config.wsPort ? config.wsPort : 9090}/jsonrpc`;

    if (this.currentWebSocket) {
      this.currentWebSocket.close();
    }

    this.currentWebSocket = new WebSocket(apiBaseUrl);

    this.currentWebSocket.onopen = () => {
      wakoLog('KodiWsService', 'onopen - Connected to: ' + apiBaseUrl + ' - lets ping it');

      this.isKodiWebsocketHost().subscribe(
        () => {
          this.connected$.next(true);
          this.isConnected = true;

          wakoLog('KodiWsService', apiBaseUrl + ' is a kodi websocket host');
        },
        () => {
          this.currentWebSocket.close();

          wakoLog('KodiWsService', apiBaseUrl + ' is a not kodi websocket host');
        }
      );
    };

    this.currentWebSocket.onclose = () => {
      this.isConnected = false;
      this.connected$.next(false);
      wakoLog('KodiWsService', 'onclose - Close connection to: ' + apiBaseUrl);
    };

    this.currentWebSocket.onmessage = (ev: MessageEvent) => {
      let data = ev.data;
      try {
        data = JSON.parse(ev.data);
      } catch (e) {
        wakoLog('KodiWsService', 'onmessage - Cannot parse data - ' + ev.data);
      }

      this.wsMessage$.next(data);
    };

    this.currentWebSocket.onerror = (error) => {
      this.onError$.next(error);

      wakoLog('KodiWsService', 'onerror - ' + apiBaseUrl + ' ' + JSON.stringify(error));
    };

    return this.currentWebSocket;
  }

  static disconnect() {
    this.isConnected = false;

    if (this.currentWebSocket) {
      this.currentWebSocket.close();
      this.currentWebSocket = null;
    }
    this.connected$.next(false);
  }

  static send(method: string, params?: any) {
    const action: KodiAction = {
      jsonrpc: '2.0',
      id: 1,
      method: method,
    };

    if (params) {
      action.params = params;
    }
    this.currentWebSocket.send(JSON.stringify(action));

    return this.wsMessage$.pipe(first());
  }

  private static isKodiWebsocketHost() {
    return this.send('JSONRPC.Ping').pipe(
      switchMap((message) => {
        const data = message.result;

        wakoLog('KodiWsService', 'Response from isKodiWebsocketHost: ' + data);

        if (data !== 'pong') {
          return throwError('not a kodi host');
        }

        return of(true);
      })
    );
  }
}

export interface KodiWsMessageResult {
  id: number;
  jsonrpc: string;
  method: string;
  params?: any;
  result?: any;
}
