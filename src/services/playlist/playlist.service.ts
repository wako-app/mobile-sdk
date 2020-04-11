import { Playlist } from "../../entities/playlist";
import { Storage } from "@ionic/storage";
import { PlaylistVideo } from "../../entities/playlist-video";

export class PlaylistService {
  private storageKey = "wako_playlist_items";

  private static instance: PlaylistService;

  private constructor(private storage: Storage) {}

  static initialize(storage: Storage) {
    if (this.instance) {
      return;
    }

    this.instance = new this(storage);
  }

  static getInstance() {
    if (!this.instance) {
      throw new Error("PlaylistService has not been initialize");
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

  async addOrUpdate(playlist: Playlist) {
    await this.delete(playlist.id);

    const playlists = await this.getPlaylistsFromStorage();
    playlist.updatedAt = new Date().toISOString();
    playlists.push(playlist);

    await this.setPlaylistsInStorage(playlists);
  }

  async addPlaylistItems(id: string, playlistVideos: PlaylistVideo[]) {
    const playlists = await this.getPlaylistsFromStorage();
    const playlist = playlists.find((item) => item.id === id);

    if (playlist) {
      playlist.updatedAt = new Date().toISOString();
      playlist.items.push(...playlistVideos);
      await this.setPlaylistsInStorage(playlists);
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
      return new Date(playlist1.updatedAt) > new Date(playlist2.updatedAt)
        ? -1
        : 1;
    });
  }
}
