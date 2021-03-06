import { KodiApiService } from '../../services/kodi-api.service';

export class KodiPlayerGetPropertiesForm {
  static submit(
    playerId: number,
    properties = [
      'playlistid',
      'speed',
      'position',
      'totaltime',
      'time',
      'subtitleenabled',
      'subtitles',
      'currentsubtitle',
      'currentaudiostream',
      'audiostreams'
    ]
  ) {
    return KodiApiService.doHttpAction<any>('Player.GetProperties', {
      playerid: playerId,
      properties: properties
    });
  }
}
