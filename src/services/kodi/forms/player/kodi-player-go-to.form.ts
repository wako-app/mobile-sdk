import { KodiApiService } from '../../services/kodi-api.service';

export class KodiPlayerGoToForm {
  static submit(playerId: number, to: 'previous' | 'next') {
    return KodiApiService.doHttpAction<{ playerid: number }[]>('Player.GoTo', {
      playerid: playerId,
      to: to
    });
  }
}
