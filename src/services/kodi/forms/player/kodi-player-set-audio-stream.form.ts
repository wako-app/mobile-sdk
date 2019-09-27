import { KodiApiService } from '../../services/kodi-api.service';

export class KodiPlayerSetAudioStreamForm {
  static submit(playerId: number, enabled: boolean, index: number) {
    return KodiApiService.doAction('Player.SetAudioStream', {
      playerid: playerId,
      stream: index
    });
  }
}
