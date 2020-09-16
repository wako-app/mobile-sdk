import { Storage } from '@ionic/storage';
import { from } from 'rxjs';
import { WakoStorageCacheConfig } from '../../config';
import { WakoStorageService } from '../storage/wako-storage-service';

export class WakoCacheService {
  protected static wakoStorageEngine = new WakoStorageService(WakoStorageCacheConfig);

  /**
   * Keep it for backward compatibility
   */
  protected static storageEngine: Storage;

  private static checkWakoStorageEngine() {
    if (this.storageEngine) {
      this.wakoStorageEngine.setStorage(this.storageEngine);
      this.storageEngine = null;
    }
  }

  static getCacheObject<T>(key: string) {
    this.checkWakoStorageEngine();

    return from(this.wakoStorageEngine.getStorageObject<T>(key));
  }

  static get<T>(key: string) {
    this.checkWakoStorageEngine();

    return from(this.wakoStorageEngine.get<T>(key));
  }

  /**
   *
   * @param key
   * @param data
   * @param expiresAt ie 15min 1h, 1d, 1m. h = hour, d = day, m = month or time
   */
  static set(key: string, data: any, expiresAt: string | number | 'tomorrow') {
    this.checkWakoStorageEngine();

    return this.wakoStorageEngine.set(key, data, expiresAt);
  }

  static remove(key: string) {
    this.checkWakoStorageEngine();

    return this.wakoStorageEngine.remove(key);
  }

  static clear() {
    this.checkWakoStorageEngine();

    return this.wakoStorageEngine.clear();
  }

  static async prune() {
    this.checkWakoStorageEngine();

    await this.wakoStorageEngine.prune();
  }
}

export interface CacheObject<T> {
  data: T;
  key: string;
  hasExpired: boolean;
}
