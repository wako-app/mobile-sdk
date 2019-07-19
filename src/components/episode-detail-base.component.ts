import { Episode } from '../entities/episode';
import { Show } from '../entities/show';

export abstract class EpisodeDetailBaseComponent {
  abstract setShowEpisode(show: Show, episode: Episode);
}
