import { EMPTY, NEVER, Observable, Observer, of, throwError } from 'rxjs';
import { AjaxRequest } from 'rxjs/ajax';
import { catchError, finalize, map, share, timeout } from 'rxjs/operators';
import { getDomainFromUrl } from '../../tools/utils.tool';
import { CacheObject, WakoCacheService } from '../cache/wako-cache.service';
import { WakoHttpError, WakoHttpRequest, WakoHttpResponse, WakoHttpService } from './wako-http.service';

interface QueueItem {
  observer: Observer<any>;
  observable: Observable<any>;
  url: string;
}

export abstract class WakoBaseHttpService {
  private static observableRequests = new Map();

  private static token: string;

  private static domainQueueItems = new Map<string, QueueItem[]>();
  private static domainQueuePendingItems = new Map<string, QueueItem[]>();

  static queueEnabled = false;

  static handleError = null;

  static byPassCors = true;

  private static getQueueItemsByDomain(domain): QueueItem[] {
    if (!this.domainQueueItems.has(domain)) {
      this.domainQueueItems.set(domain, []);
    }

    return this.domainQueueItems.get(domain);
  }

  private static getQueuePendingItemsByDomain(domain): QueueItem[] {
    if (!this.domainQueuePendingItems.has(domain)) {
      this.domainQueuePendingItems.set(domain, []);
    }

    return this.domainQueuePendingItems.get(domain);
  }

  protected static getCacheService() {
    return WakoCacheService;
  }

  protected static getTimeToWaitOnTooManyRequest(httpRequest: WakoHttpRequest, err: any) {
    return 5000;
  }

  protected static getTimeToWaitBetweenEachRequest() {
    return 0;
  }

  protected static getSimultaneousRequest() {
    return 10;
  }

  protected static getApiBaseUrl() {
    return '';
  }

  static setToken(token: string) {
    this.token = token;
  }

  static getToken() {
    return this.token;
  }

  protected static getHeaders() {
    return {};
  }

  private static alreadyRetriedQuery = new Map<string, boolean>();

  static unHandleError(err: any) {
    if (err instanceof WakoHttpError) {
      console.error(`Unhandled error: ${err.status} ${err.request.method} ${err.request.url}`);
    } else if (err && err.name === 'TimeoutError') {
      return EMPTY;
    }

    return throwError(err);
  }

  protected static getObservableKey(ajaxRequest: AjaxRequest, includeHeaders = false) {
    const headerStr =
      includeHeaders && ajaxRequest.headers && Object.keys(ajaxRequest.headers).length > 0
        ? '_h:' + JSON.stringify(ajaxRequest.headers)
        : '';

    const bodyStr =
      ajaxRequest.body && Object.keys(ajaxRequest.body).length > 0 ? '_b:' + JSON.stringify(ajaxRequest.body) : '';

    return `${ajaxRequest.method}::${ajaxRequest.url}${headerStr}${bodyStr}`;
  }

