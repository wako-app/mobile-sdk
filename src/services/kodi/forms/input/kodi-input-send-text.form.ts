import { KodiApiService } from '../../services/kodi-api.service';

export class KodiInputSendTextForm {
  static submit(text: string) {
    return KodiApiService.doAction('Input.SendText', {
      text: text
    });
  }
}
