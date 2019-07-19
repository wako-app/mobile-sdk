import { KodiApiService } from '../../services/kodi-api.service';
import { KodiAddonDetailsDto } from '../../dtos/kodi-addon-details.dto';

export class KodiGetAddonDetailsForm {
  static submit(addonId: string) {
    return KodiApiService.doHttpAction<KodiAddonDetailsDto>(
      'Addons.GetAddonDetails',
      {
        addonid: addonId
      }
    );
  }
}
