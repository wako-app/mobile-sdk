import { ComponentFactoryResolver, Injector, ViewContainerRef } from '@angular/core';

import { catchError, first, map, switchMap, tap } from 'rxjs/operators';
import { EMPTY, forkJoin, from, of, ReplaySubject, Subject, throwError } from 'rxjs';

import { WakoModuleLoaderService } from './wako-module-loader.service';
import { MovieDetailBaseComponent } from '../../components/movie-detail-base.component';
import { EpisodeDetailBaseComponent } from '../../components/episode-detail-base.component';
import { EpisodeItemOptionBaseComponent } from '../../components/episode-item-option-base.component';
import { ShowDetailBaseComponent } from '../../components/show-detail-base.component';
import { WakoHttpRequestService } from '../http/wako-http-request.service';
import { mergeDeep } from '../../tools/utils.tool';
import { WakoSettingsService } from '../app/wako-settings.service';
import { Movie } from '../../entities/movie';
import { PluginBaseService } from './plugin-base.service';
import { Show } from '../../entities/show';
import { Episode } from '../../entities/episode';
import { WakoDebugService } from '../../tools/wako-debug.service';

export class WakoPluginLoaderService {
  loaded$ = new ReplaySubject<boolean>(1);

  pluginModuleMap = new Map<string, PluginModuleMap>();

  newPlugin$ = new Subject();

  protected storageListCategory = 'plugins';

  protected storagePluginPrefixCategory = 'plugin_id_';

  protected static instance: WakoPluginLoaderService;

  protected moduleLoader: WakoModuleLoaderService;

  constructor(protected cfr: ComponentFactoryResolver, protected injector: Injector) {
    this.moduleLoader = new WakoModuleLoaderService(injector);
  }

  static initialize(cfr: ComponentFactoryResolver, injector: Injector) {
    if (this.instance) {
      return;
    }

    this.instance = new this(cfr, injector);
  }

  static getInstance() {
    if (!this.instance) {
      throw new Error('PluginLoaderService has not been initialize');
    }

    return this.instance;
  }

  install(manifestUrl: string, lang?: string, loadIt = true) {
    let pluginId = null;

    return WakoHttpRequestService.get<PluginManifest>(manifestUrl).pipe(
      catchError((err) => {
        return throwError(err);
      }),
      switchMap((manifest) => {
        manifest.url = manifestUrl;

        pluginId = manifest.id;

        const paths = manifestUrl.split('/');
        paths.pop();
        const baseUrl = paths.join('/');

        const pluginUrl = manifest.entryPointV2.match('http') ? manifest.entryPointV2 : baseUrl + manifest.entryPointV2;

        const pluginDetail = new PluginDetail();
        pluginDetail.manifestUrl = manifestUrl;
        pluginDetail.manifest = manifest;

        return WakoHttpRequestService.get<string>(pluginUrl).pipe(
          switchMap((pluginSource) => {
            pluginDetail.source = pluginSource;
            if (manifest.languages) {
              pluginDetail.languages = {};
              const obss = [];
              Object.keys(manifest.languages).forEach((langKey) => {
                const langUrl = manifest.languages[langKey].match('http')
                  ? manifest.languages[langKey]
                  : baseUrl + manifest.languages[langKey];

                const obs = WakoHttpRequestService.get(langUrl).pipe(
                  tap((data) => {
                    pluginDetail.languages[langKey] = data;
                  }),
                  catchError(() => {
                    delete pluginDetail.languages[langKey];
                    return of(true);
                  })
                );

                obss.push(obs);
              });

              return forkJoin(obss);
            }
            return of(true);
          }),
          switchMap(() => {
            return from(this.savePluginDetail(pluginDetail.manifest.id, pluginDetail));
          })
        );
      }),

      switchMap(() => {
        return from(this.addToList(pluginId));
      }),
      switchMap(() => {
        if (lang && loadIt) {
          const isFirstLoad = !this.pluginModuleMap.has(pluginId);
          return this.load(pluginId, lang, isFirstLoad);
        }
        return of(true);
      }),
      tap(() => {
        this.loaded$.next(true);
        this.newPlugin$.next(true);
      })
    );
  }

  protected getStoragePluginCategory(pluginId: string) {
    return this.storagePluginPrefixCategory + pluginId;
  }

  protected savePluginDetail(pluginId: string, pluginDetail: PluginDetail) {
    return WakoSettingsService.setByCategory(this.getStoragePluginCategory(pluginId), pluginDetail);
  }

