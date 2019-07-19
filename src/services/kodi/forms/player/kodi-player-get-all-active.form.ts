import { KodiApiService } from '../../services/kodi-api.service';

export class KodiPlayerGetAllActiveForm {
  static submit() {
    return KodiApiService.doHttpAction<{ playerid: number }[]>(
      'Player.GetActivePlayers'
    );
  }
}
