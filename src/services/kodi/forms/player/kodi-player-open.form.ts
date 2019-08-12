import { KodiApiService } from '../../services/kodi-api.service';

export class KodiPlayerOpenForm {
  static submit(itemOrFileUrl: object | string) {
    // Do not use websocket since it fails sometime, depending on the file url

    if (typeof itemOrFileUrl === 'string') {
      itemOrFileUrl = {
        file: itemOrFileUrl
      };
    }

    return KodiApiService.doHttpAction('Player.Open', {
      item: itemOrFileUrl
    });
  }
}
