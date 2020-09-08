import { map } from 'rxjs/operators';
import { from } from 'rxjs';
import { Storage } from '@ionic/storage';
import { WakoStorageCacheConfig } from '../../config';
import { PLATFORM_ID } from '@angular/core';

export class WakoCacheService {
  protected static storageEngine = new Storage(WakoStorageCacheConfig, PLATFORM_ID);

  private static serialize(data: any, expiresAt: number) {
    const d: CacheSerialized = {
      data: data,
      expiresAt: expiresAt,
    };

    return JSON.stringify(d);
  }

  private static unSerialize(string: string) {
    try {
      return JSON.parse(string) as CacheSerialized;
    } catch (e) {
      return null;
    }
  }

  private static hasExpired(data: CacheSerialized) {
    return data.expiresAt < Date.now();
  }

  static getCacheObject<T>(key: string) {
    return from(this.storageEngine.get(key)).pipe(
      map((data: string) => {
        const cache = this.unSerialize(data);

        if (cache === null) {
          return null;
        }

        return {
          data: cache.data as T,
          hasExpired: this.hasExpired(cache),
          key: key,
        };
      })
    );
  }

  static get<T>(key: string) {
    return this.getCacheObject<T>(key).pipe(
      map((cacheObject) => {
        if (cacheObject === null) {
          return null;
        }

        if (cacheObject.hasExpired) {
          console.log('key', key, 'has expired');
          this.remove(cacheObject.key);
          return null;
        }

        return cacheObject.data;
      })
    );
  }

  /**
   *
   * @param key
   * @param data
   * @param expiresAt ie 15min 1h, 1d, 1m. h = hour, d = day, m = month or time
   */
  static set(key: string, data: any, expiresAt: string | number | 'tomorrow') {
    const date = new Date();

    if (typeof expiresAt === 'number') {
      date.setTime(date.getTime() + expiresAt);
    } else if (typeof expiresAt === 'string') {
      if (expiresAt === 'tomorrow') {
        date.setHours(23);
        date.setMinutes(59);
        date.setSeconds(59);
      } else if (expiresAt.match('min')) {
        date.setMinutes(date.getMinutes() + parseFloat(expiresAt));
      } else if (expiresAt.match('h')) {
        date.setHours(date.getHours() + parseFloat(expiresAt));
      } else if (expiresAt.match('d')) {
        date.setDate(date.getDate() + parseFloat(expiresAt));
      } else if (expiresAt.match('m')) {
        date.setMonth(date.getMonth() + parseFloat(expiresAt));
      }
    }

    return this.storageEngine.set(key, this.serialize(data, date.getTime())).catch((err) => {
      console.log({ err });
    });
  }

  static remove(key: string) {
    return this.storageEngine.remove(key);
  }

  static clear() {
    console.log('WakoCacheService clear');
    return this.storageEngine.clear();
  }

  static async prune() {
    console.log('WakoCacheService prune');

    const keys = await this.storageEngine.keys();
    for (const key of keys) {
      await this.get(key).toPromise();
    }
  }
}

interface CacheSerialized {
  data: any;
  expiresAt: number;
}

export interface CacheObject<T> {
  data: T;
  key: string;
  hasExpired: boolean;
}
