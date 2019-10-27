import { KodiApiService } from '../../services/kodi-api.service';

export class KodiPlaylistAddItemsForm {
  static submit(playListId: number, items: any[]) {
    return KodiApiService.doHttpAction<{
      items: { label: string; type: string }[];
    }>('Playlist.Add', {
      playlistid: playListId,
      items: items
    });
  }
}
