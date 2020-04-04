import { KodiHostStructure } from "../structures/kodi-host.structure";
import { map } from "rxjs/operators";
import { Observable, throwError } from "rxjs";
import { KodiBaseDto } from "../dtos/kodi-base-dto";
import { WakoBaseHttpService } from "../../http/wako-base-http.service";

export class KodiHttpService extends WakoBaseHttpService {
  private static apiBaseUrl = "";

  static host: KodiHostStructure;

  static byPassCors = true;

  static getApiBaseUrl() {
    return this.apiBaseUrl;
  }

  static handleError(err) {
    console.log("Error on kodi", err);
    return throwError(err);
  }

  static setHost(host: KodiHostStructure) {
    this.host = host;
    this.apiBaseUrl = `http://${host.host}:${host.port}/jsonrpc`;
  }

  static getHeaders() {
    const headers = {
      "Content-Type": "application/json",
    };
    if (this.host && this.host.login) {
      headers["Authorization"] = `Basic ${btoa(
        this.host.login + ":" + this.host.password
      )}`;
    }
    return headers;
  }

  static doAction<T>(
    method: string,
    params?: any,
    timeoutMs = 10000
  ): Observable<T> {
    const action: KodiAction = {
      jsonrpc: "2.0",
      id: 1,
      method: method,
    };

    if (params) {
      action.params = params;
    }
    return this.post<KodiBaseDto<T>>(
      `?${method}`,
      action,
      null,
      timeoutMs
    ).pipe(map((data) => data.result));
  }
}

export interface KodiAction {
  jsonrpc: string;
  id: number;
  method: string;
  params?: any;
}
