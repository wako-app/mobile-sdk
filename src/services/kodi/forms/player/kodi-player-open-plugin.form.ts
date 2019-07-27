import { KodiApiService } from '../../services/kodi-api.service';

export class KodiPlayerOpenPluginForm {
  static submit(fileUrl: string) {
    // Do not use websocket since it fails sometime, depending on the file url
    return KodiApiService.doHttpAction('Player.Open', {
      item: {
        path: fileUrl
      }
    });
  }
}
