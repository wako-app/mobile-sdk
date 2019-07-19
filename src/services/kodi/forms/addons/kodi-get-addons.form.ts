import { KodiApiService } from '../../services/kodi-api.service';
import { KodiAddonDetailsDto } from '../../dtos/kodi-addon-details.dto';

export class KodiGetAddonsForm {
  static submit() {
    return KodiApiService.doHttpAction<{ addons: KodiAddonDetailsDto[] }>(
      'Addons.GetAddons'
    );
  }
}