  static request<T>(
    httpRequest: WakoHttpRequest,
    cacheTime?: string | number,
    timeoutMs = 10000,
    byPassCors = null,
    timeToWaitOnTooManyRequest?: number,
    timeToWaitBetweenEachRequest?: number
  ): Observable<T> {
    if (!httpRequest.headers) {
      httpRequest.headers = this.getHeaders();
    }

    if (!httpRequest.responseType) {
      httpRequest.responseType = 'json';
    }

    timeToWaitBetweenEachRequest = timeToWaitBetweenEachRequest || this.getTimeToWaitBetweenEachRequest();

    const domain = getDomainFromUrl(httpRequest.url);

    const observableKey = this.getObservableKey(httpRequest, true);
    const cacheKey = this.getObservableKey(httpRequest);

    let obs = this.observableRequests.get(observableKey);

    if (!obs) {
      obs = new Observable((observer) => {
        let cacheObs = of(null);
        if (cacheTime) {
          cacheObs = this.getCacheService().getCacheObject<T>(cacheKey);
        }

        cacheObs.subscribe((cacheObject: CacheObject<T>) => {
          if (cacheObject !== null && cacheObject.hasExpired === false) {
            this.observableRequests.delete(observableKey);

            observer.next(cacheObject.data);
            observer.complete();

            return;
          }

          const queueObs = WakoHttpService.request(
            httpRequest,
            byPassCors !== null ? byPassCors : this.byPassCors
          ).pipe(
            timeout(timeoutMs),
            map((response: WakoHttpResponse) => {
              if (cacheTime) {
                this.getCacheService().set(cacheKey, response.response, cacheTime);
              }

              this.unQueuePending(domain);
              this.runNextIfQueueOk(domain, timeToWaitBetweenEachRequest);

              return response.response as T;
            }),
            catchError((err) => {
              if (cacheObject) {
                // Returns old version, better than an error
                console.log(
                  'Server error',
                  err.status,
                  httpRequest.url,
                  'but cache exists, returns it',
                  cacheObject.data
                );
                return of(cacheObject.data);
              }

              this.unQueuePending(domain);

              if (err.status === 429) {
                timeToWaitOnTooManyRequest =
                  timeToWaitOnTooManyRequest || this.getTimeToWaitOnTooManyRequest(httpRequest, err);

                if (this.queueEnabled) {
                  if (this.alreadyRetriedQuery.has(observableKey) === false) {
                    this.addToQueue(domain, observer, queueObs, httpRequest.url, true);
                    this.alreadyRetriedQuery.set(observableKey, true);
                  } else {
                    console.log('Query already retried, skip it', httpRequest.url);
                  }

                  console.log('Gonna wait', timeToWaitOnTooManyRequest, 'ms before continue, on domain', domain);

                  setTimeout(() => {
                    console.log('RUN NEXT', domain);
                    this.runNextIfQueueOk(domain, timeToWaitBetweenEachRequest);
                  }, timeToWaitOnTooManyRequest);
                } else {
                  console.log('Queue is disabled do nothing');
                }

                return NEVER;
              }

              return throwError(err);
            })
          );

          if (this.queueEnabled) {
            this.addToQueue(domain, observer, queueObs, httpRequest.url);

            this.runNextIfQueueOk(domain, timeToWaitBetweenEachRequest);
          } else {
            queueObs.subscribe(
              (result) => {
                this.observableRequests.delete(observableKey);
                observer.next(result);
                observer.complete();
              },
              (err) => {
                this.observableRequests.delete(observableKey);
                observer.error(err);
              }
            );
          }
        });
      }).pipe(
        share(),
        catchError((err) => {
          if (typeof this.handleError === 'function') {
            return this.handleError(err);
          }

          return this.unHandleError(err);
        })
      );

      this.observableRequests.set(observableKey, obs);
    }

    return obs;
  }

  private static runNextIfQueueOk(domain: string, timeToWaitBetweenEachRequest: number) {
    if (this.getQueuePendingItemsByDomain(domain).length <= this.getSimultaneousRequest()) {
      this.runNext(domain, timeToWaitBetweenEachRequest);
    }
  }

  private static addToQueue(
    domain: string,
    observer: Observer<any>,
    observable: Observable<any>,
    url: string,
    addFirst = false
  ) {
    const queue = this.getQueueItemsByDomain(domain);
    const item = {
      observer: observer,
      observable: observable,
      url: url,
    };
    if (addFirst) {
      queue.unshift(item);
    } else {
      queue.push(item);
    }

    this.getQueuePendingItemsByDomain(domain).push(item);
  }

  private static unQueuePending(domain: string) {
    const queueItems = this.getQueuePendingItemsByDomain(domain);
    if (queueItems.length > 0) {
      queueItems.shift();
    }
  }

  private static runNext(domain: string, timeToWaitBetweenEachRequest: number) {
    const queueItems = this.getQueueItemsByDomain(domain);

    if (queueItems.length > 0) {
      const data = queueItems[0];
      queueItems.shift();

      data.observable
        .pipe(
          finalize(() => {
            setTimeout(() => {
              this.runNext(domain, timeToWaitBetweenEachRequest);
            }, timeToWaitBetweenEachRequest);
          })
        )
        .subscribe(
          (result) => {
            data.observer.next(result);
            data.observer.complete();
          },
          (err) => {
            data.observer.error(err);
          }
        );
    }
  }

  static get<T>(url: string, params?: any, cacheTime?: string | number, timeoutMs = 10000): Observable<T> {
    return this.request<T>(
      {
        url: this.getApiBaseUrl() + WakoHttpService.addParamsToUrl(url, params),
        method: 'GET',
      },
      cacheTime,
      timeoutMs
    );
  }

  static post<T>(url: string, body: Object, cacheTime?: string | number, timeoutMs = 10000): Observable<T> {
    return this.request<T>(
      {
        url: this.getApiBaseUrl() + url,
        method: 'POST',
        body: body,
      },
      cacheTime,
      timeoutMs
    );
  }

  static put<T>(url: string, body: Object, cacheTime?: string | number, timeoutMs = 10000): Observable<T> {
    return this.request<T>(
      {
        url: this.getApiBaseUrl() + url,
        method: 'PUT',
        body: body,
      },
      cacheTime,
      timeoutMs
    );
  }

  static delete<T>(url: string, body: Object, cacheTime?: string | number, timeoutMs = 10000): Observable<T> {
    return this.request<T>(
      {
        url: this.getApiBaseUrl() + url,
        method: 'DELETE',
        body: body,
      },
      cacheTime,
      timeoutMs
    );
  }
}
