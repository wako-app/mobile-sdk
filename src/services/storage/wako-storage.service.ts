import { Drivers } from '@ionic/storage';
import { Storage, StorageConfig } from '@ionic/storage-angular';
import * as cordovaSQLiteDriver from 'localforage-cordovasqlitedriver';

export class WakoStorage {
  private config: StorageConfig;
  private storage: Storage;

  private initialized = false;

  constructor(config: StorageConfig) {
    if (config.version === undefined) {
      config.version = 1;
    }
    if (config.driverOrder === undefined) {
      config.driverOrder = [cordovaSQLiteDriver._driver, Drivers.IndexedDB];
    }
    this.config = config;
  }

  async initialize() {
    if (!this.initialized) {
      this.storage = new Storage(this.config);
      await this.storage.defineDriver(cordovaSQLiteDriver);
      await this.storage.create();

      this.initialized = true;
    }
  }

  async get(key: string): Promise<any> {
    await this.initialize();
    return this.storage.get(key);
  }
  /**
   * Set the value for the given key.
   * @param key the key to identify this value
   * @param value the value for this key
   * @returns Returns a promise that resolves when the key and value are set
   */
  async set(key: string, value: any): Promise<any> {
    await this.initialize();
    return this.storage.set(key, value);
  }
  /**
   * Remove any value associated with this key.
   * @param key the key to identify this value
   * @returns Returns a promise that resolves when the value is removed
   */
  async remove(key: string): Promise<any> {
    await this.initialize();
    return this.storage.remove(key);
  }
  /**
   * Clear the entire key value store. WARNING: HOT!
   * @returns Returns a promise that resolves when the store is cleared
   */
  async clear(): Promise<void> {
    await this.initialize();
    return this.storage.clear();
  }
  /**
   * @returns Returns a promise that resolves with the number of keys stored.
   */
  async length(): Promise<number> {
    await this.initialize();
    return this.storage.length();
  }
  /**
   * @returns Returns a promise that resolves with the keys in the store.
   */
  async keys(): Promise<string[]> {
    await this.initialize();
    return this.storage.keys();
  }
}
