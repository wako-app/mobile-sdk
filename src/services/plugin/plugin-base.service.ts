import { Movie } from '../../entities/movie';
import { Show } from '../../entities/show';
import { Episode } from '../../entities/episode';
import { ExplorerFolderItem } from '../../entities/explorer/explorer-item';
import { ExplorerFile } from '../../entities/explorer/explorer-file';
import { KodiOpenParams, OpenMedia } from '../kodi/services/kodi-app.service';
import { WakoFileActionButton } from '../app/wako-file-action.service';

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

  /**
   * Method to retrieve ExplorerFolderItem if your plugin has the "file-explorer" action enabled
   */
  abstract fetchExplorerFolderItem(): Promise<ExplorerFolderItem | ExplorerFolderItem[]>;

  /**
   * If the file you provide from fetchExplorerFolderItem() doesn't contains any link or streamLink then wako
   * will call this method. Then you can return the list of WakoFileActionButton you want
   */
  abstract getFileActionButtons(
    file: ExplorerFile,
    title?: string,
    posterUrl?: string,
    seekTo?: number,
    openMedia?: OpenMedia,
    kodiOpenParams?: KodiOpenParams
  ): Promise<WakoFileActionButton[]>;
}
