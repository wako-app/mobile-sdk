import { KodiApiService } from '../../services/kodi-api.service';

export class KodiPlayerSetSeekForm {
  static submit(playerId: number, seek: number) {
    return KodiApiService.doAction('Player.Seek', {
      playerid: playerId,
      value: seek
    });
  }
}
