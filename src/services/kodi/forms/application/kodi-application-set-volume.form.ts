import { KodiApiService } from "../../services/kodi-api.service";

export class KodiApplicationSetVolumeForm {
  static submit(volume: number) {
    return KodiApiService.doHttpAction("Application.SetVolume", {
      volume: volume,
    });
  }
}
