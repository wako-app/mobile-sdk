import { KodiApiService } from '../../services/kodi-api.service';

export class KodiPlaylistGetItemsForm {
  static submit(playListId = 1) {
    return KodiApiService.doHttpAction<{
      items: { label: string; type: string }[];
    }>('Playlist.GetItems', {
      playlistid: playListId
    });
  }
}
