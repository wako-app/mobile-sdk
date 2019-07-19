import { KodiApiService } from '../../services/kodi-api.service';

export class KodiInputForm {
  static submit(action: string, params = null) {
    return KodiApiService.doHttpAction('Input.' + action, params);
  }
}
