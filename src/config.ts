import { StorageConfig, Drivers } from '@ionic/storage';
import * as cordovaSQLiteDriver from 'localforage-cordovasqlitedriver';

export const WakoStorageConfig: StorageConfig = {
  name: 'wako',
  version: 1,
  driverOrder: [cordovaSQLiteDriver._driver, Drivers.IndexedDB],
};

export const WakoStorageCacheConfig: StorageConfig = {
  name: 'wako_cache',
  version: 1,
};