  protected getPluginDetail(pluginId: string) {
    return WakoSettingsService.getByCategory<PluginDetail>(this.getStoragePluginCategory(pluginId));
  }

  protected removePluginDetail(pluginId: string) {
    return WakoSettingsService.removeByCategory(this.getStoragePluginCategory(pluginId));
  }

  getAllInstalled() {
    return this.getInstalledPluginIds().then((list) => {
      const pluginManifests: PluginManifest[] = [];

      list.forEach((pluginId) => {
        if (this.pluginModuleMap.has(pluginId)) {
          pluginManifests.push(this.pluginModuleMap.get(pluginId).pluginDetail.manifest);
        }
      });

      return pluginManifests;
    });
  }

  getInstalledPluginIds(): Promise<string[]> {
    return WakoSettingsService.getByCategory<string[]>(this.storageListCategory).then((data) => {
      if (!data) {
        data = [];
      }
      return data;
    });
  }

  protected addToList(pluginId: string) {
    return from(this.getInstalledPluginIds()).pipe(
      switchMap((list) => {
        if (list.includes(pluginId)) {
          return of(true);
        }
        list.push(pluginId);
        return from(this.saveList(list));
      })
    );
  }

  saveList(list: string[]) {
    return WakoSettingsService.setByCategory(this.storageListCategory, list);
  }

  protected removeFromList(pluginId: string) {
    return from(this.getInstalledPluginIds()).pipe(
      switchMap((list) => {
        const newList = [];
        list.forEach((id) => {
          if (id !== pluginId) {
            newList.push(id);
          }
        });
        return from(this.saveList(newList));
      })
    );
  }

  loadAllInstalled(lang: string) {
    return from(this.getInstalledPluginIds()).pipe(
      switchMap((list) => {
        const obss = [];

        list.forEach((pluginId) => {
          obss.push(this.load(pluginId, lang, false));
        });

        if (obss.length === 0) {
          return of(true);
        }

        return forkJoin(obss);
      }),
      tap(() => this.loaded$.next(true)),
      catchError(() => {
        this.loaded$.next(true);
        return EMPTY;
      })
    );
  }

  protected load<T>(pluginId: string, lang: string, isFirstLoad: boolean) {
    return from(this.getPluginDetail(pluginId)).pipe(
      switchMap((pluginDetail) => {
        if (this.pluginModuleMap.has(pluginId)) {
          // Plugin already loaded
          console.log('PluginLoader', pluginId, 'already loaded');
          this.setLang(pluginId, lang);
          return of(true);
        }

        return this.moduleLoader.load(pluginDetail.source, pluginId, isFirstLoad).pipe(
          tap((module) => {
            this.pluginModuleMap.set(pluginDetail.manifest.id, {
              pluginDetail: pluginDetail,
              moduleType: module.moduleType,
              injector: module.injector,
            });

            this.setLang(pluginId, lang);
          })
        );
      }),
      catchError((e) => {
        console.log('PluginLoader', 'Error with plugin', pluginId, 'uninstall it', e);
        // Remove the plugin
        return this.uninstall(pluginId);
      })
    );
  }

  setLang(pluginId: string, lang: string) {
    const pluginModule = this.pluginModuleMap.get(pluginId);

    const pluginService = this.getPluginService(pluginId);

    const defaultLang = 'en';
    let translation = null;
    let defaultTranslation = null;

    if (pluginModule.pluginDetail.languages.hasOwnProperty(defaultLang)) {
      defaultTranslation = pluginModule.pluginDetail.languages[defaultLang];
      translation = defaultTranslation;
    }

    if (pluginModule.pluginDetail.languages.hasOwnProperty(lang)) {
      translation = pluginModule.pluginDetail.languages[lang];

      if (defaultTranslation) {
        translation = mergeDeep(defaultTranslation, translation);
      }
    }

    pluginService.setTranslation(lang, translation);
  }

