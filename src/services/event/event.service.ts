import { EventEmitter } from '@angular/core';

export class EventService {
  private static events = new Map<string, EventEmitter<EventAction<any>>>();

  private static getEventCategoryKey(eventCategory: string) {
    return 'cat_' + eventCategory;
  }

  private static getEventNameKey(eventCategory: string, eventName: string) {
    return 'name_' + eventCategory + '_' + eventName;
  }

  static emit(eventCategory: string, eventName: string, data?: any) {
    const eventCategoryKey = this.getEventCategoryKey(eventCategory);
    const eventNameKey = this.getEventNameKey(eventCategory, eventName);

    if (!this.events.has(eventCategoryKey)) {
      this.events.set(eventCategoryKey, new EventEmitter<EventAction<any>>());
    }

    if (!this.events.has(eventNameKey)) {
      this.events.set(eventNameKey, new EventEmitter<EventAction<any>>());
    }

    const action: EventAction<any> = {
      action: eventName,
      data: data
    };

    this.events.get(eventCategoryKey).next(action);

    this.events.get(eventNameKey).next(action);
  }

  static subscribe<T>(eventCategory: string, eventName?: string) {
    const eventKey = eventName
      ? this.getEventNameKey(eventCategory, eventName)
      : this.getEventCategoryKey(eventCategory);

    if (!this.events.has(eventKey)) {
      this.events.set(eventKey, new EventEmitter<EventAction<T>>());
    }

    return this.events.get(eventKey) as EventEmitter<EventAction<T>>;
  }
}

export interface EventAction<T> {
  action: string;
  data?: T;
}

export const EventCategory = {
  showHistory: 'ShowHistoryCategoryEvent',
  seasonHistory: 'SeasonHistoryCategoryEvent',
  episodeHistory: 'EpisodeHistoryCategoryEvent',
  movie: 'MovieCategoryEvent',
  searchSource: 'SearchSource',
  kodiRemote: 'KodiRemote',
  kodi: 'kodi'
};

export const EventName = {
  addToHistory: 'addToHistory',
  removeToHistory: 'removeToHistory',
  addToWatchList: 'addToWatchList',
  removeToWatchList: 'removeToWatchList',
  addToCollection: 'addToCollection',
  removeToCollection: 'removeToCollection',
  searchFromOpenButton: 'searchFromOpenButton',
  searchFromSourceList: 'searchFromSourceList',
  open: 'open'
};

export interface EventChangeData {
  imdbId?: string;
  callOrigin: string;
}

export interface EventShowHistoryChangeData extends EventChangeData {
  showTraktId: number;
  showTitle: string;
  seasonNumber?: number;
  episodeNumber?: number;
}
