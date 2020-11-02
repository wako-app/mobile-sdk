import { KodiHostStructure } from '../structures/kodi-host.structure';
import { ReplaySubject, Subject } from 'rxjs';
import { KodiAction } from './kodi-http.service';
import { first } from 'rxjs/operators';
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
      this.connected$.next(true);
      this.isConnected = true;
      wakoLog('KODI', 'Connected to: ' + apiBaseUrl);
    };
    this.currentWebSocket.onclose = () => {
      this.isConnected = false;
      this.connected$.next(false);
      wakoLog('KODI', 'Connected to: ' + apiBaseUrl);
    };

    this.currentWebSocket.onmessage = (ev: MessageEvent) => {
      this.wsMessage$.next(JSON.parse(ev.data));
    };

    this.currentWebSocket.onerror = (error) => {
      this.onError$.next(error);
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
}

export interface KodiWsMessageResult {
  id: number;
  jsonrpc: string;
  method: string;
  params?: any;
  result?: any;
}
