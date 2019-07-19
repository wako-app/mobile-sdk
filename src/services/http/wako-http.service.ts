import { defer, Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { wakoLog } from '../../tools/utils.tool';

declare const cordova: any;

export class WakoHttpService {
  static isMobileDevice: boolean;

  static request(httpRequest: WakoHttpRequest): Observable<WakoHttpResponse> {
    let obs: Observable<WakoHttpResponse>;

    if (this.isMobileDevice) {
      obs = this.mobileRequest(httpRequest).pipe(
        catchError(err => {
          if (err instanceof WakoHttpError && err.status === 301) {
            wakoLog('WakoHttpService', `Re Run ${httpRequest.url}`);
            return this.mobileRequest(httpRequest);
          }
          return throwError(err);
        })
      );
    } else {
      obs = this.browserRequest(httpRequest);
    }

    return obs.pipe(
      map(response => {
        if (response.status >= 200 && response.status <= 299) {
          return response;
        }
        throw new WakoHttpError(
          httpRequest,
          response.status,
          response.responseType,
          response.response
        );
      })
    );
  }

  private static mobileRequest(
    httpRequest: WakoHttpRequest
  ): Observable<WakoHttpResponse> {
    return defer(() => {
      const contentType = httpRequest.headers['Content-Type'];

      let serializer = 'json';
      if (contentType) {
        // This has been added to handle real debrid weird form. But it should be generic to handle all case
        httpRequest.headers['content-type'] =
          httpRequest.headers['Content-Type'];

        if (contentType === 'application/x-www-form-urlencoded') {
          serializer = 'urlencoded';
          if (typeof httpRequest.body === 'string') {
            serializer = 'utf8';
          }
        }
      }
      cordova['plugin']['http'].setDataSerializer(serializer);

      return new Promise<WakoHttpResponse>((resolve, reject) => {
        const success = (response: CordovaHttpSuccess) => {
          const ajaxResponse = {
            request: httpRequest,
            responseText: response.data,
            status: response.status,
            responseType: httpRequest.responseType,
            response: response
          } as WakoHttpResponse;

          try {
            ajaxResponse.response =
              ajaxResponse.responseType === 'json'
                ? JSON.parse(response.data)
                : response.data;
          } catch (e) {
            ajaxResponse.response = response.data;
          }

          resolve(ajaxResponse);
        };

        const failure = (response: CordovaHttpFailure) => {
          reject(
            new WakoHttpError(
              httpRequest,
              response.status,
              httpRequest.responseType,
              response.error
            )
          );
        };

        if (httpRequest.method === 'GET') {
          cordova['plugin']['http'].get(
            httpRequest.url,
            {},
            httpRequest.headers,
            success,
            failure
          );
        } else if (httpRequest.method === 'POST') {
          if (httpRequest.body === null) {
            httpRequest.body = {};
          }
          cordova['plugin']['http'].post(
            httpRequest.url,
            httpRequest.body,
            httpRequest.headers,
            success,
            failure
          );
        } else if (httpRequest.method === 'DELETE') {
          cordova['plugin']['http'].delete(
            httpRequest.url,
            httpRequest.body,
            httpRequest.headers,
            success,
            failure
          );
        } else {
          throw new Error('httpRequest.method  not set');
        }
      });
    });
  }

  private static browserRequest(
    httpRequest: WakoHttpRequest
  ): Observable<WakoHttpResponse> {
    const headers = new Headers();
    if (httpRequest.headers) {
      Object.keys(httpRequest.headers).forEach(key => {
        headers.set(key, httpRequest.headers[key]);
      });
    }

    return defer(() => {
      let body = null;

      if (httpRequest.body) {
        const contentType = httpRequest.headers['Content-Type'];
        if (contentType === 'application/x-www-form-urlencoded') {
          if (httpRequest.body) {
            const urlSearchParams = new URLSearchParams();
            Object.keys(httpRequest.body).forEach(key => {
              urlSearchParams.set(key, httpRequest.body[key]);
            });
            body = urlSearchParams.toString();
          }
        } else {
          body = JSON.stringify(httpRequest.body);
        }
      }

      return fetch(httpRequest.url, {
        method: httpRequest.method,
        body: body,
        headers: headers
      }).then(
        (response: Response) => {
          const ajaxResponse = <WakoHttpResponse>{
            request: httpRequest,
            responseText: null,
            status: response.status,
            responseType: httpRequest.responseType,
            response: response
          };
          const contentType = response.headers.get('content-type');

          if (contentType && contentType.includes('application/json')) {
            return response.json().then(json => {
              ajaxResponse.response = json;

              return ajaxResponse;
            });
          } else {
            return response.text().then(text => {
              try {
                ajaxResponse.response =
                  httpRequest.responseType === 'json' && text.length > 0
                    ? JSON.parse(text)
                    : text;
              } catch (e) {
                ajaxResponse.response = text;
              }

              return ajaxResponse;
            });
          }
        },
        response => {
          throw new WakoHttpError(
            httpRequest,
            response.status,
            httpRequest.responseType,
            response.error
          );
        }
      );
    });
  }

  static addParamsToUrl(url: string, params: any) {
    if (params) {
      const searchParams = new URLSearchParams('');

      for (const key in params) {
        if (params[key]) {
          searchParams.set(key, params[key]);
        }
      }

      url +=
        (url.match(/\?/) ? '&' : '?') +
        decodeURIComponent(searchParams.toString()).replace(/’/gi, "'");
    }

    return url;
  }
}

export interface WakoHttpRequest {
  url?: string;
  body?: any;
  method?: string;
  headers?: object;
  responseType?: string;
}

export class WakoHttpError {
  /**
   *
   *  request The AjaxRequest associated with the error
   *  status The HTTP status code
   *  responseType The responseType (e.g. 'json', 'arraybuffer', or 'xml')
   *  response {string|ArrayBuffer|Document|object|any} The response data
   */
  constructor(
    public request: WakoHttpRequest,
    public status: number,
    public responseType: string,
    public response: any
  ) {}
}

/**
 * A normalized AJAX response.
 *
 * @see {@link ajax}
 *
 */
export interface WakoHttpResponse {
  /** The HTTP status code */
  status: number;

  /** {string|ArrayBuffer|Document|object|any} The response data */
  response: any;

  /** The raw responseText */
  responseText: string;

  /** The responseType (e.g. 'json', 'arraybuffer', or 'xml') */
  responseType: string;
}

interface CordovaHttpSuccess {
  status: number;
  data: string;
  url: string;
  headers: Object;
}

interface CordovaHttpFailure {
  status: number;
  error: string;
  url?: string;
  headers?: Object;
}
