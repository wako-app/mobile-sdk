import {
  Injectable,
  NgModuleFactory,
  NgModuleRef,
  ViewContainerRef
} from '@angular/core';

import { first, switchMap, tap } from 'rxjs/operators';
import { forkJoin, from, of, ReplaySubject } from 'rxjs';

import { Storage } from '@ionic/storage';

import { ModuleLoaderService } from './module-loader.service';
import { WakoBaseHttpService } from '../http/wako-base-http.service';
import { PluginBaseService } from './plugin-base.service';
import { MovieDetailBaseComponent } from '../../components/movie-detail-base.component';
import { EpisodeDetailBaseComponent } from '../../components/episode-detail-base.component';
import { EpisodeItemOptionBaseComponent } from '../../components/episode-item-option-base.component';

@Injectable()
export class PluginLoaderService {
  private loaded$ = new ReplaySubject<boolean>(1);

  private pluginModuleMap = new Map<string, PluginModuleMap>();

  constructor(
    private storage: Storage,
    private moduleLoader: ModuleLoaderService
  ) {}

  install(manifestUrl: string, lang: string) {
    let pluginId = null;
    return WakoBaseHttpService.get<PluginManifest>(manifestUrl).pipe(
      switchMap(manifest => {
        manifest.url = manifestUrl;

        pluginId = manifest.id;

        const paths = manifestUrl.split('/');
        paths.pop();
        const baseUrl = paths.join('/');

        const pluginUrl = manifest.entryPoint.match('http')
          ? manifest.entryPoint
          : baseUrl + manifest.entryPoint;

        const pluginDetail = new PluginDetail();

        pluginDetail.manifestUrl = manifestUrl;
        pluginDetail.manifest = manifest;

        return WakoBaseHttpService.get<string>(pluginUrl).pipe(
          switchMap(pluginSource => {
            pluginDetail.source = pluginSource;
            if (manifest.languages) {
              pluginDetail.languages = {};
              const obss = [];
              Object.keys(manifest.languages).forEach(langKey => {
                const langUrl = manifest.languages[langKey].match('http')
                  ? manifest.languages[langKey]
                  : baseUrl + manifest.languages[langKey];

                const obs = WakoBaseHttpService.get(langUrl).pipe(
                  tap(data => {
                    pluginDetail.languages[langKey] = data;
                  })
                );

                obss.push(obs);
              });

              return forkJoin(obss);
            }
            return of(true);
          }),
          switchMap(() => {
            return from(
              this.savePluginDetail(pluginDetail.manifest.id, pluginDetail)
            );
          })
        );
      }),

      switchMap(() => {
        return from(this.addToList(pluginId));
      }),
      switchMap(() => {
        return this.load(pluginId, lang, true);
      }),
      tap(() => {
        this.loaded$.next(true);
      })
    );
  }

  private savePluginDetail(pluginId: string, pluginDetail: PluginDetail) {
    return this.storage.set(pluginId, pluginDetail);
  }

  private getPluginDetail(pluginId: string) {
    return this.storage.get(pluginId) as Promise<PluginDetail>;
  }

  getAllInstalled() {
    return this.getInstalledPluginIds().then(list => {
      const pluginManifests: PluginManifest[] = [];

      list.forEach(pluginId => {
        pluginManifests.push(
          this.pluginModuleMap.get(pluginId).pluginDetail.manifest
        );
      });

      return pluginManifests;
    });
  }

  private getInstalledPluginIds(): Promise<string[]> {
    return this.storage.get('plugin_list').then(data => {
      if (!data) {
        data = [];
      }
      return data;
    });
  }

  private addToList(pluginId: string) {
    return from(this.getInstalledPluginIds()).pipe(
      switchMap(list => {
        if (list.includes(pluginId)) {
          return of(true);
        }
        list.push(pluginId);
        return from(this.storage.set('plugin_list', list));
      })
    );
  }

  loadAllInstalled(lang: string) {
    return from(this.getInstalledPluginIds()).pipe(
      switchMap(list => {
        const obss = [];

        list.forEach(pluginId => {
          obss.push(this.load(pluginId, lang, false));
        });

        return forkJoin(obss);
      }),
      tap(() => this.loaded$.next(true))
    );
  }

