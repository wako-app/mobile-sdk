import { WakoStorage } from './../storage/wako-storage.service';
import { Subject } from 'rxjs';
import { Playlist } from '../../entities/playlist';
import { PlaylistVideo } from '../../entities/playlist-video';
import { OpenMedia } from '../kodi/services/kodi-app.service';
import { isSameId } from '../../tools/utils.tool';

export class PlaylistService {
  change$ = new Subject<boolean>();

  private storageKey = 'wako_playlist_items';

  private static instance: PlaylistService;

  private constructor(private storage: WakoStorage) {}

  static initialize(wakoStorage: WakoStorage) {
    if (this.instance) {
      return;
    }

    this.instance = new this(wakoStorage);
  }

  static getInstance() {
    if (!this.instance) {
      throw new Error('PlaylistService has not been initialize');
    }

    return this.instance;
  }

  private async getPlaylistsFromStorage() {
    const playlists = (await this.storage.get(this.storageKey)) as Playlist[];

    if (!playlists) {
      return [];
    }
    return playlists;
  }

  private async setPlaylistsInStorage(playlists: Playlist[]) {
    return await this.storage.set(this.storageKey, playlists);
  }

  async delete(id: string) {
    const playlists = await this.getPlaylistsFromStorage();

    const newPlaylists: Playlist[] = [];
    playlists.forEach((item) => {
      if (item.id !== id) {
        newPlaylists.push(item);
      }
    });

    await this.setPlaylistsInStorage(newPlaylists);
  }

  async get(id: string) {
    const playlists = await this.getPlaylistsFromStorage();
    return playlists.find((playlist) => playlist.id === id);
  }

  async addOrUpdate(playlist: Playlist, emitEvent = false) {
    await this.delete(playlist.id);

    const playlists = await this.getPlaylistsFromStorage();
    playlist.updatedAt = new Date().toISOString();
    playlists.push(playlist);

    await this.setPlaylistsInStorage(playlists);

    if (emitEvent) {
      this.change$.next(true);
    }
  }

  async addPlaylistItems(id: string, playlistVideos: PlaylistVideo[], emitEvent = false) {
    const playlists = await this.getPlaylistsFromStorage();
    const playlist = playlists.find((item) => item.id === id);

    if (playlist) {
      playlist.updatedAt = new Date().toISOString();
      playlist.items.push(...playlistVideos);
      await this.setPlaylistsInStorage(playlists);
    }

    if (emitEvent) {
      this.change$.next(true);
    }
  }

  async deletePlaylistItem(id: string, itemIndex: number) {
    const playlists = await this.getPlaylistsFromStorage();
    const playlist = playlists.find((item) => item.id === id);

    if (playlist) {
      const newItems = [];
      playlist.items.forEach((item, index) => {
        if (index !== itemIndex) {
          newItems.push(item);
        }
      });
      if (newItems.length === 0) {
        return await this.delete(id);
      }
      playlist.items = newItems;

      playlist.updatedAt = new Date().toISOString();

      await this.setPlaylistsInStorage(playlists);
    }
  }

  async getAllPlaylistsSortedByDateDesc() {
    const playlists = await this.getPlaylistsFromStorage();

    return playlists.sort((playlist1, playlist2) => {
      if (playlist1.updatedAt === playlist2.updatedAt) {
        return 0;
      }
      return new Date(playlist1.updatedAt) > new Date(playlist2.updatedAt) ? -1 : 1;
    });
  }

  async getPlaylistFromItem(item: PlaylistVideo) {
    const playlists = await this.getAllPlaylistsSortedByDateDesc();
    for (const playlist of playlists) {
      for (const i of playlist.items) {
        if (this.isCurrentItem(i, item.url, item.openMedia)) {
          return playlist;
        }
      }
    }
    return null;
  }

  isCurrentItem(item: PlaylistVideo, videoUrl: string, openMedia?: OpenMedia) {
    if (openMedia && item.openMedia) {
      if (item.openMedia.movieIds && isSameId(item.openMedia.movieIds, openMedia.movieIds)) {
        return true;
      }

      if (item.openMedia.showIds && isSameId(item.openMedia.showIds, openMedia.showIds)) {
        return (
          openMedia.seasonNumber === item.openMedia.seasonNumber &&
          openMedia.episodeNumber === item.openMedia.episodeNumber
        );
      }
    }

    return videoUrl === item.url;
  }

  getPlaylistIdFromOpenMedia(openMedia: OpenMedia) {
    if (openMedia && (openMedia.movieIds || openMedia.showIds)) {
      if (openMedia.movieIds) {
        if (openMedia.movieIds.imdb) {
          return 'movie_imdb_' + openMedia.movieIds.imdb;
        } else if (openMedia.movieIds.trakt) {
          return 'movie_trakt_' + openMedia.movieIds.trakt;
        } else if (openMedia.movieIds.simkl) {
          return 'movie_simkl_' + openMedia.movieIds.simkl;
        }
        return 'movie_ids_' + JSON.stringify(openMedia.movieIds);
      }
      if (openMedia.showIds) {
        if (openMedia.showIds.imdb) {
          return 'show_imdb_' + openMedia.showIds.imdb + '_' + openMedia.seasonNumber;
        } else if (openMedia.showIds.trakt) {
          return 'show_trakt_' + openMedia.showIds.trakt + '_' + openMedia.seasonNumber;
        } else if (openMedia.showIds.simkl) {
          return 'show_simkl_' + openMedia.showIds.simkl + '_' + openMedia.seasonNumber;
        }
        return 'show_ids_' + JSON.stringify(openMedia.showIds);
      }
    }

    return null;
  }

  async clear() {
    return await this.storage.remove(this.storageKey);
  }
}
