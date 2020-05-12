import { Movie } from '../../entities/movie';
import { Show } from '../../entities/show';
import { Episode } from '../../entities/episode';

export abstract class PluginBaseService {
  /**
   * when wako initialize the plugin when the app starts
   */
  abstract initialize();

  /**
   * Set the app translation
   *
   * @param lang
   * @param translations
   */
  abstract setTranslation(lang: string, translations: Object);

  /**
   * Called once, after the plugin has been installed
   */
  abstract afterInstall();

  /**
   * Custom action to be called from outside
   */
  abstract customAction(action: string, data: any);

  /**
   * Method called before rendering the view.
   * The more time it takes, the more the user will have to wait
   * @param movie
   */
  abstract async beforeMovieMiddleware(movie: Movie): Promise<Movie>;

  /**
   * Method called after the view has been rendered.
   * The view will be refreshed with the new data
   * @param movie
   */
  abstract async afterMovieMiddleware(movie: Movie): Promise<Movie>;

  /**
   * Method called before rendering the view.
   * The more time it takes, the more the user will have to wait
   * @param show
   */
  abstract async beforeShowMiddleware(show: Show): Promise<Show>;

  /**
   * Method called after the view has been rendered.
   * The view will be refreshed with the new data
   * @param show
   */
  abstract async afterShowMiddleware(show: Show): Promise<Show>;

  /**
   * Method called before rendering the view.
   * The more time it takes, the more the user will have to wait
   * @param show
   * @param episode
   */
  abstract async beforeEpisodeMiddleware(show: Show, episode: Episode): Promise<Episode>;

  /**
   * Method called after the view has been rendered.
   * The view will be refreshed with the new data
   * @param show
   * @param episode
   */
  abstract async afterEpisodeMiddleware(show: Show, episode: Episode): Promise<Episode>;
}
