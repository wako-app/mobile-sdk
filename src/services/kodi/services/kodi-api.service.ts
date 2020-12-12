import { throwError } from 'rxjs';
import { KodiHostStructure } from '../structures/kodi-host.structure';
import { KodiHttpService } from './kodi-http.service';
import { map, tap, catchError } from 'rxjs/operators';
import { KodiWsService } from './kodi-ws.service';

export class KodiApiService extends KodiWsService {
  static host: KodiHostStructure;

  static setHost(host: KodiHostStructure) {
    this.host = host;
    KodiHttpService.setHost(host);
  }

  static connect(config: KodiHostStructure) {
    this.setHost(config);

    return super.connect(config);
  }

  static disconnect() {
    return super.disconnect();
  }

  static doHttpAction<T>(method: string, params?: any, timeoutMs = 10000) {
    return KodiHttpService.doAction<T>(method, params, timeoutMs).pipe(
      catchError((err) => {
        if (err && (err.status === undefined || err.status < 0)) {
          this.disconnect();
        }
        return throwError(err);
      })
    );
  }

  static doAction<T>(method: string, params?: any) {
    let obs;
    // issue with ws on ios when resume/pause app, force http request instead
    if (!this.isConnected) {
      // Use HTTP method
      obs = KodiHttpService.doAction<T>(method, params);
    } else {
      obs = super.send(method, params).pipe(map((data) => data.result as T));
    }

    return obs.pipe(
      tap((data) => {
        console.log('method', method, data);
      })
    );
  }
}
