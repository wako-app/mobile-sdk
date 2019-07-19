import { KodiApiService } from '../../services/kodi-api.service';

export class KodiInputExecuteActionForm {
  static submit(action: string) {
    return KodiApiService.doAction('Input.ExecuteAction', {
      action: action
    });
  }
}