  createComponentObservable(action: PluginAction, viewContainerRef: ViewContainerRef, data?: any, pluginId?: string) {
    return this.loaded$.pipe(
      first(),
      map(() => {
        let pluginMap = null;
        this.pluginModuleMap.forEach((plugin) => {
          if (pluginId && plugin.pluginDetail.manifest.id !== pluginId) {
            return;
          }
          pluginMap = plugin;
        });

        if (!pluginMap) {
          return null;
        }

        const moduleType = pluginMap.moduleType;

        if (
          action === 'movies' &&
          pluginMap.pluginDetail.manifest.actions.includes(action) &&
          moduleType.movieComponent
        ) {
          const compFactory = this.cfr.resolveComponentFactory<MovieDetailBaseComponent>(moduleType.movieComponent);
          const movieComponent = viewContainerRef.createComponent<MovieDetailBaseComponent>(
            compFactory,
            undefined,
            pluginMap.injector
          );

          movieComponent.instance.setMovie(data.movie);
        } else if (
          action === 'episodes' &&
          pluginMap.pluginDetail.manifest.actions.includes(action) &&
          moduleType.episodeComponent
        ) {
          const compFactory = this.cfr.resolveComponentFactory<EpisodeDetailBaseComponent>(moduleType.episodeComponent);
          const episodeComponent = viewContainerRef.createComponent<EpisodeDetailBaseComponent>(
            compFactory,
            undefined,
            pluginMap.injector
          );

          episodeComponent.instance.setShowEpisode(data.show, data.episode);
        } else if (action === 'settings' && moduleType.settingsComponent) {
          const compFactory = this.cfr.resolveComponentFactory<any>(moduleType.settingsComponent);
          viewContainerRef.createComponent<any>(compFactory, undefined, pluginMap.injector);
        } else if (action === 'plugin-detail' && moduleType.pluginDetailComponent) {
          const compFactory = this.cfr.resolveComponentFactory<any>(moduleType.pluginDetailComponent);
          viewContainerRef.createComponent<any>(compFactory, undefined, pluginMap.injector);
        } else if (
          action === 'episodes-item-option' &&
          pluginMap.pluginDetail.manifest.actions.includes(action) &&
          moduleType.episodeItemOptionComponent
        ) {
          const compFactory = this.cfr.resolveComponentFactory<EpisodeItemOptionBaseComponent>(
            moduleType.episodeItemOptionComponent
          );
          const episodeComponent = viewContainerRef.createComponent<EpisodeItemOptionBaseComponent>(
            compFactory,
            undefined,
            pluginMap.injector
          );

          episodeComponent.instance.setShowEpisode(data.show, data.episode);
        } else if (
          action === 'shows' &&
          pluginMap.pluginDetail.manifest.actions.includes(action) &&
          moduleType.showComponent
        ) {
          const compFactory = this.cfr.resolveComponentFactory<ShowDetailBaseComponent>(moduleType.showComponent);
          const showComponent = viewContainerRef.createComponent<ShowDetailBaseComponent>(
            compFactory,
            undefined,
            pluginMap.injector
          );

          showComponent.instance.setShow(data.show);
        }

        return true;
      })
    );
  }

  createComponent(action: PluginAction, viewContainerRef: ViewContainerRef, data?: any, pluginId?: string) {
    this.createComponentObservable(action, viewContainerRef, data, pluginId).subscribe();
  }

  addonHasActionComponent(pluginId: string, action: PluginAction) {
    return this.loaded$.pipe(first()).pipe(
      map(() => {
        let has = false;
        this.pluginModuleMap.forEach((pluginMap) => {
          if (pluginId && pluginMap.pluginDetail.manifest.id !== pluginId) {
            return;
          }

          const moduleType = pluginMap.moduleType as any;

          switch (action) {
            case 'movies':
              has = !!moduleType.movieComponent;
              break;
            case 'episodes':
              has = !!moduleType.episodeComponent;
              break;
            case 'settings':
              has = !!moduleType.settingsComponent;
              break;
            case 'plugin-detail':
              has = !!moduleType.pluginDetailComponent;
              break;
          }
        });

        return has;
      })
    );
  }

  isOfficialAddon(manifestUrl: string) {
    return manifestUrl.match('githubusercontent.com/wako-app') !== null;
  }

  uninstall(pluginId: string) {
    return this.removeFromList(pluginId).pipe(
      switchMap(() => {
        this.pluginModuleMap.delete(pluginId);

        return from(this.removePluginDetail(pluginId));
      })
    );
  }

  versionToInt(version: string) {
    return +version.replace('.', ''); // Replace only the first .
  }

  getPluginService(pluginId: string): PluginBaseService {
    const plugin = this.pluginModuleMap.get(pluginId);
    if (plugin) {
      return this.moduleLoader.getPluginService(plugin.moduleType, plugin.injector);
    }
    return null;
  }

