import { PLATFORM_ID } from '@angular/core';
import { Storage, StorageConfig } from '@ionic/storage';

export class WakoStorageService {
  protected storageEngine: Storage;

  protected memoryStorage = new Map<string, StorageValue>();

  constructor(storageConfig: StorageConfig) {
    this.storageEngine = new Storage(storageConfig, PLATFORM_ID);

    setInterval(() => {
      if (this.memoryStorage.size > 1000) {
        this.memoryStorage.clear();
      }
      console.log('WakoStorageService', 'size', this.memoryStorage.size);
    }, 10000);
  }

  private serialize(storageValue: StorageValue) {
    return JSON.stringify(storageValue);
  }

  private unSerialize(string: string) {
    try {
      return JSON.parse(string) as StorageValue;
    } catch (e) {
      return null;
    }
  }

  private hasExpired(storageValue: StorageValue) {
    return storageValue.expiresAt ? storageValue.expiresAt < Date.now() : false;
  }

  setStorage(storageEngine: Storage) {
    this.storageEngine = storageEngine;
  }

  async getStorageObject<T>(key: string) {
    let storageValue = this.memoryStorage.get(key);

    if (!storageValue) {
      const storageString = await this.storageEngine.get(key);
      storageValue = this.unSerialize(storageString);
    }

    if (storageValue === null) {
      return null;
    }

    return {
      data: storageValue.data as T,
      hasExpired: this.hasExpired(storageValue),
      key: key,
    } as StorageObject<T>;
  }

  async get<T>(key: string) {
    const storageObject = await this.getStorageObject<T>(key);

    if (storageObject === null) {
      return null;
    }

    if (storageObject.hasExpired) {
      console.log('WakoStorageService', 'key', key, 'has expired');
      this.remove(storageObject.key);
      return null;
    }

    return storageObject.data;
  }

  /**
   *
   * @param key
   * @param data
   * @param expiresAt ie 15min 1h, 1d, 1m. h = hour, d = day, m = month or time
   */
  async set(key: string, data: any, expiresAt: string | number | 'tomorrow' = null) {
    let expiresAtNumber: number = null;
    if (expiresAt !== null) {
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

      expiresAtNumber = date.getTime();
    }

    const storageValue: StorageValue = {
      data: data,
      expiresAt: expiresAtNumber,
    };

    this.memoryStorage.set(key, storageValue);

    return this.storageEngine.set(key, this.serialize(storageValue)).catch((err) => {
      console.log({ err });
    });
  }

  remove(key: string) {
    this.memoryStorage.delete(key);

    return this.storageEngine.remove(key);
  }

  clear() {
    console.log('WakoStorageService', 'clear');
    this.memoryStorage.clear();

    return this.storageEngine.clear();
  }

  async prune() {
    console.log('WakoStorageService', 'prune');

    const keys = await this.storageEngine.keys();
    for (const key of keys) {
      await this.get(key);
    }
  }
}

interface StorageValue {
  data: any;
  expiresAt?: number;
}

export interface StorageObject<T> {
  data: T;
  key: string;
  hasExpired: boolean;
}
