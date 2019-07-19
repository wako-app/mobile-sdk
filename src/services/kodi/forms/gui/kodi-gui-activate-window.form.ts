import { KodiApiService } from '../../services/kodi-api.service';

export class KodiGuiActivateWindowForm {
  static submit(window: string) {
    return KodiApiService.doHttpAction<any>('GUI.ActivateWindow', {
      window: window
    });
  }
}
