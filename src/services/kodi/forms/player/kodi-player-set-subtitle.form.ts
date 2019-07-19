import { KodiApiService } from '../../services/kodi-api.service';

export class KodiPlayerSetSubtitleForm {
  static submit(playerId: number, enabled: boolean) {
    return KodiApiService.doAction('Player.SetSubtitle', {
      playerid: playerId,
      subtitle: enabled ? 'on' : 'off',
      enable: enabled
    });
  }
}
