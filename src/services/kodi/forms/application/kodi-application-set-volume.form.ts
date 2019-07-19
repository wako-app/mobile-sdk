import { KodiApiService } from '../../services/kodi-api.service';

export class KodiApplicationSetVolumeForm {
  static submit(volume: number) {
    return KodiApiService.doAction('Application.SetVolume', {
      volume: volume
    });
  }
}