  private load<T>(pluginId: string, lang: string, isFirstLoad: boolean) {
    return from(this.getPluginDetail(pluginId)).pipe(
      switchMap(pluginDetail => {
        return this.moduleLoader
          .load(pluginDetail.source, pluginId, isFirstLoad)
          .pipe(
            tap(module => {
              this.pluginModuleMap.set(pluginDetail.manifest.id, {
                pluginDetail: pluginDetail,
                moduleFactory: module.moduleFactory,
                moduleRef: module.moduleRef
              });

              this.setLang(pluginId, lang);
            })
          );
      })
    );
  }

  setLang(pluginId: string, lang: string) {
    const pluginModule = this.pluginModuleMap.get(pluginId);
    const moduleType = pluginModule.moduleFactory.moduleType as any;

    const pluginService = pluginModule.moduleRef.injector.get(
      moduleType.pluginService
    ) as PluginBaseService;

    if (pluginModule.pluginDetail.languages.hasOwnProperty(lang)) {
      pluginService.setTranslation(
        lang,
        pluginModule.pluginDetail.languages[lang]
      );
    }
  }

  createComponent(
    action: PluginAction,
    viewContainerRef: ViewContainerRef,
    data?: any
  ) {
    this.loaded$.pipe(first()).subscribe(() => {
      this.pluginModuleMap.forEach(pluginMap => {
        const moduleType = pluginMap.moduleFactory.moduleType as any;
        const moduleRef = pluginMap.moduleRef;

        if (
          action === 'movies' &&
          pluginMap.pluginDetail.manifest.actions.includes(action) &&
          moduleType.movieComponent
        ) {
          const compFactory = moduleRef.componentFactoryResolver.resolveComponentFactory<
            MovieDetailBaseComponent
          >(moduleType.movieComponent);
          const movieComponent = viewContainerRef.createComponent<
            MovieDetailBaseComponent
          >(compFactory);

          movieComponent.instance.setMovie(data.movie);
        } else if (
          action === 'episodes' &&
          pluginMap.pluginDetail.manifest.actions.includes(action) &&
          moduleType.episodeComponent
        ) {
          const compFactory = moduleRef.componentFactoryResolver.resolveComponentFactory<
            EpisodeDetailBaseComponent
          >(moduleType.episodeComponent);
          const episodeComponent = viewContainerRef.createComponent<
            EpisodeDetailBaseComponent
          >(compFactory);

          episodeComponent.instance.setShowEpisode(data.show, data.episode);
        } else if (action === 'settings' && moduleType.settingsComponent) {
          const compFactory = moduleRef.componentFactoryResolver.resolveComponentFactory<
            any
          >(moduleType.settingsComponent);
          viewContainerRef.createComponent<any>(compFactory);
        } else if (
          action === 'plugin-detail' &&
          moduleType.pluginDetailComponent
        ) {
          const compFactory = moduleRef.componentFactoryResolver.resolveComponentFactory<
            any
          >(moduleType.pluginDetailComponent);
          viewContainerRef.createComponent<any>(compFactory);
        } else if (
          action === 'episodes-item-option' &&
          pluginMap.pluginDetail.manifest.actions.includes(action) &&
          moduleType.episodeItemOptionComponent
        ) {
          const compFactory = moduleRef.componentFactoryResolver.resolveComponentFactory<
            EpisodeItemOptionBaseComponent
          >(moduleType.episodeItemOptionComponent);
          const episodeComponent = viewContainerRef.createComponent<
            EpisodeItemOptionBaseComponent
          >(compFactory);

          episodeComponent.instance.setShowEpisode(data.show, data.episode);
        }
      });
    });
  }
}

export declare type PluginAction =
  | 'movies'
  | 'episodes'
  | 'plugin-detail'
  | 'settings'
  | 'episodes-item-option';

export interface PluginModuleMap {
  pluginDetail: PluginDetail;
  moduleFactory: NgModuleFactory<any>;
  moduleRef: NgModuleRef<any>;
}

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
  entryPoint: string;
  languages: { [key: string]: string };
  changeLogs?: { [key: string]: string };
}
