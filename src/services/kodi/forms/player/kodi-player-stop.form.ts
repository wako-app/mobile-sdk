import { KodiApiService } from '../../services/kodi-api.service';

export class KodiPlayerStopForm {
  static submit(playerId: number) {
    return KodiApiService.doAction('Player.Stop', {
      playerid: playerId
    });
  }
}
