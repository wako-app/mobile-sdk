import { map } from 'rxjs/operators';
import { KodiApiService } from '../../services/kodi-api.service';

export class KodiPlayerGetItemForm {
  static submit<T>(playerId: number) {
    const properties = [
      'album',
      'albumartist',
      'artist',
      'episode',
      'art',
      'file',
      'genre',
      'plot',
      'rating',
      'season',
      'showtitle',
      'studio',
      'imdbnumber',
      'tagline',
      'title',
      'track',
      'year',
      'streamdetails',
      'originaltitle',
      'playcount',
      'runtime',
      'duration',
      'cast',
      'writer',
      'director',
      'userrating',
      'firstaired',
      'displayartist',
      'thumbnail',
      'dateadded',
      'artistid',
      'albumid',
      'tvshowid',
      'fanart'
    ];
    return KodiApiService.doHttpAction<{ item: T }>('Player.GetItem', {
      playerid: playerId,
      properties: properties
    }).pipe(map(d => d.item));
  }
}
