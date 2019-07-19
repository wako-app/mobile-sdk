import { KodiPlayerSetSeekForm } from '../forms/player/kodi-player-set-seek.form';

export class KodiSeekToCommand {
  static handle(playerId: number, seek: number) {
    return KodiPlayerSetSeekForm.submit(playerId, seek);
  }
}
