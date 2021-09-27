import { WakoStorage } from './../storage/wako-storage.service';

import { Subject } from 'rxjs';
import { mergeDeep } from '../../tools/utils.tool';
import { WakoStorageConfig } from '../../config';

export interface WakoSettingsByCategoryChange<T> {
  readonly prevValue: T;
  readonly newValue: T;
}

export class WakoSettingsService {
  private static events = new Map<string, Subject<WakoSettingsByCategoryChange<any>>>();

  private static change$ = new Subject<string>();

  private static listStorageKey = '__global_settings_list__';

  private static settingsKeyPrefix = '__settings_';

  private static storage = new WakoStorage(WakoStorageConfig);

  static mergeDeep(target: {}, source: {}) {
    return mergeDeep(target, source);
  }

  private static emitChange(category: string, prevValue: any, newValue: any) {
    if (!this.events.has(category)) {
      this.events.set(category, new Subject<WakoSettingsByCategoryChange<any>>());
    }

    this.change$.next(category);

    this.events.get(category).next({
      prevValue: JSON.parse(JSON.stringify(prevValue)),
      newValue: JSON.parse(JSON.stringify(newValue)),
    });
  }

  /**
   * Register for change event on all category, will receive the category that has changed
   */
  static onChange() {
    return this.change$;
  }

  /**
   * Register for change event on a category, will receive on object with the previous and new value
   */
  static onChangeByCategory<T>(category: string) {
    if (!this.events.has(category)) {
      this.events.set(category, new Subject<WakoSettingsByCategoryChange<any>>());
    }

    return this.events.get(category) as Subject<WakoSettingsByCategoryChange<T>>;
  }

  private static getStorageKeyByCategory(category: string) {
    return this.settingsKeyPrefix + category;
  }

  private static async addCategoryToList(category: string) {
    const list = await this.getList();
    if (list.includes(category)) {
      return;
    }
    list.push(category);

    await this.storage.set(this.listStorageKey, list);
  }

  private static async removeCategoryFromList(category: string) {
    const list = await this.getList();
    if (!list.includes(category)) {
      return;
    }

    await this.storage.set(
      this.listStorageKey,
      list.filter((cat) => cat !== category)
    );
  }

  private static async getList() {
    let list: string[] = await this.storage.get(this.listStorageKey);
    if (!list) {
      list = [];
    }
    return list;
  }

  static async getAll() {
    const list = await this.getList();

    const caches: { [key: string]: {} } = {};

    for (const category of list) {
      caches[category] = await this.getByCategory(category);
    }

    return caches;
  }

  static async getByCategory<T>(category: string) {
    return (await this.storage.get(this.getStorageKeyByCategory(category))) as T;
  }

  static async setByCategory(category: string, newSettings: any) {
    const settings = await this.getByCategory(category);

    const prevValue = JSON.parse(JSON.stringify(settings));

    await this.addCategoryToList(category);

    const setDone = await this.storage.set(this.getStorageKeyByCategory(category), newSettings);

    this.emitChange(category, prevValue, newSettings);

    return setDone;
  }

  static async removeByCategory(category: string) {
    const settings = await this.getByCategory(category);

    const prevValue = JSON.parse(JSON.stringify(settings));

    await this.removeCategoryFromList(category);

    const removeDone = await this.storage.remove(this.getStorageKeyByCategory(category));

    this.emitChange(category, prevValue, null);

    return removeDone;
  }
}
