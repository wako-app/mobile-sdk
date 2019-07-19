import { KodiApiService } from '../../services/kodi-api.service';

export class KodiExecuteAddonForm {
  static submit(addonId: string, params: string) {
    return KodiApiService.doHttpAction('Addons.ExecuteAddon', {
      addonid: addonId,
      params: params
    });
  }
}