  private getPluginIdsByAction(action: PluginAction) {
    const pluginIds = [];
    this.pluginModuleMap.forEach((pluginMap) => {
      if (pluginMap.pluginDetail.manifest.actions.includes(action)) {
        pluginIds.push(pluginMap.pluginDetail.manifest.id);
      }
    });

    return pluginIds;
  }

  async beforeMovieMiddleware(movie: Movie): Promise<Movie> {
    for (const pluginId of this.getPluginIdsByAction('before-movie-middleware')) {
      const pluginService = this.getPluginService(pluginId);
      if (typeof pluginService.beforeMovieMiddleware === 'function') {
        try {
          movie = await pluginService.beforeMovieMiddleware(movie);
        } catch (e) {
          WakoDebugService.log(pluginId, e.toString());
        }
      }
    }

    return movie;
  }

  async afterMovieMiddleware(movie: Movie): Promise<Movie> {
    for (const pluginId of this.getPluginIdsByAction('after-movie-middleware')) {
      const pluginService = this.getPluginService(pluginId);
      if (typeof pluginService.afterMovieMiddleware === 'function') {
        try {
          movie = await pluginService.afterMovieMiddleware(movie);
        } catch (e) {
          WakoDebugService.log(pluginId, e.toString());
        }
      }
    }

    return movie;
  }

  async beforeShowMiddleware(show: Show): Promise<Show> {
    for (const pluginId of this.getPluginIdsByAction('before-show-middleware')) {
      const pluginService = this.getPluginService(pluginId);
      if (typeof pluginService.beforeShowMiddleware === 'function') {
        try {
          show = await pluginService.beforeShowMiddleware(show);
        } catch (e) {
          WakoDebugService.log(pluginId, e.toString());
        }
      }
    }

    return show;
  }

  async afterShowMiddleware(show: Show): Promise<Show> {
    for (const pluginId of this.getPluginIdsByAction('after-show-middleware')) {
      const pluginService = this.getPluginService(pluginId);
      if (typeof pluginService.afterShowMiddleware === 'function') {
        try {
          show = await pluginService.afterShowMiddleware(show);
        } catch (e) {
          WakoDebugService.log(pluginId, e.toString());
        }
      }
    }

    return show;
  }

  async beforeEpisodeMiddleware(show: Show, episode: Episode): Promise<Episode> {
    for (const pluginId of this.getPluginIdsByAction('before-episode-middleware')) {
      const pluginService = this.getPluginService(pluginId);
      if (typeof pluginService.beforeEpisodeMiddleware === 'function') {
        try {
          episode = await pluginService.beforeEpisodeMiddleware(show, episode);
        } catch (e) {
          WakoDebugService.log(pluginId, e.toString());
        }
      }
    }

    return episode;
  }

  async afterEpisodeMiddleware(show: Show, episode: Episode): Promise<Episode> {
    for (const pluginId of this.getPluginIdsByAction('after-episode-middleware')) {
      const pluginService = this.getPluginService(pluginId);
      if (typeof pluginService.afterEpisodeMiddleware === 'function') {
        try {
          episode = await pluginService.afterEpisodeMiddleware(show, episode);
        } catch (e) {
          WakoDebugService.log(pluginId, e.toString());
        }
      }
    }

    return episode;
  }
}

export interface PluginModuleMap {
  pluginDetail: PluginDetail;
  moduleType: any;
  injector: Injector;
}

export declare type PluginAction =
  | 'movies'
  | 'episodes'
  | 'plugin-detail'
  | 'settings'
  | 'episodes-item-option'
  | 'shows'
  | 'before-movie-middleware'
  | 'after-movie-middleware'
  | 'before-show-middleware'
  | 'after-show-middleware'
  | 'before-episode-middleware'
  | 'after-episode-middleware';

export class PluginDetail {
  manifest: PluginManifest;
  manifestUrl: string;
  source: string;
  languages: { [key: string]: {} };
}

export interface PluginManifest {
  url: string;
  version: string;
  id: string;
  name: string;
  description: string;
  author: string;
  actions: PluginAction[];
  entryPointV2: string;
  /**
   * Entry point for wako version < 4 build with angular 8, won't work with wako 4
   * @deprecated use now entryPointV2
   */
  entryPoint: string;
  languages: { [key: string]: string };
  changeLogs?: { [key: string]: string };
}
