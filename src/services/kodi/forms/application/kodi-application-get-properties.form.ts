import { KodiApplicationGetPropertiesDto } from '../../dtos/kodi-application-get-properties.dto';
import { KodiApiService } from '../../services/kodi-api.service';

export class KodiApplicationGetPropertiesForm {
  static submit(properties = ['volume', 'muted', 'version']) {
    return KodiApiService.doHttpAction<KodiApplicationGetPropertiesDto>(
      'Application.GetProperties',
      {
        properties: properties
      }
    );
  }
}
