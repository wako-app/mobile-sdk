import { KodiApiService } from '../../services/kodi-api.service';

export class KodiPlayerSetSubtitleForm {
  static submit(playerId: number, enabled: boolean, subtitleIndex?: number) {
    return KodiApiService.doAction('Player.SetSubtitle', {
      playerid: playerId,
      subtitle: enabled
        ? Number.isInteger(subtitleIndex)
          ? subtitleIndex
          : 'on'
        : 'off',
      enable: enabled
    });
  }
}
