import { PLATFORM_ID } from '@angular/core';
import { Storage, StorageConfig } from '@ionic/storage';

export class WakoStorage {
  private storage: Storage;

  constructor(config: StorageConfig) {
    this.storage = new Storage(config, PLATFORM_ID);
  }

  get(key: string): Promise<any> {
    return this.storage.get(key);
  }
  /**
   * Set the value for the given key.
   * @param key the key to identify this value
   * @param value the value for this key
   * @returns Returns a promise that resolves when the key and value are set
   */
  set(key: string, value: any): Promise<any> {
    return this.storage.set(key, value);
  }
  /**
   * Remove any value associated with this key.
   * @param key the key to identify this value
   * @returns Returns a promise that resolves when the value is removed
   */
  remove(key: string): Promise<any> {
    return this.storage.remove(key);
  }
  /**
   * Clear the entire key value store. WARNING: HOT!
   * @returns Returns a promise that resolves when the store is cleared
   */
  clear(): Promise<void> {
    return this.storage.clear();
  }
  /**
   * @returns Returns a promise that resolves with the number of keys stored.
   */
  length(): Promise<number> {
    return this.storage.length();
  }
  /**
   * @returns Returns a promise that resolves with the keys in the store.
   */
  keys(): Promise<string[]> {
    return this.storage.keys();
  }
}
